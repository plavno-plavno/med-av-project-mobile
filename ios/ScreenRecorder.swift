import Foundation
import ReplayKit
import VideoToolbox

@objc(ScreenRecorder)
class ScreenRecorder: RCTEventEmitter {
    private var compressionSession: VTCompressionSession?
    private var frameCount = 0
    private var isRecording = false
    private var sps: Data?
    private var pps: Data?

    // Defer the ReplayKit singleton until we're on the main thread
    private lazy var captureSession = RPScreenRecorder.shared()

    override init() {
        super.init()
    }

    // ⚠️ Must be true so init happens on main thread (ReplayKit is UIKit-adjacent)
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["onVideoChunk"]
    }

    @objc(startRecording:rejecter:)
    func startRecording(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard !isRecording else {
            reject("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }

        isRecording = true
        frameCount = 0
        setupCompressionSession()

        captureSession.isMicrophoneEnabled = false
        captureSession.startCapture(handler: { [weak self] sampleBuffer, sampleType, error in
            guard let self = self else { return }
            if let err = error {
                self.isRecording = false
                reject("CAPTURE_ERROR", err.localizedDescription, err)
                return
            }
            if sampleType == .video, CMSampleBufferDataIsReady(sampleBuffer) {
                self.processSampleBuffer(sampleBuffer)
            }
        }) { error in
            if let err = error {
                reject("CAPTURE_START_ERROR", err.localizedDescription, err)
            } else {
                resolve(nil)
            }
        }
    }

    @objc(stopRecording:rejecter:)
    func stopRecording(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard isRecording else {
            reject("NOT_RECORDING", "Recording is not active", nil)
            return
        }
        isRecording = false
        frameCount = 0

        // Now safe to capture resolve/reject in this escaping block
        captureSession.stopCapture { error in
            if let err = error {
                reject("STOP_ERROR", err.localizedDescription, err)
            } else {
                resolve(nil)
            }
        }

        // Tear down VideoToolbox session
        if let session = compressionSession {
            VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: .invalid)
            VTCompressionSessionInvalidate(session)
            compressionSession = nil
        }
    }

    private func setupCompressionSession() {
        guard compressionSession == nil else { return }
        let width: Int32 = 720
        let height: Int32 = 1280
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
            compressionSessionOut: &compressionSession
        )
        guard status == noErr, let session = compressionSession else {
            NSLog("❌ VTCompressionSessionCreate failed: \(status)")
            return
        }
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime,    value: kCFBooleanTrue)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Main_AutoLevel)
        VTCompressionSessionPrepareToEncodeFrames(session)
    }

    private func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        guard
            let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
            let session = compressionSession
        else { return }

        let pts = CMTimeMake(value: Int64(frameCount), timescale: 30)
        frameCount += 1
        var flags = VTEncodeInfoFlags()
        let status = VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: imageBuffer,
            presentationTimeStamp: pts,
            duration: .invalid,
            frameProperties: nil,
            sourceFrameRefcon: nil,
            infoFlagsOut: &flags
        )
        if status != noErr {
            NSLog("❌ EncodeFrame error: \(status)")
        }
    }

    private let compressionOutputCallback: VTCompressionOutputCallback = { (
        refCon,
        _,
        status,
        _,
        sampleBuffer
    ) in
        guard
            status == noErr,
            let sb = sampleBuffer,
            CMSampleBufferDataIsReady(sb),
            let block = CMSampleBufferGetDataBuffer(sb)
        else { return }

        let recorder = Unmanaged<ScreenRecorder>
            .fromOpaque(refCon!)
            .takeUnretainedValue()

        var length = 0
        var ptr: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(block,
                                    atOffset: 0,
                                    lengthAtOffsetOut: nil,
                                    totalLengthOut: &length,
                                    dataPointerOut: &ptr)
        guard let p = ptr else { return }

        var data = Data(bytes: p, count: length)

        // (Optionally prepend SPS/PPS for keyframes here...)

        guard !data.isEmpty,
              let base64 = data.base64EncodedString(options: []) as String?,
              !base64.isEmpty
        else { return }

        DispatchQueue.main.async {
            recorder.sendEvent(withName: "onVideoChunk", body: ["chunk": base64])
        }
    }
}
