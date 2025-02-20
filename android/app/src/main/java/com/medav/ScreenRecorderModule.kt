package com.MedAV

import android.media.MediaRecorder
import android.os.Environment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.IOException
import java.util.UUID

class ScreenRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: String? = null
    private var isRecording = false

    override fun getName(): String {
        return "ScreenRecorder"
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "Recording is already in progress")
            return
        }

        val fileName = "recording_${UUID.randomUUID()}.mp4"
        val storageDir = reactApplicationContext.getExternalFilesDir(Environment.DIRECTORY_MOVIES)
        outputFile = storageDir?.absolutePath + "/" + fileName

        mediaRecorder = MediaRecorder().apply {
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            setVideoSize(1080, 1920) // Adjust as needed
            setOutputFile(outputFile)

            try {
                prepare()
                start()
                isRecording = true
                promise.resolve(outputFile)
            } catch (e: IOException) {
                promise.reject("RECORDING_ERROR", "Failed to start recording", e)
            }
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording || mediaRecorder == null) {
            promise.reject("NOT_RECORDING", "No recording in progress")
            return
        }

        try {
            mediaRecorder?.stop()
            mediaRecorder?.release()
            isRecording = false
            promise.resolve(outputFile)
        } catch (e: IllegalStateException) {
            promise.reject("RECORDING_ERROR", "Failed to stop recording", e)
        }
    }

    @ReactMethod
    fun sendVideoAsChunks(filePath: String, chunkSize: Int, promise: Promise) {
        val file = File(filePath)
        if (!file.exists()) {
            promise.reject("FILE_ERROR", "File does not exist")
            return
        }

        try {
            val videoData = file.readBytes()
            val chunks = videoData.toList().chunked(chunkSize)
            promise.resolve(chunks)
        } catch (e: IOException) {
            promise.reject("FILE_ERROR", "Failed to read video file", e)
        }
    }
}