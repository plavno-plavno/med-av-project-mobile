export const iceServersConfig = {
  iceServers: [
    { urls: 'stun:51.21.247.138:3478' },
    {
      urls: 'turn:51.21.247.138:3478',
      username: 'turnuser',
      credential: 'turnpassword',
    },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};
