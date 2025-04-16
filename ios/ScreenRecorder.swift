import Foundation
import AVFoundation
import ReplayKit
import React

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var isRecording = false
    private var chunkSize: Int = 1024 * 1024 // 1 MB default
    private var accumulator = Data()
    private let accumulatorQueue = DispatchQueue(label: "com.medav.screenrecorder.accumulator")
    private let processingQueue = DispatchQueue(label: "com.medav.screenrecorder.processing", qos: .userInitiated)
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"]
    }
    
    @objc func setChunkSize(_ size: Int) {
        accumulatorQueue.async { [weak self] in
            self?.chunkSize = size
        }
        print("Chunk size set to \(size) bytes")
    }
    
    @objc func startRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard !isRecording else {
            reject("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }
        
        guard RPScreenRecorder.shared().isAvailable else {
            reject("NOT_AVAILABLE", "Screen recording is not available", nil)
            return
        }
        
        processingQueue.async { [weak self] in
            guard let self = self else { return }
            
            do {
                self.isRecording = true
                let tempPath = NSTemporaryDirectory().appending("temp_video.mp4")
                let outputUrl = URL(fileURLWithPath: tempPath)
                try? FileManager.default.removeItem(at: outputUrl)
                
                self.assetWriter = try AVAssetWriter(outputURL: outputUrl, fileType: .mp4)
                
                let settings: [String: Any] = [
                    AVVideoCodecKey: AVVideoCodecType.h264,
                    AVVideoWidthKey: 1280,
                    AVVideoHeightKey: 720,
                    AVVideoCompressionPropertiesKey: [
                        AVVideoAverageBitRateKey: 6_000_000,         // 6 Mbps - matched with Android
                        AVVideoMaxKeyFrameIntervalKey: 30,           // Match with Android's 1-second I-frame interval at 30fps
                        AVVideoProfileLevelKey: AVVideoProfileLevelH264High31, // Matches Android's High Profile Level 3.1
                        AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC, // Use CABAC for better compression
                        AVVideoExpectedSourceFrameRateKey: 30,       // 30 fps - matched with Android
                        AVVideoMaxKeyFrameIntervalDurationKey: 1,    // 1 second between keyframes
                        AVVideoAllowFrameReorderingKey: false,       // Disable B-frames for lower latency
                        AVVideoAverageBitRateToleranceKey: 1.0,     // Strict bitrate control
                    ]
                ]
                
                self.videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
                self.videoInput?.expectsMediaDataInRealTime = true
                
                if let writer = self.assetWriter, let videoInput = self.videoInput {
                    if writer.canAdd(videoInput) {
                        writer.add(videoInput)
                    } else {
                        throw NSError(domain: "ScreenRecorder", code: -1, userInfo: [NSLocalizedDescriptionKey: "Cannot add video input"])
                    }
                }
                
                self.assetWriter?.startWriting()
                self.assetWriter?.startSession(atSourceTime: CMTime.zero)
                
                let recorder = RPScreenRecorder.shared()
                recorder.isMicrophoneEnabled = false
                
                DispatchQueue.main.async {
                    recorder.startCapture { [weak self] (sampleBuffer, sampleType, error) in
                        guard let self = self else { return }
                        
                        if let error = error {
                            print("Capture error: \(error.localizedDescription)")
                            return
                        }
                        
                        if sampleType == .video {
                            self.processingQueue.async {
                                if let input = self.videoInput, input.isReadyForMoreMediaData {
                                    input.append(sampleBuffer)
                                    
                                    if let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) {
                                        var length: Int = 0
                                        var dataPointer: UnsafeMutablePointer<Int8>?
                                        if CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: &length, totalLengthOut: &length, dataPointerOut: &dataPointer) == noErr,
                                           let pointer = dataPointer {
                                            autoreleasepool {
                                                let data = Data(bytes: pointer, count: length)
                                                self.accumulatorQueue.async {
                                                    self.accumulator.append(data)
                                                    if self.accumulator.count >= self.chunkSize {
                                                        let chunk = self.accumulator.prefix(self.chunkSize)
                                                        let base64 = chunk.base64EncodedString()
                                                        self.sendChunkToJS(base64)
                                                        self.accumulator.removeFirst(self.chunkSize)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } completionHandler: { error in
                        if let error = error {
                            reject("START_CAPTURE_FAILED", error.localizedDescription, error)
                        } else {
                            resolve(nil)
                        }
                    }
                }
            } catch {
                self.isRecording = false
                reject("SETUP_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isRecording else {
            resolve(nil)
            return
        }
        
        RPScreenRecorder.shared().stopCapture { [weak self] error in
            guard let self = self else { return }
            
            self.processingQueue.async {
                if let error = error {
                    reject("STOP_CAPTURE_FAILED", error.localizedDescription, error)
                    return
                }
                
                // Send any remaining data in accumulator
                self.accumulatorQueue.async {
                    if self.accumulator.count > 0 {
                        let remainingData = self.accumulator
                        let base64 = remainingData.base64EncodedString()
                        self.sendChunkToJS(base64)
                        self.accumulator = Data()
                    }
                    
                    self.cleanup()
                    resolve(nil)
                }
            }
        }
    }
    
    private func cleanup() {
        isRecording = false
        videoInput?.markAsFinished()
        assetWriter?.finishWriting {
            print("Finished writing video")
            self.videoInput = nil
            self.assetWriter = nil
        }
    }
    
    private func sendChunkToJS(_ chunk: String) {
        DispatchQueue.main.async {
            self.sendEvent(withName: "onVideoChunk", body: ["chunk": chunk])
        }
    }
}
