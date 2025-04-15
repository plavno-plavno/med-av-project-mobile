package com.MedAV

import android.app.Activity
import android.content.Intent
import android.hardware.display.DisplayManager
import android.media.*
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.view.Surface
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.Executors

class ScreenRecorderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var mediaProjection: MediaProjection? = null
    private var mediaCodec: MediaCodec? = null
    private var inputSurface: Surface? = null
    private var mediaProjectionManager: MediaProjectionManager? = null
    private val executorService = Executors.newSingleThreadExecutor()
    private var handlerThread: HandlerThread? = null
    private var handler: Handler? = null
    private var recording = false

    // Default chunk size: 1 MB
    private var chunkSize: Int = 1024 * 1024

    companion object {
        private const val REQUEST_CODE_SCREEN_RECORD = 1001
        private const val FOREGROUND_DELAY_MS = 1000L // 1 second delay
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "ScreenRecorder"
    }

    @ReactMethod
    fun setChunkSize(size: Int) {
        chunkSize = size
        Log.d("ScreenRecorder", "Chunk size set to $chunkSize bytes")
    }

    @ReactMethod
    fun startRecording() {
        val activity = currentActivity
        if (activity == null) {
            Log.e("ScreenRecorder", "Activity is null")
            return
        }
        mediaProjectionManager = activity.getSystemService(Activity.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val intent = mediaProjectionManager!!.createScreenCaptureIntent()
        activity.startActivityForResult(intent, REQUEST_CODE_SCREEN_RECORD, null)
    }

    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == REQUEST_CODE_SCREEN_RECORD && resultCode == Activity.RESULT_OK && data != null) {
            Log.d("ScreenRecorder", "onActivityResult received, starting capture")
            startScreenCapture(resultCode, data)
        }
    }

    // Optional: Start a foreground service if needed (make sure you have ScreenCaptureService properly implemented and declared)
    private fun startForegroundService() {
        val serviceIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(serviceIntent)
        } else {
            reactApplicationContext.startService(serviceIntent)
        }
    }

    private fun startScreenCapture(resultCode: Int, data: Intent) {
        // Start the foreground service
        startForegroundService()

        // Delay to ensure the foreground service is fully active
        Handler(Looper.getMainLooper()).postDelayed({
            mediaProjection = mediaProjectionManager!!.getMediaProjection(resultCode, data)
            if (mediaProjection == null) {
                Log.e("ScreenRecorder", "MediaProjection is null. Foreground service may not be running.")
                return@postDelayed
            }
            Log.d("ScreenRecorder", "MediaProjection started")

            handlerThread = HandlerThread("ScreenRecorderThread")
            handlerThread?.start()
            handler = Handler(handlerThread!!.looper)

            val width = 1280
            val height = 720

            // Use proper densityDpi from device metrics
            val metrics = reactApplicationContext.resources.displayMetrics
            val densityDpi = metrics.densityDpi

            val mediaFormat = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
                setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
                setInteger(MediaFormat.KEY_BIT_RATE, 2_000_000) // 4 Mbps
                setInteger(MediaFormat.KEY_FRAME_RATE, 30) // 60 fps
                setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1) // 1 second between keyframes
            }
            mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
            mediaCodec?.configure(mediaFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            inputSurface = mediaCodec?.createInputSurface()
            mediaCodec?.start()

            Log.d("ScreenRecorder", "MediaCodec configured & started")

            // Create Virtual Display using proper densityDpi
            mediaProjection?.createVirtualDisplay(
                "ScreenRecorder",
                width, height, densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC,
                inputSurface, null, handler
            )
            Log.d("ScreenRecorder", "VirtualDisplay created: ${width}x${height} @ ${densityDpi}dpi")

            recording = true
            startEncodingThread()
        }, FOREGROUND_DELAY_MS)
    }

    private fun startEncodingThread() {
        executorService.execute {
            Log.d("ScreenRecorder", "Encoding thread started")
            try {
                val bufferInfo = MediaCodec.BufferInfo()
                val accumulator = ByteArrayOutputStream()
                while (recording) {
                    // Optionally, force an I-frame every 3 seconds
                    if (System.currentTimeMillis() % 1000 < 100) {  // roughly every 1 second
                        val params = Bundle()
                        params.putInt(MediaCodec.PARAMETER_KEY_REQUEST_SYNC_FRAME, 0)
                        mediaCodec?.setParameters(params)
                        Log.d("ScreenRecorder", "Requested I-frame")
                    }
                    Log.d("ScreenRecorder", "Waiting for output buffer...")
                    val outputBufferIndex = mediaCodec?.dequeueOutputBuffer(bufferInfo, 10000) ?: -1
                    Log.d("ScreenRecorder", "OutputBufferIndex: $outputBufferIndex, flags: ${bufferInfo.flags}")
                    if (outputBufferIndex >= 0) {
                        val outputBuffer = mediaCodec?.getOutputBuffer(outputBufferIndex)
                        // Set proper position and limit to read valid data
                        if (outputBuffer != null && bufferInfo.size > 0) {
                            outputBuffer.position(bufferInfo.offset)
                            outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                            val chunk = ByteArray(bufferInfo.size)
                            outputBuffer.get(chunk)
                            accumulator.write(chunk)
                        }
                        mediaCodec?.releaseOutputBuffer(outputBufferIndex, false)

                        // If accumulator has reached chunkSize, emit the chunk
                        if (accumulator.size() >= chunkSize) {
                            val dataToSend = accumulator.toByteArray()
                            val base64Chunk = Base64.encodeToString(dataToSend, Base64.NO_WRAP)
                            sendChunkToJS(base64Chunk)
                            Log.d("ScreenRecorder", "Chunk sent: ${dataToSend.size} bytes")
                            accumulator.reset()
                        }
                    } else {
                        // If no output, wait a bit to avoid busy looping
                        Thread.sleep(50)
                    }
                }
            } catch (e: Exception) {
                Log.e("ScreenRecorder", "Error in encoding thread: ${e.message}")
            }
        }
    }

    private fun sendChunkToJS(chunk: String) {
        val payload = WritableNativeMap().apply {
            putString("chunk", chunk)
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onVideoChunk", payload)
    }

    @ReactMethod
    fun stopRecording() {
        Log.d("ScreenRecorder", "Stopping recording...")
        recording = false
        stopForegroundService()
        mediaCodec?.stop()
        mediaCodec?.release()
        mediaCodec = null
        mediaProjection?.stop()
        mediaProjection = null
        inputSurface?.release()
        inputSurface = null
        handlerThread?.quitSafely()
        handlerThread = null
        handler = null
        Log.d("ScreenRecorder", "Recording stopped")
    }

    private fun stopForegroundService() {
        val serviceIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
        reactApplicationContext.stopService(serviceIntent)
    }

    override fun onNewIntent(intent: Intent?) {}
}
