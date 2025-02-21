import Foundation
import ReplayKit
import AVFoundation

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    var chunkSize: Int = 1024 * 1024  // Default chunk size of 1MB
    var accumulatedData = Data()
    let recorder = RPScreenRecorder.shared()
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc func setChunkSize(_ size: NSNumber) {
        chunkSize = size.intValue
    }
    
    @objc func startRecording() {
        recorder.isMicrophoneEnabled = true
        recorder.startCapture(handler: { [weak self] (sampleBuffer, sampleBufferType, error) in
            guard error == nil else {
                print("Error during capture: \(error!.localizedDescription)")
                return
            }
            
            if sampleBufferType == .video {
                self?.handleSampleBuffer(sampleBuffer)
            }
            // Optionally, handle audio sample buffers similarly.
        }) { (error) in
            if let error = error {
                print("Error starting capture: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func stopRecording() {
        recorder.stopCapture { (error) in
            if let error = error {
                print("Error stopping capture: \(error.localizedDescription)")
            }
        }
    }
    
    func handleSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        // For demonstration purposes, we assume the sample buffer contains
        // encoded binary data. In a production app, you might process the buffer
        // with AVAssetWriter to encode the video.
        guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else {
            return
        }
        
        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>? = nil
        if CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &length, dataPointerOut: &dataPointer) == noErr,
           let dataPointer = dataPointer {
            let bufferData = Data(bytes: dataPointer, count: length)
            accumulatedData.append(bufferData)
            if accumulatedData.count >= chunkSize {
                let base64Chunk = accumulatedData.base64EncodedString()
                sendEvent(withName: "onVideoChunk", body: ["data": base64Chunk])
                accumulatedData.removeAll()
            }
        }
    }
    
    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"]
    }
}
