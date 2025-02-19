import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RTCPeerConnection } from "react-native-webrtc";

const useHighlightSpeaker = (peerConnection: RTCPeerConnection | null, usersAudioTrackToIdMap: any) => {
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);

  const audioLevelMapRef = useRef<{ [key: string]: number }>({});
  const audioLevelHistory = useRef<{ [key: string]: number[] }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const CHECK_INTERVAL_MS = 500;

  const checkAudioLevels = async () => {
    if (!peerConnection) return;
    
    const stats = await peerConnection.getStats();
    let maxAudioLevel = 0;
    let newActiveSpeakerId: string | null = null;

    stats?.forEach((report: { type: string; kind: string; trackIdentifier: any; trackId: any; audioLevel: number; }) => {
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        const trackMidId = report?.mid
        const userId = usersAudioTrackToIdMap[trackMidId];
        if (userId) {
          const audioLevel = report.audioLevel ?? 0;
          audioLevelMapRef.current[userId] = audioLevel;

          if (!audioLevelHistory.current[userId]) {
            audioLevelHistory.current[userId] = [];
          }
          audioLevelHistory.current[userId].push(audioLevel);

          if (audioLevelHistory.current[userId].length > 5) {
            audioLevelHistory.current[userId].shift();
          }

          const averageAudioLevel =
            audioLevelHistory.current[userId].reduce((acc, val) => acc + val, 0) /
            audioLevelHistory.current[userId].length;

          if (averageAudioLevel > maxAudioLevel && averageAudioLevel > 0.01) {
            maxAudioLevel = averageAudioLevel;
            newActiveSpeakerId = userId;
          }
        }
      }
    });

    setActiveSpeaker(newActiveSpeakerId ?? null);
  };

  useFocusEffect(
    useCallback(() => {
      intervalRef.current = setInterval(checkAudioLevels, CHECK_INTERVAL_MS);
      console.log("Started audio level checks.");

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          console.log("Stopped audio level checks.");
        }
      };
    }, [peerConnection, usersAudioTrackToIdMap])
  );

  return activeSpeaker;
};

export default useHighlightSpeaker;
