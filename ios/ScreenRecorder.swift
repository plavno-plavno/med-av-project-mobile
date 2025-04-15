import Foundation
import AVFoundation
import ReplayKit
import React

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {

    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var isRecording = false
    private var chunkSize: Int = 1024 * 1024 // 1 MB
    private var accumulator = Data()
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"]
    }
    
    @objc func setChunkSize(_ size: Int) {
        chunkSize = size
        print("Chunk size set to \(chunkSize) bytes")
    }
    
    @objc func startRecording(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        guard !isRecording else {
            reject("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }
        
        isRecording = true
        let tempPath = NSTemporaryDirectory().appending("temp_video.mp4")
        let outputUrl = URL(fileURLWithPath: tempPath)
        try? FileManager.default.removeItem(at: outputUrl)
        
        do {
            assetWriter = try AVAssetWriter(outputURL: outputUrl, fileType: .mp4)
        } catch {
            reject("WRITER_INIT_FAILED", "Failed to initialize writer", error)
            return
        }
        
        let settings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: 1280,
            AVVideoHeightKey: 720,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 4_000_000, // 4 Mbps
                AVVideoMaxKeyFrameIntervalKey: 30
            ]
        ]
        
        videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        videoInput?.expectsMediaDataInRealTime = true
        
        if let writer = assetWriter, let videoInput = videoInput, writer.canAdd(videoInput) {
            writer.add(videoInput)
        } else {
            reject("INPUT_ADD_FAILED", "Cannot add video input", nil)
            return
        }
        
        writer?.startWriting()
        writer?.startSession(atSourceTime: CMTime.zero)
        
        let recorder = RPScreenRecorder.shared()
        recorder.isMicrophoneEnabled = false
        recorder.startCapture(handler: { [weak self] (sampleBuffer, sampleType, error) in
            guard let self = self else { return }
            if let error = error {
                print("Capture error: \(error.localizedDescription)")
                return
            }
            
            if sampleType == .video, let input = self.videoInput, input.isReadyForMoreMediaData {
                input.append(sampleBuffer)
                
                // Instead of converting to JPEG, get the H.264 encoded sample
                if let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) {
                    var length: Int = 0
                    var dataPointer: UnsafeMutablePointer<Int8>?
                    if CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: &length, totalLengthOut: &length, dataPointerOut: &dataPointer) == noErr,
                       let pointer = dataPointer {
                        let data = Data(bytes: pointer, count: length)
                        self.accumulator.append(data)
                        print("Accumulated data size: \(self.accumulator.count) bytes")
                        if self.accumulator.count >= self.chunkSize {
                            let chunk = self.accumulator.prefix(self.chunkSize)
                            let base64 = chunk.base64EncodedString()
                            self.sendChunkToJS(base64)
                            self.accumulator.removeFirst(self.chunkSize)
                        }
                    }
                }
            }
            
        }, completionHandler: { error in
            if let error = error {
                reject("START_CAPTURE_FAILED", error.localizedDescription, error)
            } else {
                resolve("Recording started")
            }
        })
    }
    
    @objc func stopRecording(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        let recorder = RPScreenRecorder.shared()
        recorder.stopCapture { [weak self] error in
            guard let self = self else { return }
            self.isRecording = false
            self.videoInput?.markAsFinished()
            self.assetWriter?.finishWriting {
                print("Finished writing video.")
                resolve("Recording stopped")
            }
        }
    }
    
    private func sendChunkToJS(_ base64: String) {
        DispatchQueue.main.async {
            self.sendEvent(withName: "onVideoChunk", body: ["chunk": base64])
        }
    }
}
