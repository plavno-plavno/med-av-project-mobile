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
import java.util.concurrent.atomic.AtomicBoolean

class ScreenRecorderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var mediaProjection: MediaProjection? = null
    private var mediaCodec: MediaCodec? = null
    private var inputSurface: Surface? = null
    private var mediaProjectionManager: MediaProjectionManager? = null
    private val executorService = Executors.newSingleThreadExecutor()
    private var handlerThread: HandlerThread? = null
    private var handler: Handler? = null
    private val isRecording = AtomicBoolean(false)
    private var currentPromise: Promise? = null

    // Default chunk size: 1 MB
    private var chunkSize: Int = 1024 * 1024
    private val accumulator = ByteArrayOutputStream()
    private val accumulatorLock = Object()

    companion object {
        private const val TAG = "ScreenRecorderModule"
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
        Log.d(TAG, "Chunk size set to $chunkSize bytes")
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("ACTIVITY_NULL", "Activity is null")
                return
            }
            if (isRecording.get()) {
                promise.reject("ALREADY_RECORDING", "Screen recording is already in progress")
                return
            }
            currentPromise = promise
            mediaProjectionManager = activity.getSystemService(Activity.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val intent = mediaProjectionManager!!.createScreenCaptureIntent()
            activity.startActivityForResult(intent, REQUEST_CODE_SCREEN_RECORD, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting recording", e)
            promise.reject("START_ERROR", e.message, e)
        }
    }

    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == REQUEST_CODE_SCREEN_RECORD) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                Log.d(TAG, "onActivityResult received, starting capture")
                startScreenCapture(resultCode, data)
            } else {
                currentPromise?.reject("PERMISSION_DENIED", "Screen capture permission denied")
                currentPromise = null
            }
        }
    }

    private fun startForegroundService() {
        val serviceIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(serviceIntent)
        } else {
            reactApplicationContext.startService(serviceIntent)
        }
    }

    private fun startScreenCapture(resultCode: Int, data: Intent) {
        try {
            startForegroundService()

            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    mediaProjection = mediaProjectionManager!!.getMediaProjection(resultCode, data)
                    if (mediaProjection == null) {
                        throw Exception("MediaProjection is null")
                    }
                    Log.d(TAG, "MediaProjection started")

                    handlerThread = HandlerThread("ScreenRecorderThread")
                    handlerThread?.start()
                    handler = Handler(handlerThread!!.looper)

                    setupMediaCodec()
                    setupVirtualDisplay()

                    isRecording.set(true)
                    startEncodingThread()
                    currentPromise?.resolve(null)
                } catch (e: Exception) {
                    Log.e(TAG, "Error in startScreenCapture", e)
                    cleanup()
                    currentPromise?.reject("SETUP_ERROR", e.message, e)
                }
                currentPromise = null
            }, FOREGROUND_DELAY_MS)
        } catch (e: Exception) {
            Log.e(TAG, "Error in startScreenCapture", e)
            cleanup()
            currentPromise?.reject("SETUP_ERROR", e.message, e)
            currentPromise = null
        }
    }

    private fun setupMediaCodec() {
        val width = 1280
        val height = 720
        val metrics = reactApplicationContext.resources.displayMetrics

        val mediaFormat = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
            setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            setInteger(MediaFormat.KEY_BIT_RATE, 6_000_000) // 6 Mbps - matched with iOS
            setInteger(MediaFormat.KEY_FRAME_RATE, 30)      // 30 fps - matched with iOS
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1) // 1 second between keyframes
            // H.264 High Profile for better quality
            setInteger(MediaFormat.KEY_PROFILE, MediaCodecInfo.CodecProfileLevel.AVCProfileHigh)
            setInteger(MediaFormat.KEY_LEVEL, MediaCodecInfo.CodecProfileLevel.AVCLevel31)
            // Additional settings for better compatibility and quality
            setInteger(MediaFormat.KEY_REPEAT_PREVIOUS_FRAME_AFTER, 1000000)
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, width * height)
            // B-frames settings (if supported by the device)
            try {
                setInteger(MediaFormat.KEY_MAX_B_FRAMES, 0) // Disable B-frames for lower latency
            } catch (e: Exception) {
                Log.d(TAG, "B-frames setting not supported on this device")
            }
        }

        // Find an encoder that supports our requirements
        val encoderName = MediaCodecList(MediaCodecList.REGULAR_CODECS).findEncoderForFormat(mediaFormat)
        if (encoderName == null) {
            throw RuntimeException("No suitable encoder found for H.264 High Profile")
        }

        mediaCodec = MediaCodec.createByCodecName(encoderName).apply {
            configure(mediaFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            inputSurface = createInputSurface()
            start()
        }
    }

    private fun setupVirtualDisplay() {
        val width = 1280
        val height = 720
        val metrics = reactApplicationContext.resources.displayMetrics

        mediaProjection?.createVirtualDisplay(
            "ScreenRecorder",
            width, height, metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC,
            inputSurface, null, handler
        )
    }

    private fun startEncodingThread() {
        executorService.execute {
            Log.d(TAG, "Encoding thread started")
            try {
                val bufferInfo = MediaCodec.BufferInfo()
                while (isRecording.get()) {
                    // Request keyframe periodically
                    if (System.currentTimeMillis() % 1000 < 100) {
                        val params = Bundle()
                        params.putInt(MediaCodec.PARAMETER_KEY_REQUEST_SYNC_FRAME, 0)
                        mediaCodec?.setParameters(params)
                    }

                    val outputBufferIndex = mediaCodec?.dequeueOutputBuffer(bufferInfo, 10000) ?: -1
                    if (outputBufferIndex >= 0) {
                        val outputBuffer = mediaCodec?.getOutputBuffer(outputBufferIndex)
                        if (outputBuffer != null && bufferInfo.size > 0) {
                            outputBuffer.position(bufferInfo.offset)
                            outputBuffer.limit(bufferInfo.offset + bufferInfo.size)

                            synchronized(accumulatorLock) {
                                val chunk = ByteArray(bufferInfo.size)
                                outputBuffer.get(chunk)
                                accumulator.write(chunk)

                                if (accumulator.size() >= chunkSize) {
                                    val dataToSend = accumulator.toByteArray()
                                    val base64Chunk = Base64.encodeToString(dataToSend, Base64.NO_WRAP)
                                    sendChunkToJS(base64Chunk)
                                    accumulator.reset()
                                }
                            }
                        }
                        mediaCodec?.releaseOutputBuffer(outputBufferIndex, false)
                    }
                }

                // Send any remaining data
                synchronized(accumulatorLock) {
                    if (accumulator.size() > 0) {
                        val dataToSend = accumulator.toByteArray()
                        val base64Chunk = Base64.encodeToString(dataToSend, Base64.NO_WRAP)
                        sendChunkToJS(base64Chunk)
                        accumulator.reset()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in encoding thread", e)
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
    fun stopRecording(promise: Promise) {
        try {
            Log.d(TAG, "Stopping recording...")
            isRecording.set(false)
            cleanup()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording", e)
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    private fun cleanup() {
        try {
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
            synchronized(accumulatorLock) {
                accumulator.reset()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in cleanup", e)
        }
    }

    private fun stopForegroundService() {
        val serviceIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
        reactApplicationContext.stopService(serviceIntent)
    }

    override fun onNewIntent(intent: Intent?) {}

    override fun onCatalystInstanceDestroy() {
        cleanup()
        super.onCatalystInstanceDestroy()
    }
}
