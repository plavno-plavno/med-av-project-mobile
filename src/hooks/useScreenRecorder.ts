import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { NativeEventEmitter, NativeModules } from "react-native"
import Toast from "react-native-toast-message"

const { ScreenRecorder } = NativeModules

type ChunkData = {
  chunk: string
}

type UseScreenRecorderProps = {
  onChunkReceived?: (chunk: string, type: string) => void;
};

export const useScreenRecorder = ({
  onChunkReceived,
}: UseScreenRecorderProps = {}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const chunksRef = useRef<string[]>([])
  const eventEmitterRef = useRef<NativeEventEmitter>()
  const { t } = useTranslation();

  useEffect(() => {
    eventEmitterRef.current = new NativeEventEmitter(ScreenRecorder)
    const subscription = eventEmitterRef.current.addListener(
      "onVideoChunk",
      (data: ChunkData) => {
        // Store chunk in internal array
        // chunksRef.current.push(data.chunk)
        // Call the callback if provided
        onChunkReceived?.(data.chunk, 'video');
      }
    )

    return () => {
      subscription.remove()
      eventEmitterRef.current?.removeAllListeners('onVideoChunk')
    }
  }, [onChunkReceived]) // Re-run effect if callback changes

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      // chunksRef.current = []
      await ScreenRecorder.startRecording()
      setIsRecording(true)
      Toast.show({
        type: "success",
        text1: t("RecordingStarted"),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording")
      setIsRecording(false)
      Toast.show({
        type: 'error',
        text1: t("FailedToStartRecording"),
      })
    } finally {
      return
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      await ScreenRecorder.stopRecording()
      setIsRecording(false)
      Toast.show({
        type: "success",
        text1: t("RecordingStopped"),
      })
      // const chunks = [...chunksRef.current]
      // chunksRef.current = []
      // return chunks
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop recording")
      setIsRecording(false)
      return []
    }
  }, [])

  const setChunkSize = useCallback((size: number) => {
    ScreenRecorder.setChunkSize(size)
  }, [])

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    setChunkSize,
    // getAllChunks: () => [...chunksRef.current], // Helper to get all accumulated chunks
  }
}
