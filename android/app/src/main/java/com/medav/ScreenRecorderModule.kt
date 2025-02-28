package com.MedAV

import android.app.Activity
import android.content.Intent
import android.hardware.display.DisplayManager
import android.media.*
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.view.Surface
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
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
    private var mediaMuxer: MediaMuxer? = null
    private var trackIndex = -1
    private var firstKeyFrame = false

    private val filePath: String
        get() = reactApplicationContext.getExternalFilesDir(null)?.absolutePath + "/screen_record.mp4"

    private var chunkSize: Int = 1024 * 1024 // 1MB
    private lateinit var fileOutputStream: FileOutputStream

    companion object {
        private const val REQUEST_CODE_SCREEN_RECORD = 1001
        private const val FOREGROUND_DELAY_MS = 1000L
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "ScreenRecorder"

    override fun onNewIntent(intent: Intent?) {}

    @ReactMethod
    fun setChunkSize(size: Int) {
        chunkSize = size
        Log.d("ScreenRecorder", "Chunk size set to $chunkSize bytes")
    }

    @ReactMethod
    fun startRecording() {
        val activity = currentActivity ?: run {
            Log.e("ScreenRecorder", "Activity is null")
            return
        }
        mediaProjectionManager =
            activity.getSystemService(Activity.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val intent = mediaProjectionManager!!.createScreenCaptureIntent()
        activity.startActivityForResult(intent, REQUEST_CODE_SCREEN_RECORD, null)
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_CODE_SCREEN_RECORD && resultCode == Activity.RESULT_OK && data != null) {
            Log.d("ScreenRecorder", "onActivityResult received, starting capture")
            startScreenCapture(resultCode, data)
        }
    }

    private fun startForegroundService() {
        val serviceIntent = Intent(reactApplicationContext, ScreenCaptureService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(serviceIntent)
        } else {
            reactApplicationContext.startService(serviceIntent)
        }
    }

    private fun startScreenCapture(resultCode: Int, data: Intent) {
        startForegroundService()

        Handler(Looper.getMainLooper()).postDelayed({
            mediaProjection = mediaProjectionManager!!.getMediaProjection(resultCode, data)
            if (mediaProjection == null) {
                Log.e("ScreenRecorder", "MediaProjection is null. Foreground service may not be running.")
                return@postDelayed
            }
            Log.d("ScreenRecorder", "MediaProjection started")

            handlerThread = HandlerThread("ScreenRecorderThread").apply { start() }
            handler = Handler(handlerThread!!.looper)

            val width = 1280
            val height = 720

            val format = MediaFormat.createVideoFormat("video/avc", width, height)
            format.setInteger(MediaFormat.KEY_BIT_RATE, 5000000)
            format.setInteger(MediaFormat.KEY_FRAME_RATE, 30)
            format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)

            mediaCodec = MediaCodec.createEncoderByType("video/avc")
            mediaCodec?.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            inputSurface = mediaCodec?.createInputSurface()
            mediaCodec?.start()

            mediaMuxer = MediaMuxer(filePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            fileOutputStream = FileOutputStream(filePath)

            mediaProjection?.createVirtualDisplay(
                "ScreenRecorder",
                width, height, 1,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                inputSurface, null, handler
            )

            recording = true
            startEncodingThread()
        }, FOREGROUND_DELAY_MS)
    }

    private fun startEncodingThread() {
        executorService.execute {
            val bufferInfo = MediaCodec.BufferInfo()
            var trackAdded = false
            firstKeyFrame = false

            while (recording) {
                val outputBufferIndex = mediaCodec?.dequeueOutputBuffer(bufferInfo, 10000) ?: -1
                if (outputBufferIndex >= 0) {
                    val outputBuffer = mediaCodec?.getOutputBuffer(outputBufferIndex)
                    if (outputBuffer != null && bufferInfo.size > 0) {
                        val chunk = ByteArray(bufferInfo.size)
                        outputBuffer.get(chunk)

                        synchronized(this) {
                            if (!recording) return@execute

                            if (!trackAdded) {
                                trackIndex = mediaMuxer?.addTrack(mediaCodec!!.outputFormat) ?: -1
                                if (trackIndex >= 0) {
                                    mediaMuxer?.start()
                                    trackAdded = true
                                    Log.d("ScreenRecorder", "Track added to MediaMuxer")
                                } else {
                                    Log.e("ScreenRecorder", "Failed to add track!")
                                    return@execute
                                }
                            }

                            if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_KEY_FRAME) != 0) {
                                firstKeyFrame = true
                            }

                            if (trackAdded && firstKeyFrame) {
                                mediaMuxer?.writeSampleData(trackIndex, ByteBuffer.wrap(chunk), bufferInfo)
                                fileOutputStream.write(chunk)
                                sendChunkToJS(Base64.encodeToString(chunk, Base64.NO_WRAP))
                            } else {
                                Log.w("ScreenRecorder", "Skipping frame, no key frame found yet!")
                            }
                        }
                    }
                    mediaCodec?.releaseOutputBuffer(outputBufferIndex, false)
                }
            }
            stopMuxer()
        }
    }

    private fun stopMuxer() {
        try {
            mediaMuxer?.stop()
            mediaMuxer?.release()
            fileOutputStream.close()
            Log.d("ScreenRecorder", "MediaMuxer stopped successfully.")
        } catch (e: Exception) {
            Log.e("ScreenRecorder", "Error stopping muxer: ${e.message}")
        }
        mediaMuxer = null
    }

    private fun sendChunkToJS(chunk: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onVideoChunk", chunk)
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        Log.d("ScreenRecorder", "Stopping recording...")
        recording = false

        executorService.execute {
            try {
                stopMuxer()
                promise.resolve(filePath)
            } catch (e: Exception) {
                promise.reject("STOP_RECORDING_ERROR", e.message)
            }
        }
    }
}
