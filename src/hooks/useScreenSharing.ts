import {
  useRef, useEffect, useState, 
} from 'react';
import { Socket } from 'socket.io-client';

import { getSocket } from './webRtcSocketInstance';
import { useAuthMeQuery } from 'src/api/userApi/userApi';
import { MediaStreamTrack, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { createCandidatesManager } from '@utils/candidatesManager';
import { subscribeToSocketEvents, unsubscribeFromSocketEvents } from '@utils/manageSocketListeners';
import { ParticipantsInfo } from './useWebRtc';
import { PeerConnectionType, RTCAnswerPayload, RTCCandidatePayload, RTCOfferPayload } from '@utils/meeting';
import { createPeerConnection } from '@utils/peerConnections';

export const useScreenSharing = (roomId: string | null) => {
    const { data: authMeData } = useAuthMeQuery()
  const userRefId = useRef<string | number>();
  userRefId.current = authMeData?.id;

  const socketRef = useRef<Socket | null>(null);
  socketRef.current = getSocket();

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
  const mySocketId = useRef(socketRef.current?.id);

  useEffect(() => {
    roomIdRef.current = roomId;
    screenSharingRef.current = isScreenSharing;
    mySocketId.current = socketRef.current?.id;
  }, [roomId, isScreenSharing, socketRef.current]);


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
    };
  }, [socketRef.current]);

  const handleDisconnect = () => {
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
        console.info('Creating sharing peer connection');
        peerConnection.current = createPeerConnection({
          setSharedScreen,
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

      // eslint-disable-next-line no-console
      console.log(
        '📡 Signaling state before setRemoteDescription:',
        peerConnection.current.signalingState,
      );
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
        // eslint-disable-next-line no-console
        console.log('Answer successfully processed');
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
    sharingOwner: sharingOwnerRef.current,
    isScreenSharing,
    sharedScreen,
  };
};
