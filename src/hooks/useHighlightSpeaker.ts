import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RTCPeerConnection } from "react-native-webrtc";

const useHighlightSpeaker = (peerConnection: RTCPeerConnection | null, participantsToShow: any) => {
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const audioLevelMapRef = useRef<{ [key: string]: number }>({});
  const audioLevelHistory = useRef<{ [key: string]: number[] }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const CHECK_INTERVAL_MS = 200;

  const checkAudioLevels = async () => {
    try{
    if (!peerConnection) return;
    
    const stats = await peerConnection.getStats();
    let maxAudioLevel = 0;
    let newActiveSpeakerId: string | null = null;

    stats?.forEach((report: { type: string; kind: string; trackIdentifier: any; trackId: any; audioLevel: number; mid: number}) => {
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        const trackMidId = report?.mid
        const socketId = participantsToShow?.find((track: any) => track?.mid === String(trackMidId))?.socketId;
        if (socketId) {
          const audioLevel = report.audioLevel ?? 0;
          audioLevelMapRef.current[socketId] = audioLevel;

          if (!audioLevelHistory.current[socketId]) {
            audioLevelHistory.current[socketId] = [];
          }
          audioLevelHistory.current[socketId].push(audioLevel);

          if (audioLevelHistory.current[socketId].length > 5) {
            audioLevelHistory.current[socketId].shift();
          }

          const averageAudioLevel =
            audioLevelHistory.current[socketId].reduce((acc, val) => acc + val, 0) /
            audioLevelHistory.current[socketId].length;

          if (averageAudioLevel > maxAudioLevel && averageAudioLevel > 0.01) {
            maxAudioLevel = averageAudioLevel;
            newActiveSpeakerId = socketId;
          }
        }
      }
    });

    setActiveSpeaker(newActiveSpeakerId ?? null);
    } catch (error) {
      console.log(error, 'error checkAudioLevels');
      setActiveSpeaker(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      intervalRef.current = setInterval(checkAudioLevels, CHECK_INTERVAL_MS);
      // console.log("Started audio level checks.");

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          // console.log("Stopped audio level checks.");
        }
      };
    }, [peerConnection, participantsToShow])
  );

  return activeSpeaker;
};

export default useHighlightSpeaker;
