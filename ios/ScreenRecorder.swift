import Foundation
import ReplayKit
import VideoToolbox
import React

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    
    private var videoEncoder: VTCompressionSession?
    private var screenWidth: Int = 0 // Dynamically set based on screen resolution
    private var screenHeight: Int = 0 // Dynamically set based on screen resolution
    private var bitrate: Int = 6_000_000 // Default bitrate (6 Mbps)
    private var fps: Int = 30 // Default frame rate (30 fps)
    private var chunkSize: Int = 1 * 1024 * 1024 // Default chunk size: 1 MB
    private var accumulator = Data()
    private let accumulatorQueue = DispatchQueue(label: "accumulatorQueue")
    private var isRecording = false
    
    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"]
    }
    
    @objc
    func setup(_ config: NSDictionary) {
        self.screenWidth = config["width"] as? Int ?? UIScreen.main.bounds.size.width
        self.screenHeight = config["height"] as? Int ?? UIScreen.main.bounds.size.height
        self.bitrate = config["bitrate"] as? Int ?? 6_000_000
        self.fps = config["fps"] as? Int ?? 30
        
        print("Screen resolution set to \(screenWidth)x\(screenHeight)")
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
        
        setupVideoEncoder()
        
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
            
            // Convert the sample buffer to a pixel buffer
            guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
                print("Failed to get pixel buffer from sample buffer")
                return
            }
            
            // Encode the pixel buffer into H.264
            self.encodeFrame(pixelBuffer)
            
        }, completionHandler: { [weak self] (error) in
            if let error = error {
                reject("START_CAPTURE_FAILED", error.localizedDescription, error)
            } else {
                self?.isRecording = true
                print("Screen recording started successfully")
                resolve("started")
            }
        })
    }
    
    @objc
    func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isRecording else {
            reject("NOT_RECORDING", "Screen recording is not in progress", nil)
            return
        }
        
        RPScreenRecorder.shared().stopCapture { [weak self] (error) in
            if let error = error {
                reject("STOP_CAPTURE_FAILED", error.localizedDescription, error)
            } else {
                self?.cleanup()
                print("Screen recording stopped successfully")
                resolve(nil)
            }
        }
    }
    
    private func setupVideoEncoder() {
        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: Int32(screenWidth),
            height: Int32(screenHeight),
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: { (outputCallbackRefCon, sourceFrameRefCon, status, infoFlags, sampleBuffer) in
                guard let sampleBuffer = sampleBuffer else { return }
                
                // Extract H.264 NAL units from the sample buffer
                var blockBuffer: CMBlockBuffer?
                var formatDescription: CMFormatDescription?
                var sampleSize: Int = 0
                
                CMSampleBufferGetSampleBufferAttributes(sampleBuffer, &blockBuffer)
                CMSampleBufferGetFormatDescription(sampleBuffer, &formatDescription)
                CMSampleBufferGetSampleSize(sampleBuffer, 0, &sampleSize)
                
                guard let buffer = blockBuffer, let desc = formatDescription, sampleSize > 0 else {
                    print("Failed to extract H.264 data from sample buffer")
                    return
                }
                
                var lengthAtOffset = 0
                var totalLength = 0
                var dataPointer: UnsafeMutablePointer<Int8>?
                
                let status = CMBlockBufferGetDataPointer(
                    buffer,
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
                
                // Accumulate the data and emit chunks
                self.accumulatorQueue.async { [weak self] in
                    guard let self = self else { return }
                    
                    self.accumulator.append(data)
                    
                    if self.accumulator.count >= self.chunkSize {
                        let chunk = self.accumulator.prefix(self.chunkSize)
                        self.sendChunkToJS(chunk.base64EncodedString())
                        self.accumulator.removeFirst(self.chunkSize)
                    }
                }
            },
            compressionSessionOut: &videoEncoder
        )
        
        guard status == noErr, let encoder = videoEncoder else {
            print("Failed to create video encoder")
            return
        }
        
        // Set encoder properties
        VTSessionSetProperty(encoder, kVTCompressionPropertyKey_ProfileLevel, kVTProfileLevel_H264_Baseline_AutoLevel)
        VTSessionSetProperty(encoder, kVTCompressionPropertyKey_AverageBitRate, bitrate)
        VTSessionSetProperty(encoder, kVTCompressionPropertyKey_MaxKeyFrameInterval, fps)
        
        // Start the encoder
        VTCompressionSessionPrepareToEncodeFrames(encoder)
    }
    
    private func encodeFrame(_ pixelBuffer: CVPixelBuffer) {
        guard let encoder = videoEncoder else {
            print("Video encoder is not available")
            return
        }
        
        let timestamp = CMTimeMake(value: Int64(CACurrentMediaTime() * 1000), timescale: 1000)
        let duration = CMTimeMake(value: 1, timescale: Int32(fps))
        
        VTCompressionSessionEncodeFrame(
            encoder,
            imageBuffer: pixelBuffer,
            presentationTimeStamp: timestamp,
            duration: duration,
            frameProperties: nil,
            infoFlagsOut: nil
        )
    }
    
    private func sendChunkToJS(_ chunk: String) {
        DispatchQueue.main.async {
            let payload: [String: Any] = ["chunk": chunk]
            self.sendEvent(withName: "onVideoChunk", body: payload)
            print("Sent chunk to JS: \(chunk.count) bytes")
        }
    }
    
    private func cleanup() {
        videoEncoder = nil
        isRecording = false
        accumulatorQueue.sync {
            self.accumulator.removeAll()
        }
        print("Cleaned up resources")
    }
}
