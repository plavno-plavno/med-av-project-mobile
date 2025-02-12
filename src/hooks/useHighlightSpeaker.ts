import { useCallback, useRef, useState } from "react";
import useWebRtc from "./useWebRtc";
import { useFocusEffect } from "@react-navigation/native";

const useHighlightSpeaker = () => {
  const { peerConnection, usersAudioTrackToIdMap } = useWebRtc();
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);

  const audioLevelMapRef = useRef<{ [key: string]: number }>({});
  const audioLevelHistory = useRef<{ [key: string]: number[] }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const CHECK_INTERVAL_MS = 5000;

  const checkAudioLevels = async () => {
    if (!peerConnection) return;
    
    const stats = await peerConnection.getStats();
    let maxAudioLevel = 0;
    let newActiveSpeakerId: string | null = null;

    stats?.forEach((report: { type: string; kind: string; trackIdentifier: any; trackId: any; audioLevel: number; }) => {
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        const trackId = report.trackIdentifier || report.trackId;
        const userId = Object.keys(usersAudioTrackToIdMap as Record<string, string>)?.find(
          (key) => (usersAudioTrackToIdMap as Record<string, string>)[key] === trackId
        );

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
