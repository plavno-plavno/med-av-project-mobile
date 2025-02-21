import Foundation
import ReplayKit
import VideoToolbox
import AVFoundation
import React

@objc(ScreenRecorderModule)
class ScreenRecorderModule: RCTEventEmitter {

  var chunkSize: Int = 1024 * 1024  // Default 1MB chunk
  var accumulatedData = Data()
  var compressionSession: VTCompressionSession?
  var isRecording = false

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onVideoChunk"]
  }

  @objc func setChunkSize(_ size: NSNumber) {
    self.chunkSize = size.intValue
  }

  @objc func startRecording() {
    guard !isRecording else { return }
    isRecording = true
    accumulatedData.removeAll()
    
    let width: Int32 = 720
    let height: Int32 = 1280
    
    var session: VTCompressionSession?
    let status = VTCompressionSessionCreate(allocator: nil,
                                              width: width,
                                              height: height,
                                              codecType: kCMVideoCodecType_H264,
                                              encoderSpecification: nil,
                                              imageBufferAttributes: nil,
                                              compressedDataAllocator: nil,
                                              outputCallback: compressionOutputCallback,
                                              refcon: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
                                              compressionSessionOut: &session)
    if status != noErr {
      print("Error creating compression session: \(status)")
      return
    }
    compressionSession = session
    if let session = compressionSession {
      VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
      VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AverageBitRate, value: NSNumber(value: 5000000))
      VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Main_AutoLevel)
      VTCompressionSessionPrepareToEncodeFrames(session)
    }
    
    let recorder = RPScreenRecorder.shared()
    recorder.isMicrophoneEnabled = true
    recorder.startCapture(handler: { [weak self] (sampleBuffer, sampleBufferType, error) in
      guard let self = self else { return }
      if let error = error {
        print("Capture error: \(error)")
        return
      }
      if sampleBufferType == .video, self.isRecording {
        self.processSampleBuffer(sampleBuffer)
      }
    }, completionHandler: { error in
      if let error = error {
        print("Error starting capture: \(error)")
      } else {
        print("ReplayKit capture started")
      }
    })
  }

  @objc func stopRecording() {
    guard isRecording else { return }
    isRecording = false
    
    RPScreenRecorder.shared().stopCapture { error in
      if let error = error {
        print("Error stopping capture: \(error)")
      } else {
        print("ReplayKit capture stopped")
      }
    }
    
    if let session = compressionSession {
      VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: CMTime.invalid)
      VTCompressionSessionInvalidate(session)
      compressionSession = nil
    }
    
    if !accumulatedData.isEmpty {
      let base64Chunk = accumulatedData.base64EncodedString()
      sendEvent(withName: "onVideoChunk", body: base64Chunk)
      accumulatedData.removeAll()
    }
  }

  func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
    guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
          let session = compressionSession else { return }
    let presentationTimeStamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    let status = VTCompressionSessionEncodeFrame(session,
                                                 imageBuffer: imageBuffer,
                                                 presentationTimeStamp: presentationTimeStamp,
                                                 duration: CMTime.invalid,
                                                 frameProperties: nil,
                                                 sourceFrameRefcon: nil,
                                                 infoFlagsOut: nil)
    if status != noErr {
      print("Error encoding frame: \(status)")
    }
  }

  let compressionOutputCallback: VTCompressionOutputCallback = { (outputCallbackRefCon, sourceFrameRefCon, status, infoFlags, sampleBuffer) in
    let module = Unmanaged<ScreenRecorderModule>.fromOpaque(outputCallbackRefCon!).takeUnretainedValue()
    if status != noErr {
      print("Compression error: \(status)")
      return
    }
    guard let sampleBuffer = sampleBuffer, CMSampleBufferDataIsReady(sampleBuffer) else { return }
    if let dataBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) {
      var lengthAtOffset: Int = 0
      var totalLength: Int = 0
      var dataPointer: UnsafeMutablePointer<Int8>?
      let result = CMBlockBufferGetDataPointer(dataBuffer, atOffset: 0, lengthAtOffsetOut: &lengthAtOffset, totalLengthOut: &totalLength, dataPointerOut: &dataPointer)
      if result == kCMBlockBufferNoErr, let dataPointer = dataPointer {
        let encodedData = Data(bytes: dataPointer, count: totalLength)
        module.accumulateEncodedData(encodedData)
      }
    }
  }

  func accumulateEncodedData(_ data: Data) {
    accumulatedData.append(data)
    if accumulatedData.count >= chunkSize {
      let base64Chunk = accumulatedData.base64EncodedString()
      sendEvent(withName: "onVideoChunk", body: base64Chunk)
      accumulatedData.removeAll()
    }
  }
  
  override func requiresMainQueueSetup() -> Bool {
    return true
  }
}
