import { Buffer } from "buffer";
import { useState, useEffect, useRef } from "react";
import AudioRecord, { IAudioRecord } from "react-native-audio-record";
import RNFS from "react-native-fs";

import { requestRecordingPermissions } from "@utils/androidPermissions"


export const useAudioRecorder = ({sendChunkToServer, sendSttAudio}: {sendChunkToServer: (args: any, type: string) => void; sendSttAudio: (data: string) => void;}) => {
    const [timerStart, setTimerStart] = useState<number | null>(null);

    // Refs for mutable state
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRecorderRef = useRef<IAudioRecord | null>(null); // Store the AudioRecord instance
    const isRecordingRef = useRef(false); // To track whether recording is ongoing
    const pcmChunks = useRef<Buffer[]>([]);

    useEffect(() => {
        audioRecorderRef.current = AudioRecord;
        const options = {
            sampleRate: 44100,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // VOICE_RECOGNITION
            wavFile: "voiceSample.wav",
        };
        audioRecorderRef.current.init(options);
        console.log("AudioRecord initialized.");

        return () => {
            // Clean up by stopping recording and clearing timers on unmount
            audioRecorderRef.current?.stop();
            clearInterval(recordingTimerRef.current!);
            audioRecorderRef.current = null; // Clear reference to avoid memory leaks
            isRecordingRef.current = false;
            setTimerStart(null);
        };
    }, []);


    const onStartRecord = async () => {
        if (isRecordingRef.current) return;
        const granted = await requestRecordingPermissions()

        if (!granted) throw new Error('No Permissions')

        console.log("Starting recording...");
        isRecordingRef.current = true;
        setTimerStart(new Date().getTime());

        audioRecorderRef.current?.start();
        // Subscribe to PCM "data" events for speech detection
        audioRecorderRef.current?.on("data", data => {
            if(isRecordingRef.current){
                const pcmData = Buffer.from(data, "base64");
                sendChunkToServer(pcmData, 'audio')
            }
            sendSttAudio(data);
            // pcmChunks.current.push(pcmData);

        });
    };

    const removeFileIfExisted = async (filePath: string) => {
        // Optional: Delete the recorded file
        try {
            console.log("TEMP FILE :", filePath)
            const fileExists = await RNFS.exists(filePath);
            if (fileExists) {
                await RNFS.unlink(filePath);
                console.log("Recording file deleted:", filePath);
            }
        } catch (error) {
            console.warn("Error stopping recorder or file not found.", error);
        }
    }

    const saveRawPcm = async () => {
        try {
            const rawPath = `${RNFS.DocumentDirectoryPath}/audio.raw`;
            await removeFileIfExisted(rawPath)
            await RNFS.writeFile(
                rawPath,
                Buffer.concat(pcmChunks.current).toString('base64'),
                'base64' // <== encoding
            );
            pcmChunks.current = []

            return rawPath;
        } catch (err) {
            console.error('saveRawPcm error: ', err)
            return null
        }
    };

    const onStopRecord = async () => {
        if (!isRecordingRef.current) return;

        clearInterval(recordingTimerRef.current!);

        // const filePath = await audioRecorderRef.current?.stop()!;
        // console.log("Stopping recording...", filePath);
        // try {
        //     // const rawFile = await saveRawPcm()
        //     // console.log("SAVED TO: ", rawFile)
        // } catch (err) { }
        // // Reset flags and state
        // isRecordingRef.current = false;
        // setTimerStart(null);

        // Clear the event listener after stop
        // audioRecorderRef.current?.on("data", () => { }); // Remove the listener

        // const totalRecordingTime = new Date().getTime() - timerStart!;

        // console.log({ totalRecordingTime });

    };

    return {
        onStartRecord,
        onStopRecord,
    };
};
