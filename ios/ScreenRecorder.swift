import Foundation
import ReplayKit
import React

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {

    private var isRecording = false
    private var chunkSize: Int = 1024 * 1024 // Default chunk size: 1 MB
    private var accumulator = Data() // Accumulate video data
    private var frameCount = 0
    private let frameSkip = 3 // Skip every 3 frames to reduce processing

    override func supportedEvents() -> [String]! {
        print("Supported events requested")
        return ["onVideoChunk"]
    }

    // Встановлення розміру чанку
    @objc func setChunkSize(_ size: Int) {
        chunkSize = size
        print("Chunk size set to \(chunkSize) bytes")
    }

    // Початок запису та збору чанків
    @objc func startRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if isRecording {
            reject("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }

        isRecording = true
        let recorder = RPScreenRecorder.shared()
        recorder.isMicrophoneEnabled = true // Увімкнути запис мікрофона, якщо потрібно

        recorder.startCapture(handler: { [weak self] (sampleBuffer, bufferType, error) in
            guard let self = self else { return }

            if let error = error {
                print("Capture error: \(error.localizedDescription)")
                return
            }

            if bufferType == .video {
                self.processVideoSample(sampleBuffer)
            }
        }, completionHandler: { error in
            if let error = error {
                reject("START_CAPTURE_FAILED", error.localizedDescription, error)
            } else {
                resolve("Recording started")
            }
        })
    }

    // Зупинка запису
    @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isRecording else {
            reject("NOT_RECORDING", "No recording in progress", nil)
            return
        }

        let recorder = RPScreenRecorder.shared()
        recorder.stopCapture { [weak self] error in
            guard let self = self else { return }

            self.isRecording = false
            if let error = error {
                reject("STOP_CAPTURE_FAILED", error.localizedDescription, error)
            } else {
                resolve("Recording stopped")
            }
        }
    }

    // Обробка відео-кадрів
    private func processVideoSample(_ sampleBuffer: CMSampleBuffer) {
        frameCount += 1
        if frameCount % frameSkip != 0 {
            return // Пропускаємо кожен N-ий кадр
        }

        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            print("Failed to get pixel buffer")
            return
        }

        if let compressedData = convertPixelBufferToJPEGData(pixelBuffer) {
            accumulator.append(compressedData)
        }

        print("Accumulated data size: \(accumulator.count) bytes")

        if accumulator.count >= chunkSize {
            let chunk = accumulator.prefix(chunkSize)
            sendChunkToJS(chunk)
            accumulator.removeFirst(chunkSize)
            print("Chunk sent: \(chunk.count) bytes, remaining: \(accumulator.count) bytes")
        }
    }

    // Конвертація CVPixelBuffer у стиснутий JPEG
    private func convertPixelBufferToJPEGData(_ pixelBuffer: CVPixelBuffer) -> Data? {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext()
        
        guard let jpegData = context.jpegRepresentation(of: ciImage, colorSpace: CGColorSpaceCreateDeviceRGB(), options: [:]) else {
            print("Failed to convert to JPEG")
            return nil
        }
        
        return jpegData
    }

    // Відправка чанку у JS
    private func sendChunkToJS(_ chunk: Data) {
        let base64Chunk = chunk.base64EncodedString()
        print("Sending chunk to JS: \(base64Chunk.prefix(50))...") // Логуємо перші 50 символів
        self.sendEvent(withName: "onVideoChunk", body: ["chunk": base64Chunk])
    }
}
