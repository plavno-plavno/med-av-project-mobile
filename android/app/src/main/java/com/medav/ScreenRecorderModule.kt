package com.MedAV

import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.*
import android.media.projection.MediaProjection
import android.os.Handler
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.nio.ByteBuffer

class ScreenRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "ScreenRecorder"
    }

    // Default chunk size of 1MB
    private var chunkSize: Int = 1024 * 1024
    private var mediaProjection: MediaProjection? = null
    private var encoder: MediaCodec? = null
    private var virtualDisplay: VirtualDisplay? = null
    @Volatile private var isRecording = false

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun setChunkSize(size: Int) {
        chunkSize = size
    }

    @ReactMethod
    fun startRecording() {
        // NOTE: mediaProjection must be initialized with proper user permission.
        // For this sample, we assume it has been set up already.
        try {
            // Configure encoder format
            val width = 720
            val height = 1280
            val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height)
            format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            format.setInteger(MediaFormat.KEY_BIT_RATE, 4000000) // adjust bitrate as needed
            format.setInteger(MediaFormat.KEY_FRAME_RATE, 30)
            format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)

            // Initialize encoder
            encoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
            encoder?.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            val inputSurface = encoder?.createInputSurface()
            encoder?.start()

            // Create a VirtualDisplay to capture the screen
            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "ScreenRecorder",
                width, height, 1,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                inputSurface,
                null,
                null
            )

            isRecording = true

            // Start a background thread to read encoder output
            Thread {
                val accumulatedData = ByteBuffer.allocate(chunkSize)
                val bufferInfo = MediaCodec.BufferInfo()
                while (isRecording) {
                    val outputIndex = encoder?.dequeueOutputBuffer(bufferInfo, 10000) ?: -1
                    if (outputIndex >= 0) {
                        val encodedData = encoder?.getOutputBuffer(outputIndex)
                        encodedData?.let { buffer ->
                            while (buffer.hasRemaining()) {
                                // If not enough space to add the entire buffer, fill what you can
                                if (accumulatedData.remaining() < buffer.remaining()) {
                                    val limit = buffer.limit()
                                    buffer.limit(buffer.position() + accumulatedData.remaining())
                                    accumulatedData.put(buffer)
                                    buffer.limit(limit)
                                    // Once the chunk is full, send it
                                    sendChunk(accumulatedData.array())
                                    accumulatedData.clear()
                                } else {
                                    accumulatedData.put(buffer)
                                }
                            }
                        }
                        encoder?.releaseOutputBuffer(outputIndex, false)
                    }
                }
            }.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun stopRecording() {
        isRecording = false
        try {
            encoder?.stop()
            encoder?.release()
            virtualDisplay?.release()
            mediaProjection?.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun sendChunk(chunk: ByteArray) {
        // Encode binary data to Base64 and emit it to JavaScript
        val base64Chunk = Base64.encodeToString(chunk, Base64.NO_WRAP)
        val params = Arguments.createMap()
        params.putString("data", base64Chunk)
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onVideoChunk", params)
    }
}
