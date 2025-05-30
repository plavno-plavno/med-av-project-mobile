import { Socket } from 'socket.io-client';
import {
  MutableRefObject, Dispatch, SetStateAction,
} from 'react';

import { setupDataChannel } from './dataChannel';
import { iceServersConfig } from './iceServers';
import { MediaStreamTrack, RTCPeerConnection } from 'react-native-webrtc';
import RTCDataChannel from 'react-native-webrtc/lib/typescript/RTCDataChannel';
import { AudioStream, DataChannelNames, ISubtitle, PeerConnectionType, UserInMeeting, VideoStream } from './meeting';

const isManualLeaving = false;

interface CreatePeerConnectionParams {
  socket?: Socket | null;
  roomId?: string | null;
  setSharedScreen?: (track: MediaStreamTrack | null) => void;
  setIsScreenSharing?: (arg: boolean) => void;
  setRemoteVideoStreams?: Dispatch<SetStateAction<VideoStream[]>>;
  setRemoteAudioStreams?: Dispatch<SetStateAction<AudioStream[]>>;
  participantsRef?: UserInMeeting[] | null;
  setTranslatedSubtitles?: Dispatch<SetStateAction<ISubtitle[]>>;
  messagesChannelRef?: MutableRefObject<RTCDataChannel | null>;
  drawChannelRef?: MutableRefObject<RTCDataChannel | null>;
  endCall?: (withError: boolean) => void;
  startCall?: () => void;
  type?: PeerConnectionType;
}

export const createPeerConnection = ({
  socket,
  roomId,
  setSharedScreen,
  setRemoteVideoStreams,
  setRemoteAudioStreams,
  participantsRef,
  setTranslatedSubtitles,
  messagesChannelRef,
  drawChannelRef,
  endCall,
  startCall,
  type = PeerConnectionType.USER,
}: CreatePeerConnectionParams) => {
  try {
    const pc = new RTCPeerConnection(iceServersConfig);

    pc.addEventListener("icecandidate", ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('candidate', {
          candidate,
          roomId,
          type,
        });
      }
    });

    pc.addEventListener('iceconnectionstatechange', (event) => {
      console.log('[RTC] ICE Connection State Change:', event);
    });
    
    pc.addEventListener('signalingstatechange', (event) => {
      console.log('[RTC] Signaling State Change:', event);
    });

    pc.addEventListener("connectionstatechange", async () => {
      console.log('[RTC] Connection State Change:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error(
          '[RTC] Connection failed. Consider renegotiating or restarting the connection.',
        );

        if (typeof endCall === 'function') {
          console.log('[RTC] Ending call due to failed connection...');
          await endCall(isManualLeaving);
        }

        if (typeof startCall === 'function') {
          console.log('[RTC] Restarting call...');
          setTimeout(() => {
            startCall();
          }, 2000);
        }
      }
    });

    pc.addEventListener("datachannel", (event) => {
      const { channel } = event;

      if (channel.label.startsWith(DataChannelNames.Messages) && messagesChannelRef) {
        messagesChannelRef.current = channel;
        setupDataChannel(
          channel,
          'Messages',
          participantsRef as any,
          setTranslatedSubtitles,
        );
      } else if (
        channel.label.startsWith(DataChannelNames.Draw) &&
        drawChannelRef
      ) {
        drawChannelRef.current = channel;
        setupDataChannel(channel, 'Draw');
      }
    });

    pc.addEventListener("track", (event: any) => {
      const midId = event?.transceiver?.mid || '';
      const track = event?.track;
    
      if (type === PeerConnectionType.SHARING) {
        setSharedScreen?.(track);
        return;
      }
    
      if (track.kind === 'video') {
        setRemoteVideoStreams?.((prevStreams) => {
          const exists = prevStreams.some(
            (stream) => stream.videoTrack.id === track.id,
          );
    
          if (!exists) {
            const newVideoStream: VideoStream = {
              videoTrack: track,
              midId: midId,
            };
            console.log('[RTC] Adding new video stream:', newVideoStream);
            return [...prevStreams, newVideoStream];
          }
    
          return prevStreams;
        });
      } else if (track.kind === 'audio') {
        setRemoteAudioStreams?.((prevStreams) => {
          const exists = prevStreams.some(
            (stream) => stream.audioTrack.id === track.id,
          );
    
          if (!exists) {
            const newAudioStream: AudioStream = {
              audioTrack: track,
              midId: midId,
            };
            console.log('[RTC] Adding new audio stream:', newAudioStream);
            return [...prevStreams, newAudioStream];
          }
    
          return prevStreams;
        });
      }
    });
    
    return pc;
  } catch (error) {
    console.error('[RTC] Failed to create PeerConnection:', error);
    throw new Error('Could not create RTCPeerConnection');
  }
};
