import Foundation
import AVFoundation
import ReplayKit

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    private var recorder = RPScreenRecorder.shared()
    private var writer: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var pipe: Pipe?
    private var fileHandle: FileHandle?
    
    private var chunkSize: Int = 1024 * 1024 // Default chunk size 1MB
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String] {
        return ["onVideoChunk"]
    }

    @objc func setChunkSize(_ size: Int) {
        self.chunkSize = size
        print("Chunk size set to \(chunkSize) bytes")
    }

    @objc func startRecording() {
        let tempPath = NSTemporaryDirectory().appending("temp_video.mp4")
        let outputUrl = URL(fileURLWithPath: tempPath)
        try? FileManager.default.removeItem(at: outputUrl)

        do {
            writer = try AVAssetWriter(outputURL: outputUrl, fileType: .mp4)
            let settings: [String: Any] = [
                AVVideoCodecKey: AVVideoCodecType.h264,           // H.264 codec
                AVVideoWidthKey: 1280,                            // Width: 1280
                AVVideoHeightKey: 720,                           // Height: 720
                AVVideoCompressionPropertiesKey: [
                    AVVideoAverageBitRateKey: 2_000_000,          // 2 Mbps bitrate
                    AVVideoMaxKeyFrameIntervalKey: 30            // 30 fps frame rate
                ]
            ]
            videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
            videoInput?.expectsMediaDataInRealTime = true

            if let writer = writer, let videoInput = videoInput, writer.canAdd(videoInput) {
                writer.add(videoInput)
                writer.startWriting()
                writer.startSession(atSourceTime: .zero)

                recorder.isMicrophoneEnabled = false
                recorder.startCapture(handler: { (sample, type, error) in
                    guard error == nil else { return }

                    if type == .video, let videoInput = self.videoInput, videoInput.isReadyForMoreMediaData {
                        videoInput.append(sample)
                        if let buffer = sample.dataBuffer {
                            var length = 0
                            var dataPointer: UnsafeMutablePointer<Int8>?
                            CMBlockBufferGetDataPointer(buffer, atOffset: 0, lengthAtOffsetOut: &length, totalLengthOut: &length, dataPointerOut: &dataPointer)
                            if let pointer = dataPointer {
                                let data = Data(bytes: pointer, count: length)
                                let base64 = data.base64EncodedString()
                                self.sendChunkToJS(base64: base64)
                            }
                        }
                    }
                }) { error in
                    if let err = error {
                        print("Recording error:", err)
                    }
                }
            }
        } catch {
            print("Failed to start writer:", error)
        }
    }

    @objc func stopRecording() {
        recorder.stopCapture { error in
            if let err = error {
                print("Stop capture error:", err)
            }
            self.writer?.finishWriting {
                print("Finished writing video.")
            }
        }
    }

    private func sendChunkToJS(base64: String) {
        DispatchQueue.main.async {
            self.sendEvent(withName: "onVideoChunk", body: ["chunk": base64])
        }
    }
}
