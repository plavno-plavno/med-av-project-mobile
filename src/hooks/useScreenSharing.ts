import {
  useRef, useEffect, useState,
} from 'react';
import { Socket } from 'socket.io-client';

import { useAuthMeQuery } from 'src/api/userApi/userApi';
import { mediaDevices, MediaStream, MediaStreamTrack, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { createCandidatesManager } from '@utils/candidatesManager';
import { subscribeToSocketEvents, unsubscribeFromSocketEvents } from '@utils/manageSocketListeners';
import { ParticipantsInfo } from './useWebRtc';
import { PeerConnectionType, RTCAnswerPayload, RTCCandidatePayload, RTCOfferPayload, UserActions } from '@utils/meeting';
import { createPeerConnection } from '@utils/peerConnections';

export const useScreenSharing = (roomId: string | null, rtcSocket: Socket | null, mainPeerConnection: any) => {
  const { data: authMeData } = useAuthMeQuery()
  const userRefId = useRef<string | number>();
  userRefId.current = authMeData?.id;

  const socketRef = useRef<Socket | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const candidatesManager = useRef(
    createCandidatesManager(peerConnection),
  ).current;

  const roomIdRef = useRef<string | null>(roomId);
  const [sharedScreen, setSharedScreen] = useState<MediaStreamTrack | null>(
    null,
  );
  const screenSharingRef = useRef<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const sharingOwnerRef = useRef<string | null>(null);
  const mySocketId = useRef<string | null>(null);

  const isSharingStartedRef = useRef(false);
  const screenStreamRef = useRef<MediaStream | null>(null);


  useEffect(() => {
    if(rtcSocket?.id && roomId && mainPeerConnection) {
      roomIdRef.current = roomId;
      screenSharingRef.current = isScreenSharing;
      socketRef.current = rtcSocket;
      mySocketId.current = rtcSocket?.id;
    }
  }, [roomId, isScreenSharing, rtcSocket?.id, mainPeerConnection]);

// useEffect(() => {
//   if (!peerConnection.current && mainPeerConnection) {
//       peerConnection.current = createPeerConnection({
//         setSharedScreen,
//         setIsScreenSharing,
//         type: PeerConnectionType.SHARING,
//       });
//       socketRef.current?.emit('sharing-peer', {
//         roomId: roomIdRef.current,
//       });
//   }
// }, [mainPeerConnection])

  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    const handlers = {
      offer: handleOffer,
      answer: handleAnswer,
      candidate: handleCandidate,
      'user-joined': handleUserJoined,
      'start-share-screen': handleStartSharing,
      'stop-share-screen': handleStopSharing,
      disconnect: handleDisconnect,
    };

    subscribeToSocketEvents(socketRef.current, handlers);

    return () => {
      if (socketRef.current) {
        unsubscribeFromSocketEvents(socketRef.current, handlers);
      }

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      setSharedScreen(null);
      setIsScreenSharing(false);
    };
  }, [socketRef.current]);

  const handleDisconnect = () => {
    stopScreenShare();
    peerConnection.current?.close();
    peerConnection.current = null;
  };

  const handleUserJoined = ({
    participantsInfo,
    socketId,
  }: {
    participantsInfo: ParticipantsInfo[];
    socketId: string;
  }) => {
    const anySharingOn = participantsInfo.some((p) => p.status.isSharingOn);

    if (anySharingOn) {
      const sharingOwner = participantsInfo.find(
        (p) => p.status.isSharingOn === true,
      );
      sharingOwnerRef.current = sharingOwner?.socketId || '';
    }

    if (socketId === mySocketId.current) {
      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection({
          setSharedScreen,
          setIsScreenSharing,
          type: PeerConnectionType.SHARING,
        });
      }

      socketRef.current?.emit('sharing-peer', {
        roomId: roomIdRef.current,
      });
    }

    setIsScreenSharing(anySharingOn);
  };

  const handleStartSharing = ({ socketId }: { socketId: string }) => {
    setIsScreenSharing(true);
    sharingOwnerRef.current = socketId;
  };

  const handleStopSharing = () => {
    setIsScreenSharing(false);
    sharingOwnerRef.current = null;
  };

  const startScreenShare = async () => {
    try {
      if (isSharingStartedRef.current) {
        return;
      }

      const screenStream = await mediaDevices.getDisplayMedia();

      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        console.error('No video track available for screen sharing');

        return;
      }

      if (peerConnection.current) {
        peerConnection.current.addTrack(screenTrack, screenStream);

        const offer = await peerConnection.current.createOffer({});
        await peerConnection.current.setLocalDescription(offer);

        socketRef.current?.emit('offer', {
          sdp: peerConnection.current.localDescription,
          roomId: roomIdRef.current,
          type: PeerConnectionType.SHARING,
        });

        socketRef?.current?.emit('action', {
          roomId: roomIdRef.current,
          action: UserActions.StartShareScreen,
          socketId: socketRef.current.id,
        });

        screenStreamRef.current = screenStream;

        isSharingStartedRef.current = true;
      }
      screenTrack.addEventListener('ended', () => {
        stopScreenShare();
      })
    } catch (error) {
      console.error('Error starting screen sharing:', error);
    }
  };

  const stopScreenShare = async () => {
    if (!screenSharingRef || sharingOwnerRef.current !== mySocketId.current) {
      return;
    }

    try {
      socketRef.current?.emit('action', {
        roomId: roomIdRef.current,
        action: UserActions.StopShareScreen,
        socketId: socketRef.current.id,
      });

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          peerConnection.current?.getSenders().forEach((sender) => {
            if (sender.track === track) {
              peerConnection.current?.removeTrack(sender);
            }
          });
        });

        screenStreamRef.current = null;
      }

      setIsScreenSharing(false);

      isSharingStartedRef.current = false;
    } catch (error) {
      console.error(
        'Error while stopping screen share and switching to camera:',
        error,
      );
    }
  };

  const handleOffer = async ({ sdp, peerType }: RTCOfferPayload) => {
    if (peerType !== PeerConnectionType.SHARING) {
      return;
    }

    try {
      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection({
          setSharedScreen,
          type: PeerConnectionType.SHARING,
        });

        peerConnection.current.addTransceiver('video', {
          direction: 'recvonly',
        });
      }

      const polite = true;
      const offerCollision =
        peerConnection.current.signalingState === 'have-local-offer' ||
        peerConnection.current.signalingState === 'have-remote-offer';
      const ignoreOffer = !polite && offerCollision;

      if (ignoreOffer) {
        console.warn('🚫 Ignoring offer due to collision');

        return;
      }

      const offer = new RTCSessionDescription(sdp);

      await peerConnection.current.setRemoteDescription(offer);
      await candidatesManager.flushCandidates();

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      if (peerConnection.current.localDescription) {
        socketRef.current?.emit('answer', {
          sdp: peerConnection.current.localDescription,
          roomId: roomIdRef.current,
          type: PeerConnectionType.SHARING,
        });
      } else {
        console.error('❌ Local description is null');
      }
    } catch (error) {
      console.error('❌ Error processing offer:', error);
    }
  };
  

  const handleAnswer = async ({ sdp, peerType }: RTCAnswerPayload) => {
    if (peerType !== PeerConnectionType.SHARING) {
      return;
    }

    try {
      if (peerConnection.current) {
        if (peerConnection.current.signalingState === 'stable') {
          console.warn('Answer ignored: already stable');

          return;
        }

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(sdp),
        );
      }
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const handleCandidate = ({ candidate, peerType }: RTCCandidatePayload) => {
    if (peerType === PeerConnectionType.SHARING) {
      candidatesManager.addCandidate(candidate);
    }
  };

  return {
    startScreenShare,
    stopScreenShare,
    sharingOwner: sharingOwnerRef.current,
    isScreenSharing,
    sharedScreen,
  };
};
