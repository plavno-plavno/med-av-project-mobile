import { MutableRefObject } from 'react';
import { RTCIceCandidate, RTCPeerConnection } from 'react-native-webrtc';

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export const createCandidatesManager = (
  peerConnectionRef: MutableRefObject<RTCPeerConnection | null>,
) => {
  const pendingCandidates: RTCIceCandidateInit[] = [];

  const addCandidate = (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      if (!peerConnectionRef.current.remoteDescription) {
        pendingCandidates.push(candidate);
        console.warn('Send candidate to the queue');

        return;
      }

      peerConnectionRef.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((error) => {
          console.error('Error adding ICE candidate:', error);
        });
    }
  };

  const flushCandidates = async () => {
    for (const candidate of pendingCandidates) {
      try {
        if (!candidate.sdpMid && candidate.sdpMLineIndex === null) {
          console.warn(
            'Skipping ICE candidate with null sdpMid and sdpMLineIndex.',
          );
          continue;
        }

        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      } catch (error) {
        console.error('Error adding buffered ICE candidate:', error);
      }
    }

    pendingCandidates.length = 0;
  };

  return {
    addCandidate,
    flushCandidates,
  };
};
