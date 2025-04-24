import * as mediasoupClient from 'mediasoup-client';

import { MediaStream, MediaStreamTrack } from 'react-native-webrtc';
import { RTCSessionDescriptionInit } from 'react-native-webrtc/lib/typescript/RTCSessionDescription';

export type Photo = {
  id: string;
  path: string;
  link: string;
};

export type Message = {
  socketId: string;
  firstName?: string;
  lastName?: string;
  message: string;
  time?: string;
};

export type Language = {
  id: number;
  name: string;
  code: string;
};

export type AudioStream = {
  audioTrack: MediaStreamTrack;
  midId: string;
};

export type VideoStream = {
  videoTrack: MediaStreamTrack;
  midId: string;
};

export interface RemoteStream {
  socketId: string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
}

export interface IUsersAudioTrackToIdMap {
  [midId: number]: string;
}

export interface IUsersVideoTrackToIdMap {
  [midId: number]: string;
}

export interface ActionStatus {
  isAudioOn: boolean;
  isVideoOn: boolean;
  isSharingOn: boolean;
  isRecordingOn: boolean;
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

export interface UserInMeeting {
  userId: number;
  socketId: string;
  firstName: string;
  lastName: string;
  photo: Photo | null;
  isAudioOn: boolean | null;
  isVideoOn: boolean | null;
}

export interface ParticipantsInfo {
  userId: number;
  socketId: string;
  status: ActionStatus;
}

export interface ISubtitle {
  userName: string;
  message: string;
  time: string;
}

export enum DataChannelNames {
  Messages = 'messages',
  Draw = 'draw',
}

export enum PeerConnectionType {
  USER = 'user',
  SHARING = 'sharing',
  RECORDING = 'recording',
}

export type UserWithSocket = User & { socketId?: string };

export type MediasoupResources = {
  device: mediasoupClient.types.Device | null;
  transport: mediasoupClient.types.Transport | null;
  videoProducer: mediasoupClient.types.Producer | null;
  audioProducer: mediasoupClient.types.Producer | null;
  stream: MediaStream | null;
  error: string | null;
  micObserver?: ReturnType<typeof setInterval>;
};

export interface RTCOfferPayload {
  sdp: RTCSessionDescriptionInit;
  peerType: PeerConnectionType;
}

export interface RTCAnswerPayload {
  sdp: RTCSessionDescriptionInit;
  peerType: PeerConnectionType;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export interface RTCCandidatePayload {
  candidate: RTCIceCandidateInit;
  peerType: PeerConnectionType;
}


export interface User {
  id: number | string;
  photo: Photo | null;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  deletedAt: null | string;
  department: Departments;
  provider: string;
  title: string;
  phone: string;
  age: string;
  gender: string;
  gmtDelta: number;
  role: {
    id: number;
    name: string;
  };
  socialId: null | string | number;
  status: {
    id: number;
    name: string;
  };
  inputLanguage: {
    name: string;
    id: number;
    code: string;
  };
  outputLanguage: {
    name: string;
    id: number;
    code: string;
  };
  updatedAt: string;
  organization: Organization;
  storageUsage: string;
}

export type Departments = {
  name: string;
};

export interface Organization {
  id: number | string;
  location: string;
  staffCount: string;
  phoneNumber: string;

  name: string;
  domain: string;
  updatedAt: string;
  createdAt: string;
  photo: Photo | null;
  departments: any[];
}
