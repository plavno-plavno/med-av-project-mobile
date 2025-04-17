import Foundation
import ReplayKit
import AVFoundation
import React

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    
    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var screenWidth: Int = 1280 // Default width
    private var screenHeight: Int = 720 // Default height
    private var bitrate: Int = 6_000_000 // Default bitrate (6 Mbps)
    private var fps: Int = 30 // Default frame rate (30 fps)
    private var chunkSize: Int = 1 * 1024 * 1024 // Default chunk size: 1 MB
    private var accumulator = Data()
    private let accumulatorQueue = DispatchQueue(label: "accumulatorQueue")
    private let processingQueue = DispatchQueue(label: "processingQueue")
    private var isRecording = false
    private var hasStartedWriting = false
    
    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"]
    }
    
    @objc
    func setup(_ config: NSDictionary) {
        self.screenWidth = config["width"] as? Int ?? 1280
        self.screenHeight = config["height"] as? Int ?? 720
        self.bitrate = config["bitrate"] as? Int ?? 6_000_000
        self.fps = config["fps"] as? Int ?? 30
    }
    
    @objc
    func setChunkSize(_ size: Int) {
        self.chunkSize = size
        print("Chunk size set to \(chunkSize) bytes")
    }
    
    @objc
    func startRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard !isRecording else {
            reject("ALREADY_RECORDING", "Screen recording is already in progress", nil)
            return
        }
        
        let outputURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("\(arc4random() % 1000).mp4")
        
        do {
            assetWriter = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
        } catch {
            reject("SETUP_FAILED", error.localizedDescription, error)
            return
        }
        
        let videoSettings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: adjustMultipleOf2(screenWidth),
            AVVideoHeightKey: adjustMultipleOf2(screenHeight),
            AVVideoCompressionPropertiesKey: [
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC,
                AVVideoAverageBitRateKey: bitrate,
                AVVideoMaxKeyFrameIntervalKey: fps,
                AVVideoAllowFrameReorderingKey: false
            ]
        ]
        
        videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        videoInput?.expectsMediaDataInRealTime = true
        
        if let writer = assetWriter, let videoInput = videoInput {
            writer.add(videoInput)
            
            UIApplication.shared.beginBackgroundTask(withName: "ScreenRecording") { [weak self] in
                self?.stopRecording(nil, rejecter: nil)
            }
            
            RPScreenRecorder.shared().isMicrophoneEnabled = false // Disable audio recording
            RPScreenRecorder.shared().startCapture(handler: { [weak self] (sampleBuffer, bufferType, error) in
                guard let self = self else { return }
                
                if let error = error {
                    reject("CAPTURE_FAILED", error.localizedDescription, error)
                    return
                }
                
                guard CMSampleBufferDataIsReady(sampleBuffer), bufferType == .video else {
                    print("Sample buffer is not ready or not a video buffer")
                    return
                }
                
                // Start writing if this is the first video frame
                if self.assetWriter?.status == .unknown && !self.hasStartedWriting {
                    self.assetWriter?.startWriting()
                    self.assetWriter?.startSession(atSourceTime: CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
                    self.hasStartedWriting = true
                    print("Started writing session")
                }
                
                // Append sample buffers if the writer is ready
                if self.assetWriter?.status == .writing, let videoInput = self.videoInput, videoInput.isReadyForMoreMediaData {
                    let success = videoInput.append(sampleBuffer)
                    if success {
                        print("Appended video frame")
                        self.processSampleBuffer(sampleBuffer)
                    } else {
                        print("Failed to append video frame")
                    }
                }
                
                // Handle errors during writing
                if self.assetWriter?.status == .failed {
                    let writerError = self.assetWriter?.error
                    print("AVAssetWriter failed: \(String(describing: writerError?.localizedDescription))")
                    reject("WRITER_FAILED", writerError?.localizedDescription, writerError)
                }
                
            }, completionHandler: { [weak self] (error) in
                if let error = error {
                    reject("START_CAPTURE_FAILED", error.localizedDescription, error)
                } else {
                    self?.isRecording = true
                    print("Screen recording started successfully")
                    resolve("started")
                    
                    // Add a fallback timeout to handle cases where no frames are captured
                    DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
                        guard let self = self else { return }
                        if !self.hasStartedWriting {
                            print("No frames captured within 5 seconds. Stopping recording...")
                            self.stopRecording(nil, rejecter: nil)
                        }
                    }
                }
            })
        }
    }
    
    @objc
    func stopRecording(_ resolve: RCTPromiseResolveBlock?, rejecter reject: RCTPromiseRejectBlock?) {
        guard isRecording else {
            reject?("NOT_RECORDING", "Screen recording is not in progress", nil)
            return
        }
        
        RPScreenRecorder.shared().stopCapture { [weak self] (error) in
            guard let self = self else { return }
            
            if let error = error {
                reject?("STOP_CAPTURE_FAILED", error.localizedDescription, error)
                return
            }
            
            guard let writer = self.assetWriter else {
                reject?("WRITER_ERROR", "Asset writer is not available", nil)
                return
            }
            
            // Ensure the writer is in the correct state before finishing
            if writer.status == .writing {
                self.videoInput?.markAsFinished()
                print("Marked video input as finished")
            }
            
            // Handle cases where the writer never started
            if writer.status == .unknown {
                print("AVAssetWriter was never started. Cleaning up...")
                self.cleanup()
                reject?("WRITER_ERROR", "AVAssetWriter was never started", nil)
                return
            }
            
            writer.finishWriting {
                DispatchQueue.main.async {
                    if writer.status == .completed {
                        let result = ["outputURL": writer.outputURL.absoluteString]
                        resolve?(result)
                        print("Recording stopped successfully. Cleaning up... \(result)")
                        self.cleanup()
                    } else if writer.status == .failed {
                        let writerError = writer.error
                        reject?("WRITER_FAILED", writer.error?.localizedDescription, writerError)
                        print("AVAssetWriter failed: \(String(describing: writerError?.localizedDescription))")
                        self.cleanup()
                    }
                }
            }
        }
    }
    
    private func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else {
            print("Failed to get block buffer from sample buffer")
            return
        }
        
        var lengthAtOffset = 0
        var totalLength = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        
        let status = CMBlockBufferGetDataPointer(
            blockBuffer,
            atOffset: 0,
            lengthAtOffsetOut: &lengthAtOffset,
            totalLengthOut: &totalLength,
            dataPointerOut: &dataPointer
        )
        guard status == kCMBlockBufferNoErr, let pointer = dataPointer, totalLength > 0 else {
            print("Failed to get data pointer from block buffer")
            return
        }
        
        let data = Data(bytes: pointer, count: totalLength)
        accumulatorQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.accumulator.append(data)
            
            if self.accumulator.count >= self.chunkSize {
                let chunk = self.accumulator.prefix(self.chunkSize)
                self.sendChunkToJS(chunk.base64EncodedString())
                self.accumulator.removeFirst(self.chunkSize)
            }
        }
    }
    
    private func sendChunkToJS(_ chunk: String) {
        DispatchQueue.main.async {
            let payload: [String: Any] = ["chunk": chunk]
            self.sendEvent(withName: "onVideoChunk", body: payload)
            print("Sent chunk to JS: \(chunk.count) bytes")
        }
    }
    
    private func cleanup() {
        accumulatorQueue.sync {
            self.accumulator.removeAll()
        }
        
        videoInput = nil
        assetWriter = nil
        isRecording = false
        hasStartedWriting = false
        print("Cleaned up resources")
    }
    
    private func adjustMultipleOf2(_ value: Int) -> Int {
        return value % 2 == 1 ? value + 1 : value
    }
}
