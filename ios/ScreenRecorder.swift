import Foundation
import ReplayKit
import VideoToolbox

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    private var videoChunkSize: Int = 1 * 1024 * 1024
    private var compressionSession: VTCompressionSession?
    private var isRecording = false
    private var frameCount: Int64 = 0

    // Persistent NAL buffer for video frames
    private var nalUnitAccumulator = Data()

    override static func requiresMainQueueSetup() -> Bool { return true }
    override func supportedEvents() -> [String]! { return ["onVideoChunk"] }

    @objc(setChunkSize:)
    func setChunkSize(_ size: NSNumber) {
        videoChunkSize = size.intValue
        print("[iOS] videoChunkSize set to \(videoChunkSize)")
    }

    @objc(startRecording:rejecter:)
    func startRecording(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard !isRecording else {
            reject("ALREADY_RECORDING", "Already recording", nil)
            return
        }

        isRecording = true
        frameCount = 0
        nalUnitAccumulator = Data()
        setupCompressionSession()

        let recorder = RPScreenRecorder.shared()
        recorder.isMicrophoneEnabled = false  // Ensure no audio is recorded
        recorder.startCapture(
            handler: { [weak self] sampleBuffer, type, error in
                guard let self = self else { return }
                if let err = error {
                    self.isRecording = false
                    reject("CAPTURE_ERROR", err.localizedDescription, err)
                    return
                }
                guard type == .video, CMSampleBufferDataIsReady(sampleBuffer) else { return }
                self.encodeFrame(sampleBuffer)
            },
            completionHandler: { error in
                if let err = error {
                    reject("START_FAILED", err.localizedDescription, err)
                } else {
                    resolve(nil)
                }
            }
        )
    }

    @objc(stopRecording:rejecter:)
    func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isRecording else {
            reject("NOT_RECORDING", "No active recording", nil)
            return
        }

        isRecording = false
        RPScreenRecorder.shared().stopCapture { error in
            if let err = error {
                reject("STOP_FAILED", err.localizedDescription, err)
            } else {
                resolve(nil)
            }
        }

        // Clean up compression session and send remaining chunks
        if let session = compressionSession {
            VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: .invalid)
            VTCompressionSessionInvalidate(session)
            compressionSession = nil
        }

        if !nalUnitAccumulator.isEmpty {
            let b64 = nalUnitAccumulator.base64EncodedString()
            sendEvent(withName: "onVideoChunk", body: ["chunk": b64])
            nalUnitAccumulator = Data()
        }
    }

    private func setupCompressionSession() {
        let width: Int32 = 1280
        let height: Int32 = 720
        var session: VTCompressionSession?
        let status = VTCompressionSessionCreate(
            allocator: nil,
            width: width,
            height: height,
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: compressionOutputCallback,
            refcon: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
            compressionSessionOut: &session
        )
        guard status == noErr, let enc = session else {
            NSLog("❌ VTCompressionSessionCreate failed: \(status)")
            return
        }
        compressionSession = enc

        let props: [(CFString, CFTypeRef)] = [
            (kVTCompressionPropertyKey_RealTime, kCFBooleanTrue),
            (kVTCompressionPropertyKey_ExpectedFrameRate, 30 as CFTypeRef),
            (kVTCompressionPropertyKey_MaxKeyFrameInterval, 30 as CFTypeRef),
            (kVTCompressionPropertyKey_AverageBitRate, 6_000_000 as CFTypeRef),
            (kVTCompressionPropertyKey_ProfileLevel, kVTProfileLevel_H264_High_3_1),
            (kVTCompressionPropertyKey_AllowFrameReordering, kCFBooleanFalse),
            (kVTCompressionPropertyKey_PixelAspectRatio, [
              kCMFormatDescriptionKey_PixelAspectRatioHorizontalSpacing: 1,
              kCMFormatDescriptionKey_PixelAspectRatioVerticalSpacing: 1
          ]  as CFDictionary),
        ]
        for (key, val) in props {
            VTSessionSetProperty(enc, key: key, value: val)
        }

        VTCompressionSessionPrepareToEncodeFrames(enc)
    }

    private func encodeFrame(_ sampleBuffer: CMSampleBuffer) {
        guard let imgBuf = CMSampleBufferGetImageBuffer(sampleBuffer),
              let session = compressionSession else { return }

        // Use current time as timestamp for frame
        let timestamp = CMClockGetTime(CMClockGetHostTimeClock())

        var flags = VTEncodeInfoFlags()
        let status = VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: imgBuf,
            presentationTimeStamp: timestamp,
            duration: .invalid, // optional, can also calculate if you want constant frame time
            frameProperties: nil,
            sourceFrameRefcon: nil,
            infoFlagsOut: &flags
        )
        if status != noErr {
            NSLog("❌ EncodeFrame failed: \(status)")
        }
    }

    private let compressionOutputCallback: VTCompressionOutputCallback = { refCon, _, status, _, sb in
        guard status == noErr,
              let sampleBuffer = sb,
              CMSampleBufferDataIsReady(sampleBuffer),
              let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer)
        else { return }

        let recorder = Unmanaged<ScreenRecorder>.fromOpaque(refCon!).takeUnretainedValue()

        var totalLength: Int = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        let status = CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &totalLength, dataPointerOut: &dataPointer)
        guard status == kCMBlockBufferNoErr, let dataPtr = dataPointer else { return }

        var nalUnitData = Data()

        // Check for keyframe to prepend SPS/PPS
        let attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false)
        var isKeyFrame = true
        if let arr = attachments as? [CFDictionary],
           let attachment = arr.first,
           let val = CFDictionaryGetValue(attachment, Unmanaged.passUnretained(kCMSampleAttachmentKey_NotSync).toOpaque()) {
            isKeyFrame = CFBooleanGetValue(unsafeBitCast(val, to: CFBoolean.self)) == false
        }

        if isKeyFrame, let desc = CMSampleBufferGetFormatDescription(sampleBuffer) {
            var spsPointer: UnsafePointer<UInt8>?, ppsPointer: UnsafePointer<UInt8>?
            var spsSize = 0, ppsSize = 0, spsCount = 0, ppsCount = 0

            CMVideoFormatDescriptionGetH264ParameterSetAtIndex(desc, parameterSetIndex: 0, parameterSetPointerOut: &spsPointer, parameterSetSizeOut: &spsSize, parameterSetCountOut: &spsCount, nalUnitHeaderLengthOut: nil)
            CMVideoFormatDescriptionGetH264ParameterSetAtIndex(desc, parameterSetIndex: 1, parameterSetPointerOut: &ppsPointer, parameterSetSizeOut: &ppsSize, parameterSetCountOut: &ppsCount, nalUnitHeaderLengthOut: nil)

            if let sps = spsPointer, let pps = ppsPointer {
                nalUnitData.append(contentsOf: [0x00, 0x00, 0x00, 0x01])
                nalUnitData.append(UnsafeBufferPointer(start: sps, count: spsSize))
                nalUnitData.append(contentsOf: [0x00, 0x00, 0x00, 0x01])
                nalUnitData.append(UnsafeBufferPointer(start: pps, count: ppsSize))
            }
        }

        // Add NAL units with start code
        let avcHeaderLength = 4
        var offset = 0
        while offset < totalLength {
            var nalLength: UInt32 = 0
            memcpy(&nalLength, dataPtr + offset, avcHeaderLength)
            nalLength = CFSwapInt32BigToHost(nalLength)

            nalUnitData.append([0x00, 0x00, 0x00, 0x01], count: 4)
            nalUnitData.append(Data(bytes: dataPtr + offset + avcHeaderLength, count: Int(nalLength)))
            offset += avcHeaderLength + Int(nalLength)
        }

        recorder.sendVideoChunk(nalUnitData)
    }

    private func sendVideoChunk(_ data: Data) {
        nalUnitAccumulator.append(data)

        while nalUnitAccumulator.count >= videoChunkSize {
            let chunk = nalUnitAccumulator.prefix(videoChunkSize)
            let b64 = chunk.base64EncodedString()
            sendEvent(withName: "onVideoChunk", body: ["chunk": b64])
            nalUnitAccumulator.removeFirst(videoChunkSize)
        }
    }
}
