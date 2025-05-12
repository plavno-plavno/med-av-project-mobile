import {
  useEffect,
  useRef, useState,
} from 'react';
import { Socket } from 'socket.io-client';
import { useAuthMeQuery } from 'src/api/userApi/userApi';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc"
import { iceServersConfig } from '@utils/iceServers';

export enum PeerConnectionType {
  USER = 'user',
  SHARING = 'sharing',
  RECORDING = 'recording'
}

export enum UserActions {
  MuteAudio = 'mute-audio',
  UnmuteAudio = 'unmute-audio',
  MuteVideo = 'mute-video',
  UnmuteVideo = 'unmute-video',
  StartShareScreen = 'start-share-screen',
  StopShareScreen = 'stop-share-screen',
  StartRecording = 'start-recording',
  StopRecording = 'stop-recording',
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export const useMeetingRecording = (roomId: string | null) => {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mainPeerConnectionRef = useRef<RTCPeerConnection | null>();
  const recordingPeerConnectionRef = useRef<RTCPeerConnection | null>();
  const recordingStreamRef = useRef<MediaStream | null>(null);

    const { data: authMeData } = useAuthMeQuery()
    const userRefId = useRef<number>();
    userRefId.current = authMeData?.id

  const isRecordingStartedRef = useRef(false);

  const roomIdRef = useRef<string | null>(roomId);

  const socketRef = useRef<Socket | null>(null);

  const updatePeerConnections = (peerConnection: RTCPeerConnection) => {
    mainPeerConnectionRef.current = peerConnection;
  };

  const createPeerConnection = () => {
    if (recordingPeerConnectionRef.current) {
      return recordingPeerConnectionRef.current;
    }
    try {
      const pc = new RTCPeerConnection(iceServersConfig);

      pc.addEventListener("icecandidate", ({ candidate }) => {
        if (candidate) {
          socketRef.current?.emit('candidate', {
            candidate,
            roomId: roomIdRef.current,
            type: PeerConnectionType.RECORDING,
          });
        }
      });

      pc.addEventListener("connectionstatechange", () => {
        if (pc.connectionState === 'failed') {
          console.error('Connection failed. Consider renegotiating or restarting the connection.');
        }
      });

      return pc;
    } catch (error) {
      console.error('Failed to create PeerConnection:', error);
      throw new Error('Could not create RTCPeerConnection');
    }
  };

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('candidate', handleCandidate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('offer', handleOffer);
        socketRef.current.off('answer', handleAnswer);
        socketRef.current.off('candidate', handleCandidate);
      }
    };
  }, [socketRef.current]);

  const startRecording = async () => {
    try {
      if (isRecordingStartedRef.current) {
        return;
      }
      if (!mainPeerConnectionRef.current) {
        console.error('PeerConnections do not exist!');
        return;
      }

      if (!recordingPeerConnectionRef.current) {
        recordingPeerConnectionRef.current = createPeerConnection();
      }

      const screenStream = await mediaDevices.getDisplayMedia();
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        console.error('No video track available for screen recording');
        return;
      }

      const combinedStream = new MediaStream();
      combinedStream.addTrack(screenTrack);

      // mainPeerConnectionRef.current.getReceivers().forEach((receiver) => {
      //   if (receiver.track && receiver.track.kind === 'audio') {
      //     combinedStream.addTrack(receiver.track);
      //   }
      // });

      mainPeerConnectionRef.current.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'audio') {
          combinedStream.addTrack(sender.track);
        }
      });

      mediaStreamRef.current = combinedStream;

      if (recordingPeerConnectionRef.current) {
        combinedStream.getTracks().forEach(track => {
          recordingPeerConnectionRef.current?.addTrack(track, combinedStream);
        });

        const offer = await recordingPeerConnectionRef.current.createOffer({});
        await recordingPeerConnectionRef.current.setLocalDescription(offer);

        socketRef.current?.emit('recording-peer', {
          roomId: roomIdRef.current,
        });

        socketRef.current?.emit('offer', {
          sdp: recordingPeerConnectionRef.current.localDescription,
          roomId: roomIdRef.current,
          type: PeerConnectionType.RECORDING,
        });

        socketRef?.current?.emit('action', {
          roomId: roomIdRef.current,
          action: UserActions.StartRecording,
          socketId: socketRef.current.id,
        });

        recordingStreamRef.current = screenStream;

        isRecordingStartedRef.current = true;

        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting screen recording:', error);
      recordingPeerConnectionRef.current?.close?.()
    }
  };

  const stopRecording = () => {
    try {
      socketRef.current?.emit('action', {
        roomId: roomIdRef.current,
        action: UserActions.StopRecording,
        socketId: socketRef.current.id,
      });

      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          recordingPeerConnectionRef.current?.getSenders().forEach((sender) => {
            if (sender.track === track) {
              recordingPeerConnectionRef.current?.removeTrack(sender);
            }
          });
        });

        setIsRecording(false);

        recordingStreamRef.current = null;
        recordingPeerConnectionRef.current?.close();
        recordingPeerConnectionRef.current = null;
      }

      isRecordingStartedRef.current = false;
    } catch (error) {
      console.error('Error while stopping recording and switching to camera:', error);
    }
  };

  const handleOffer = async ({ sdp }: { sdp: any }) => {
    if (!recordingPeerConnectionRef.current) {
      return;
    }

    try {
      const polite = true;
      const offerCollision = (recordingPeerConnectionRef.current.signalingState === 'have-local-offer' || recordingPeerConnectionRef.current.signalingState === 'have-remote-offer');
      const ignoreOffer = !polite && offerCollision;

      if (ignoreOffer) {
        return;
      }

      const offer = new RTCSessionDescription(sdp);

      await recordingPeerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      await flushCandidates();
      const answer = await recordingPeerConnectionRef.current.createAnswer();
      await recordingPeerConnectionRef.current.setLocalDescription(answer);

      if (recordingPeerConnectionRef.current.localDescription) {
        const localDescription = recordingPeerConnectionRef.current.localDescription as RTCSessionDescription;
        socketRef.current?.emit('answer', {
          sdp: localDescription,
          roomId: roomIdRef.current,
          type: PeerConnectionType.RECORDING,
        });
      } else {
        console.error('Local description is null');
      }
    } catch (error) {
      console.error('Meeting recording Error processing offer:', error);
    }
  };

  const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescription }) => {
    if (!recordingPeerConnectionRef.current) {
      return;
    }
    try {
      if (recordingPeerConnectionRef.current) {
        if (recordingPeerConnectionRef.current.signalingState === 'stable') {
          console.warn('Answer ignored: already stable');
          return;
        }
        await recordingPeerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(sdp));
      }
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const pendingCandidates: RTCIceCandidateInit[] = [];

  const flushCandidates = async () => {
    for (const candidate of pendingCandidates) {
      try {
        if (!candidate.sdpMid && candidate.sdpMLineIndex === null) {
          continue;
        }

        await recordingPeerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding buffered ICE candidate:', error);
      }
    }
    pendingCandidates.length = 0;
  };
  const handleCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    if (!recordingPeerConnectionRef.current) {
      return;
    }
    try {
      if (recordingPeerConnectionRef.current) {
        if (!recordingPeerConnectionRef.current.remoteDescription) {
          pendingCandidates.push(candidate);
          return;
        }
        await recordingPeerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
    updatePeerConnections,
  };
};