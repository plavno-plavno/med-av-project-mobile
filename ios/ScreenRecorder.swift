import Foundation
import ReplayKit
import React
import AVFoundation

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {

    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var isRecording = false
    private var chunkSize: Int = 1024 * 1024 // 1MB chunks
    private var buffer: Data = Data()

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc func startRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        if isRecording {
            reject("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }

        let fileURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("recording.mp4")
        do {
            assetWriter = try AVAssetWriter(outputURL: fileURL, fileType: .mp4)
            let videoOutputSettings: [String: Any] = [
                AVVideoCodecKey: AVVideoCodecType.h264,
                AVVideoWidthKey: UIScreen.main.bounds.width,
                AVVideoHeightKey: UIScreen.main.bounds.height
            ]
            videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoOutputSettings)
            videoInput?.expectsMediaDataInRealTime = true
            print("videoInput", videoInput)
            if let videoInput = videoInput, assetWriter!.canAdd(videoInput) {
                assetWriter!.add(videoInput)
            }

            assetWriter!.startWriting()
            assetWriter!.startSession(atSourceTime: CMTime.zero)
            isRecording = true
            print("assetWriter", assetWriter)

            print("self.buffer", self.buffer)
            resolve(fileURL.absoluteString)

        //     DispatchQueue.global().async {
        //     while self.isRecording {
        //         self.emitChunk(self.buffer)
        //         sleep(3) // Simulating periodic chunk emission
        //     }
        // }
         DispatchQueue.global().async {
            while self.isRecording {
                self.emitChunk(self.buffer)
                sleep(3)
            }
        }
        } catch {
            reject("RECORDING_ERROR", "Failed to start recording", error)
        }
    }

    @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isRecording, let assetWriter = assetWriter else {
            reject("NOT_RECORDING", "No recording in progress", nil)
            return
        }

        videoInput?.markAsFinished()
        assetWriter.finishWriting {
            self.isRecording = false
            resolve(assetWriter.outputURL.absoluteString)
        }
    }

    @objc func sendVideoAsChunks(_ filePath: String, chunkSize: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let fileURL = URL(fileURLWithPath: filePath)
        do {
            let videoData = try Data(contentsOf: fileURL)
            let chunks = stride(from: 0, to: videoData.count, by: chunkSize).map {
                videoData.subdata(in: $0 ..< min($0 + chunkSize, videoData.count))
            }
            NSLog("chunks", chunks)
            resolve(chunks)
        } catch {
            reject("FILE_ERROR", "Failed to read video file", error)
        }
    }

    override func supportedEvents() -> [String]! {
        return ["onChunk"]
    }

    private func emitChunk(_ chunk: Data) {
        let base64Chunk = chunk.base64EncodedString()
        self.sendEvent(withName: "onChunk", body: base64Chunk)
    }
}
