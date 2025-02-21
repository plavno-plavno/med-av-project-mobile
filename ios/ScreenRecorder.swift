import Foundation
import ReplayKit
import React
import AVKit

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter, RPScreenRecorderDelegate, RPPreviewViewControllerDelegate {

    private var isRecording = false
    private var startRecordingResolve: RCTPromiseResolveBlock?
    private var startRecordingReject: RCTPromiseRejectBlock?
    private var chunkSize: Int = 1024 * 1024 // Default chunk size: 1 MB
    private var accumulator = Data() // Accumulate video data
    private var outputFileURL: URL? // URL to save the final recording

    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"] // Event name for sending chunks to JS
    }

    // Set chunk size from JavaScript
    @objc func setChunkSize(_ size: Int) {
        chunkSize = size
        print("Chunk size set to \(chunkSize) bytes")
    }

    // Check and stop any active recording session
    @objc func checkAndStopActiveSession() {
        let recorder = RPScreenRecorder.shared()

        if recorder.isRecording {
            recorder.stopRecording { [weak self] (previewViewController, error) in
                if let error = error {
                    print("Failed to stop active recording session: \(error.localizedDescription)")
                } else {
                    print("Stopped active recording session")
                }
            }
        } else if recorder.isAvailable {
            recorder.stopCapture { [weak self] (error) in
                if let error = error {
                    print("Failed to stop active capture session: \(error.localizedDescription)")
                } else {
                    print("Stopped active capture session")
                }
            }
        }
    }

    // Reset the recorder state
    @objc func resetRecorder() {
        let recorder = RPScreenRecorder.shared()

        if recorder.isRecording {
            recorder.stopRecording { [weak self] (previewViewController, error) in
                if let error = error {
                    print("Failed to stop recording: \(error.localizedDescription)")
                } else {
                    print("Recording stopped")
                }
            }
        }

        if recorder.isAvailable {
            recorder.stopCapture { [weak self] (error) in
                if let error = error {
                    print("Failed to stop capture: \(error.localizedDescription)")
                } else {
                    print("Capture stopped")
                }
            }
        }
    }

    @objc func startRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Reset the recorder state
        self.resetRecorder()

        if isRecording {
            reject("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }

        self.startRecordingResolve = resolve
        self.startRecordingReject = reject
        self.isRecording = true

        let recorder = RPScreenRecorder.shared()
        recorder.delegate = self

        recorder.startRecording { [weak self] (error) in
            guard let self = self else { return }

            if let error = error {
                self.startRecordingReject?("RECORDING_FAILED", error.localizedDescription, error)
                self.startRecordingResolve = nil
                self.startRecordingReject = nil
                self.isRecording = false
            } else {
                self.startRecordingResolve?("Recording started")
                self.startRecordingResolve = nil
                self.startRecordingReject = nil
            }
        }
    }

    @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isRecording else {
            reject("NOT_RECORDING", "No recording in progress", nil)
            return
        }

        let recorder = RPScreenRecorder.shared()

        recorder.stopRecording { [weak self] (previewViewController, error) in
            guard let self = self else { return }

            if let error = error {
                reject("RECORDING_FAILED", error.localizedDescription, error)
            } else if let previewViewController = previewViewController {
                previewViewController.previewControllerDelegate = self

                if let rootViewController = self.getRootViewController() {
                    rootViewController.present(previewViewController, animated: true, completion: nil)
                } else {
                    reject("ROOT_VIEW_CONTROLLER_NOT_FOUND", "Failed to find root view controller", nil)
                }

                resolve("Recording stopped")
            }

            self.isRecording = false
            self.saveFinalRecording() // Save the final recording
            self.showFinalRecording() // Display the final recording
        }
    }

    private func startCollectingChunks() {
        let recorder = RPScreenRecorder.shared()
        recorder.isMicrophoneEnabled = true // Enable microphone if needed

        // Start capturing video samples
        recorder.startCapture(handler: { [weak self] (sampleBuffer, bufferType, error) in
            guard let self = self else { return }

            if bufferType == .video {
                self.processVideoSample(sampleBuffer) // Process the video sample
            }
        }, completionHandler: { (error) in
            if let error = error {
                print("Error starting capture: \(error.localizedDescription)")
            }
        })
    }

    private func processVideoSample(_ sampleBuffer: CMSampleBuffer) {
        guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            print("Failed to get image buffer from sample buffer")
            return
        }

        CVPixelBufferLockBaseAddress(imageBuffer, .readOnly)
        defer {
            CVPixelBufferUnlockBaseAddress(imageBuffer, .readOnly)
        }

        guard let baseAddress = CVPixelBufferGetBaseAddress(imageBuffer) else {
            print("Failed to get base address of pixel buffer")
            return
        }
        let dataSize = CVPixelBufferGetDataSize(imageBuffer)

        let data = Data(bytes: baseAddress, count: dataSize)
        accumulator.append(data)

        print("Accumulated data size: \(accumulator.count)")

        if accumulator.count >= chunkSize {
            let chunk = accumulator.subdata(in: 0..<chunkSize)
            sendChunkToJS(chunk)
            accumulator.removeSubrange(0..<chunkSize)
            print("Chunk sent: \(chunk.count) bytes")
        }
    }

    private func sendChunkToJS(_ chunk: Data) {
        let base64Chunk = chunk.base64EncodedString()
        print("Sending chunk to JS: \(base64Chunk.prefix(50))...") // Log first 50 characters
        self.sendEvent(withName: "onVideoChunk", body: ["chunk": base64Chunk])
    }

    private func saveFinalRecording() {
        let fileManager = FileManager.default
        let documentsDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let outputFileName = "recording_\(Date().timeIntervalSince1970).mp4"
        outputFileURL = documentsDirectory.appendingPathComponent(outputFileName)

        guard let outputFileURL = outputFileURL else {
            print("Failed to create output file URL")
            return
        }

        do {
            try accumulator.write(to: outputFileURL)
            print("Final recording saved to: \(outputFileURL)")
        } catch {
            print("Failed to save final recording: \(error.localizedDescription)")
        }
    }

    private func showFinalRecording() {
        guard let outputFileURL = outputFileURL else {
            print("No recording file found")
            return
        }

        let player = AVPlayer(url: outputFileURL)
        let playerViewController = AVPlayerViewController()
        playerViewController.player = player

        if let rootViewController = self.getRootViewController() {
            rootViewController.present(playerViewController, animated: true) {
                player.play()
            }
        }
    }

    private func getRootViewController() -> UIViewController? {
        if #available(iOS 13.0, *) {
            let scenes = UIApplication.shared.connectedScenes
            let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
            return windowScene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
        } else {
            return UIApplication.shared.keyWindow?.rootViewController
        }
    }
}
