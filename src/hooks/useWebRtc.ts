import {
    useState, useEffect, useRef,
} from 'react';
import { mediaDevices, MediaStream, MediaStreamTrack, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import { io } from 'socket.io-client';
import * as Keychain from "react-native-keychain"
import { useAuthMeQuery } from 'src/api/userApi/userApi';
import { RTCSessionDescriptionInit } from 'react-native-webrtc/lib/typescript/RTCSessionDescription';


const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
};

type ScreenShare = {
    userId: string;
    roomId: string;
    isSharing: boolean;
};

export interface RemoteStream {
    userId: string | number;
    audioTrack: MediaStreamTrack | null;
    videoTrack: MediaStreamTrack | null;
}


const useWebRtc = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const [messages, setMessages] = useState<[]>([]);
    const [participants, setParticipants] = useState<[]>([]);

    const { data: authMeData } = useAuthMeQuery()
    const userRef = useRef<string | number>();
    userRef.current = authMeData?.id

    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const [sharingOwner, setSharingOwner] = useState<string | null>(null);
    const nextTrackId = useRef<string | number | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const roomId = 1

    const token = async () => {
        const credentials = await Keychain.getGenericPassword({
            service: 'accessToken',
        });
        return credentials?.password || '';
    };

    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const accessToken = await token();
            const newSocket = io('https://khutba-media-server.plavno.io:2000', {
                auth: { token: accessToken },
            });
            setSocket(newSocket);
        })();
    }, [])

    useEffect(() => {
        const initialize = async () => {
          const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
          setLocalStream(stream);
        };
    
        initialize();
    
        return () => {
          if (peerConnection.current) {
            peerConnection.current.close();
          }
        };
      }, []);

    useEffect(() => {
        if (socket) {
        startCall();

            socket.onAny((eventName, args) => {
                console.log(`!!!!! Incoming event: ${eventName} !!!!`, args);
            });

            socket.on('offer', async ({ sdp }) => {
                await handleOffer(sdp);
            });

            socket.on('answer', async ({ sdp }) => {
                await handleAnswer(sdp);
            });

            socket.on('candidate', async ({ candidate }) => {
                await handleCandidate(candidate);
            });

            socket.on('user-joined', async ({ userId }) => {
                await handleUserJoined(userId);
            });

            // Screen sharing
            socket.on('screen-share-updated', handleUpdateSharing);

            // Meeting chat
            socket.on('chat-message', handleChatMessage);

            socket.on('transceiver-info', handleTransceiver);

            socket.on('client-disconnected', ({ userId }) => {
                console.log('A client disconnected ' + userId);

                setRemoteStreams((prev) => prev.filter((stream) => stream.userId !== userId),
                );
            });

            // peerConnection.current = createPeerConnection();

            return () => {
                // socket.off('offer');
                // socket.off('answer');
                // socket.off('candidate');
                // socket.off('user-joined');
                // socket.off('client-disconnected');

                // need to check it out since the behavior with unsubscribtion is different

                socket.off('chat-message', handleChatMessage);
                socket.off('transceiver-info', handleTransceiver);
                socket.off('screen-share-updated', handleUpdateSharing);

                peerConnection.current = null;
            };

        }
    }, [socket, roomId]);

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track._enabled = !isMuted;
            });
            setIsMuted((prev) => !prev);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track._enabled = !isVideoOff;
            });
            setIsVideoOff((prev) => !prev);
        }
    };

    const createPeerConnection = () => {
        console.log('Creating  PeerConnection first attempt');

        if (peerConnection.current) {
            return peerConnection.current;
        }

        console.log('Creating new PeerConnection');

        try {
            const pc = new RTCPeerConnection(config);

            pc.addEventListener('icecandidate', ({ candidate }) => {
                // eslint-disable-next-line no-console
                console.log('onIcecandidate');

                if (candidate) {
                    socket.emit('candidate', {
                        candidate,
                        roomId
                    });
                }
            })

            pc.addEventListener('connectionstatechange', event => {
                // eslint-disable-next-line no-console
                console.log('Connection state:', pc.connectionState);
                console.log('Connection event state:', event);

                if (pc.connectionState === 'failed') {
                    console.error('Connection failed. Consider renegotiating or restarting the connection.');
                }
            })


            pc.addEventListener('datachannel', event => {
                const dataChannel = event.channel;

                dataChannel.addEventListener('open', event => {
                    console.log('Data channel opened', event);
                })

                dataChannel.addEventListener('message', event => {
                    const data = event?.data;
                    // eslint-disable-next-line no-console
                    console.log('Message received through data channel:', data);
                })

                dataChannel.addEventListener('close', () => {
                    console.log('Data channel closed');
                })


                dataChannel.addEventListener('error', error => {
                    console.error('Data channel error:', error);
                })
            });

            pc.addEventListener('track', (event) => {
                const MAX_RETRIES = 5;
                let attempts = 0;

                const processTrack = () => {
                    const userId = nextTrackId.current;

                    if (!userId) {
                        if (attempts < MAX_RETRIES) {
                            attempts++;
                            console.warn(`Retrying to fetch userId... Attempt ${attempts}/${MAX_RETRIES}`);
                            setTimeout(processTrack, 2000);

                            return;
                        }

                        console.error('User ID is not available for this track after maximum retries.');

                        return;
                    }

                    setRemoteStreams((prev) => {
                        const existingStream = prev.find((stream) => stream.userId === userId);

                        if (existingStream) {
                            const updatedStream = { ...existingStream };

                            if (event?.track?.kind === 'video') {
                                updatedStream.videoTrack = event.track;
                            } else if (event?.track?.kind === 'audio') {
                                updatedStream.audioTrack = event.track;
                            }

                            return prev.map((stream) => stream.userId === userId ? updatedStream : stream);
                        } else {
                            const newStream = {
                                userId,
                                audioTrack: event.track?.kind === 'audio' ? event.track : null,
                                videoTrack: event.track?.kind === 'video' ? event.track : null,
                            };

                            return [...prev, newStream];
                        }
                    });
                };

                processTrack();
            });

            return pc;
        } catch (error) {
            console.error('Failed to create PeerConnection:', error);
            throw new Error('Could not create RTCPeerConnection');
        }
    };

    const startCall = async () => {
        try {
            socket.emit('join', {
                roomId: 1,
                language: 'en'
            });
        } catch (error) {
            console.error('Error starting call:', error);
        }
    };

    const endCall = () => {
        peerConnection.current?.close();
        setLocalStream(null);
        setRemoteStreams([]);
        peerConnection.current = null;
    };

    const handleOffer = async ({ sdp, type }: RTCSessionDescriptionInit) => {
        console.log('handle offer');

        if (!peerConnection.current) {
            peerConnection.current = createPeerConnection();
        }

        try {
            console.log(peerConnection.current.signalingState);

            const offer = new RTCSessionDescription({
                sdp,
                type
            });
            console.log('Setting remote description for offer');
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            if (peerConnection.current.localDescription) {
                const localDescription = peerConnection.current.localDescription as RTCSessionDescriptionInit;
                console.log('Local description is set');
                socket.emit('answer', {
                    sdp: localDescription,
                    roomId
                });
            } else {
                console.error('Local description is null');
            }
        } catch (error) {
            console.error('Error processing offer:', error);
        }
    };

    const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
        console.log('Handle answer');
        try {
            if (peerConnection.current) {
                await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        } catch (error) {
            console.error('Error setting remote description:', error);
        }
    };

    const handleUserJoined = async (userId: string) => {
        try {
            console.log('User joined ' + userId);

            const userExists = participants.some((participant) => participant?.id === userId);

            let userData: any;

            if (!userExists) {
                //   const response = await api('get', `/users/${userId}`);
                //   userData = response?.data?.user;
                // setParticipants((prev) => [...prev, userData]);
            }

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: true
            });

            if (userRef.current) {
                setLocalStream({
                    userId: userRef.current,
                    audioTrack: stream.getAudioTracks()[0] || null,
                    videoTrack: stream.getVideoTracks()[0] || null,
                });
            }

            if (!peerConnection?.current) {
                peerConnection.current = createPeerConnection();
            }

            stream.getTracks().forEach((track) => {
                peerConnection.current?.addTrack(track, stream);
                // eslint-disable-next-line no-console
                console.log('Added track', track);
            });

            const offer = await peerConnection.current?.createOffer();
            await peerConnection.current?.setLocalDescription(offer);
            // eslint-disable-next-line no-console
            console.log('Set local description in user Joined');

            if (peerConnection.current?.localDescription) {
                // const localDescription = peerConnection.current.localDescription as RTCSessionDescriptionInit;
                socket.emit('offer', {
                    sdp: peerConnection.current?.localDescription,
                    roomId
                });
                // eslint-disable-next-line no-console
                console.log('Sent offer');
            } else {
                console.error('Failed to send offer: localDescription is null');
            }
        } catch (error) {
            console.error('Error handling user join:', error);
        }
    };

    const handleCandidate = async (candidate: any) => {
        // eslint-disable-next-line no-console
        console.log('handle candidate');

        try {
            if (peerConnection.current) {
                if (!peerConnection.current.remoteDescription) {
                    return;
                }

                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('ICE candidate successfully added');
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    };

    const handleTransceiver = async ({ userId }: { mid: string | null, userId: string | number }) => {
        const isUserExists = participants.filter((user) => user?.id === userId);

        if (!isUserExists.length) {
            // const userData = await api('get', `/users/${userId}`);
            // setParticipants((prev) => {
            //     const isUserExist = prev.some((participant) => participant?.id === userData?.data?.user?.id);

            //     if (isUserExist) {
            //         return prev;
            //     }

            //     return [...prev, userData?.data?.user];
            // });

            nextTrackId.current = userId;
        }
    };

    // screen sharing

    const handleUpdateSharing = (data: ScreenShare) => {
        const { userId, isSharing } = data;
        setIsScreenSharing(isSharing);

        if (isSharing) {
            setSharingOwner(userId);
        } else {
            setSharingOwner(null);
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await mediaDevices.getDisplayMedia();

            // const screenStream = await mediaDevices.getDisplayMedia({
            //     video: true,
            // });

            const micStream = await mediaDevices.getUserMedia({
                audio: true,
            });

            const screenTrack = screenStream.getVideoTracks()[0];
            const micTrack = micStream.getAudioTracks()[0];

            if (!screenTrack) {
                console.error('No video track available for screen sharing');

                return;
            }

            screenTrackRef.current = screenTrack;

            const videoSender = peerConnection.current
                ?.getSenders()
                .find((s) => s.track?.kind === 'video');

            if (videoSender) {
                await videoSender.replaceTrack(screenTrack);
            } else {
                console.warn('No video sender found. Adding track...');
                peerConnection.current?.addTrack(screenTrack);
            }

            const audioSender = peerConnection.current
                ?.getSenders()
                .find((s) => s.track?.kind === 'audio');

            if (audioSender) {
                await audioSender.replaceTrack(micTrack);
            } else {
                console.warn('No audio sender found. Adding track...');
                peerConnection.current?.addTrack(micTrack);
            }

            setLocalStream({
                userId: authMeData?.id || '',
                audioTrack: micStream.getAudioTracks()[0] || null,
                videoTrack: screenStream.getVideoTracks()[0] || null,
            });

            socket.emit('toggle-screenshare', {
                roomId,
                userId: socket.id,
                isSharing: true,
            });

            screenTrack.addEventListener('ended', () => {
                stopScreenShare();
            })
        } catch (error) {
            console.error('Error starting screen sharing:', error);
        }
    };

    const stopScreenShare = async () => {
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
        }

        try {
            if (localStream) {
                const cameraStream = await mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                const videoTrack = cameraStream.getVideoTracks()[0];

                if (!videoTrack) {
                    console.error('Failed to get video track from camera stream');

                    return;
                }

                const sender = peerConnection.current
                    ?.getSenders()
                    .find((s) => s.track?.kind === 'video');

                if (sender) {
                    sender.replaceTrack(videoTrack);
                }

                setLocalStream({
                    userId: authMeData?.id || '',
                    audioTrack: cameraStream.getAudioTracks()[0] || null,
                    videoTrack: cameraStream.getVideoTracks()[0] || null,
                });

                socket.emit('toggle-screenshare', {
                    roomId,
                    userId: socket.id,
                    isSharing: false,
                });
            }
        } catch (error) {
            console.error('Error while stopping screen share and switching to camera:', error);
        }
    };

    // Meeting chat

    const handleChatMessage = (data: any) => {
        console.log(data, 'data handleChatMessagehandleChatMessage');
        
        setMessages((prev) => [...prev, data]);
    };

    const sendMessage = (data: any) => {
        const { message } = data;
        socket.emit('chat-message', {
            roomId,
            message
        });
    };

    return {
        localStream,
        remoteStreams,
        isMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo,
        startCall,
        endCall,
        messages,
        sendMessage,
        setLocalStream,
        startScreenShare,
        stopScreenShare,
        isScreenSharing,
        sharingOwner,
        participants,
        RTCView,
    };
};

export default useWebRtc;
