import { RemoteStream } from "@utils/meeting";
import { mediaDevices, MediaStream, MediaStreamTrack } from "react-native-webrtc";

export const initLocalMediaStream = async (socketId: string) => {
  let audioTrack: MediaStreamTrack | null = null;
  let videoTrack: MediaStreamTrack | null = null;
  let stream = new MediaStream();
  let hasAudioPermission = false;
  let hasVideoPermission = false;

  try {
    const devices: any = await mediaDevices.enumerateDevices();
    console.log(devices, 'devicesdevicesdevicesdevicesdevicesdevicesdevices');
    
    const hasAudioInput = devices?.some?.(
      (device: any) => device.kind === 'audioinput',
    );
    const hasVideoInput = devices?.some?.(
      (device: any) => device.kind === 'videoinput',
    );

    if (!hasAudioInput && !hasVideoInput) {
      console.warn('No audio or video devices found.');

      return {
        hasAudioPermission,
        hasVideoPermission,
        localStream: {
          socketId,
          audioTrack: null,
          videoTrack: null,
        } as RemoteStream,
        mediaStream: stream,
      };
    }

    const constraints = {
      video: hasVideoInput ? { facingMode: 'user' } : false,
      audio: hasAudioInput ? true : false,
    };

    stream = await mediaDevices.getUserMedia(constraints);

    videoTrack = stream.getVideoTracks()[0] || null;
    audioTrack = stream.getAudioTracks()[0] || null;

    hasAudioPermission = !!audioTrack;
    hasVideoPermission = !!videoTrack;
  } catch (error) {
    console.error('Error accessing media devices:', error);

    if (error instanceof Error && error.name === 'NotAllowedError') {
      console.warn('User denied access to media devices');

      try {
        const micStream = await mediaDevices.getUserMedia({
          audio: true,
        });
        hasAudioPermission = true;
        audioTrack = micStream.getAudioTracks()[0] || null;
        stream.addTrack(audioTrack);
      } catch (err) {
        console.warn('Microphone access denied');
      }

      try {
        const videoStream = await mediaDevices.getUserMedia({
          video: true,
        });
        hasVideoPermission = true;
        videoTrack = videoStream.getVideoTracks()[0] || null;
        stream.addTrack(videoTrack);
      } catch (err) {
        console.warn('Camera access denied');
      }
    }
  }

  return {
    hasAudioPermission,
    hasVideoPermission,
    localStream: {
      socketId,
      audioTrack,
      videoTrack,
    } as RemoteStream,
    mediaStream: stream,
  };
};
