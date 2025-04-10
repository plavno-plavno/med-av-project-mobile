import { useEffect, useRef, useState } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import { Socket } from 'socket.io-client';
import { mediaDevices, MediaStream, registerGlobals } from 'react-native-webrtc';
import { createSendTransport } from './createSendTransport';
import { getSocket } from './webRtcSocketInstance';
import { getMediasoupSocket, initializeMediasoupSocketInit } from './mediasoupSocketInstanceInit';

 type MediasoupResources = {
  device: mediasoupClient.types.Device | null;
  transport: mediasoupClient.types.Transport | null;
  videoProducer: mediasoupClient.types.Producer | null;
  audioProducer: mediasoupClient.types.Producer | null;
  stream: MediaStream | null;
  error: string | null;
};

registerGlobals();

export const useMediasoupRecording = (
  localOwnerAccess: boolean | null,
  roomId: string | null,
) => {
  const socketRef = useRef<Socket | null>(getMediasoupSocket());
  const [isRecording, setIsRecording] = useState(false);

  const resources = useRef<MediasoupResources>({
    device: null,
    transport: null,
    videoProducer: null,
    audioProducer: null,
    stream: null,
    error: null,
  });

  const handleRouterCapabilities = async (routerRtpCapabilities: any) => {
    try {
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });
      resources.current.device = device;
      // eslint-disable-next-line no-console
      console.log('📱 Device loaded');

      if (socketRef.current && device) {
        createSendTransport(
          device,
          (transport) => {
            resources.current.transport = transport;
            // eslint-disable-next-line no-console
            console.log('🚀 Transport created and stored');
          },
          (errorMessage) => {
            resources.current.error = errorMessage;
          },
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to load device:', error);
      resources.current.error = error.message;
    }
  };

  const initMediasoupSocket = async () => {
    socketRef.current = await initializeMediasoupSocketInit('http://192.168.0.105:6600');
  }

  useEffect(() => {
    initMediasoupSocket()
    console.log(socketRef.current, 'socketRef.currentsocketRef.current');
    
    if (!socketRef.current) {
      return;
    }

    socketRef.current.on('routerRtpCapabilities', handleRouterCapabilities);

    const handleOnAny = (eventName: string, ...args: any[]) => {
      if (eventName !== 'candidate') {
        // eslint-disable-next-line no-console
        console.log(`!!!!! Incoming event: ${eventName} !!!!`, args);
      }
    };

    socketRef.current.onAny(handleOnAny)
    // return () => {
    //   if (socketRef.current) {
    //     socketRef.current.off(
    //       'routerRtpCapabilities',
    //       handleRouterCapabilities,
    //     );
    //   }
    // };
  }, [socketRef.current]);

  const waitForTransport = async (timeout = 3000): Promise<void> => {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const check = () => {
        if (resources.current.transport) {
          return resolve();
        }

        if (Date.now() - start > timeout) {
          return reject(new Error('⏳ Transport not ready within timeout.'));
        }

        // requestAnimationFrame(check);
      };

      check();
    });
  };

  const startScreenCapture = async () => {
    try {
      // await waitForTransport();
      const { transport } = resources.current;

      if (!transport) {
        resources.current.error = '🚫 Transport not available.';

        return;
      }

      const screenStream = await mediaDevices.getDisplayMedia();

      const hasAudio = screenStream.getAudioTracks().length > 0;
      const finalStream = new MediaStream(screenStream.getVideoTracks());

      const micStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      micStream
        .getAudioTracks()
        .forEach((track) => finalStream.addTrack(track));
      console.log('🎤 Added microphone audio');

      resources.current.stream = finalStream;

      const videoTrack = finalStream.getVideoTracks()[0];

      const videoProducer = await transport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 },
        ],
        codecOptions: { videoGoogleStartBitrate: 1000 },
      });

      resources.current.videoProducer = videoProducer;
      console.log('🎥 Video Producer created:', videoProducer.id);

      const audioTrack = finalStream.getAudioTracks()[0];

      if (audioTrack) {
        const audioProducer = await transport.produce({
          track: audioTrack,
          codecOptions: {
            opusStereo: true,
            opusDtx: true,
            opusFec: true,
            opusMaxPlaybackRate: 48000,
          },
        });
        resources.current.audioProducer = audioProducer;
        setIsRecording(true);
        console.log('🔊 Audio Producer created:', audioProducer.id);
      }

      const endHandler = () => {
        console.log('🛑 Media track ended');
        stopScreenCapture();
      };
      videoTrack.addEventListener('ended', endHandler);
      finalStream
        .getAudioTracks()
        .forEach((track) => track.addEventListener('ended', endHandler));
        
    } catch (err: any) {
      console.error('❌ Failed to start screen capture:', err);
      resources.current.error = err.message;
    }
  };

  const stopScreenCapture = () => {
    const { stream, videoProducer, audioProducer } = resources.current;

    stream?.getTracks().forEach((track) => track.stop());
    resources.current.stream = null;

    videoProducer?.close();
    resources.current.videoProducer = null;

    audioProducer?.close();
    resources.current.audioProducer = null;
    setIsRecording(false);

    console.log('🛑 Screen capture stopped');
  };

  const startMediasoupRecording = () => {
    if (!socketRef.current) {
      resources.current.error = '🚫 No socket connection';

      return;
    }

    if (!resources.current.videoProducer) {
      resources.current.error = '🚫 Video producer not ready';

      return;
    }

    const rtcSocket = getSocket();

    socketRef.current.emit('startRecording', {
      roomId,
      clientSocketId: rtcSocket?.id,
    });
    // eslint-disable-next-line no-console
    console.log('📹 Recording started');
  };

  const stopMediasoupRecording = () => {
    if (!socketRef.current) {
      resources.current.error = '🚫 No socket connection';

      return;
    }

    socketRef.current.emit('stopRecording');
    // eslint-disable-next-line no-console
    console.log('🛑 Recording stopped');
  };

  return {
    getResources: () => resources.current,
    startRecording: async () => {
      await startScreenCapture()
      await startMediasoupRecording()
    },
    stopRecording: async () => {
      await stopScreenCapture()
      await stopMediasoupRecording()
    },
    isRecording,
  };
};

