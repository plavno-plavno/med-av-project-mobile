import { useCallback, useEffect, useRef, useState } from "react"
import { NativeEventEmitter, NativeModules } from "react-native"

const { ScreenRecorder } = NativeModules

type ChunkData = {
  chunk: string
}

type UseScreenRecorderProps = {
  onChunkReceived?: (chunk: string) => void
}

export const useScreenRecorder = ({
  onChunkReceived,
}: UseScreenRecorderProps = {}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chunksRef = useRef<string[]>([])
  const eventEmitterRef = useRef<NativeEventEmitter>()

  useEffect(() => {
    eventEmitterRef.current = new NativeEventEmitter(ScreenRecorder)
    const subscription = eventEmitterRef.current.addListener(
      "onVideoChunk",
      (data: ChunkData) => {
        // Store chunk in internal array
        chunksRef.current.push(data.chunk)
        // Call the callback if provided
        onChunkReceived?.(data.chunk)
      }
    )

    return () => {
      subscription.remove()
    }
  }, [onChunkReceived]) // Re-run effect if callback changes

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      chunksRef.current = []
      await ScreenRecorder.startRecording()
      setIsRecording(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording")
      setIsRecording(false)
    } finally {
      return
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      await ScreenRecorder.stopRecording()
      setIsRecording(false)
      const chunks = [...chunksRef.current]
      chunksRef.current = []
      return chunks
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
    getAllChunks: () => [...chunksRef.current], // Helper to get all accumulated chunks
  }
}
