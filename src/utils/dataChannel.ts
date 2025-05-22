import RTCDataChannel from 'react-native-webrtc/lib/typescript/RTCDataChannel';
import { ISubtitle, UserInMeeting } from './meeting';

const getShortUserName = (
  firstName?: string,
  lastName?: string,
): string => {
  if (!firstName) {
    return 'Guest';
  }

  const initial = lastName?.charAt(0) ?? '';

  return `${firstName} ${initial}.`;
};
const SUBTITLES_QUEUE_LIMIT = 3

const handleSubtitles = (newEl: any) => (prev: any[]) => {
  let newAr = [...prev, newEl]

  if (newAr.length > SUBTITLES_QUEUE_LIMIT) {
    newAr.shift()
  }
  return newAr
}


export const setupDataChannel = (
  channel: RTCDataChannel | null,
  type: 'Messages' | 'Draw',
  participantsRef?: React.MutableRefObject<UserInMeeting[] | null>,
  setTranslatedSubtitles?: React.Dispatch<React.SetStateAction<ISubtitle[]>>,
) => {
  if (!channel) {
    return;
  }

  channel.addEventListener('error', (error: any) => console.error(`Data channel [${type}] error`, error))

  channel.addEventListener("message", (event: any) => {
    if (
      type === 'Messages' &&
      participantsRef?.current &&
      setTranslatedSubtitles
    ) {
      try {
        const { socketId: speakerSocketId, text } = JSON.parse(event.data);

        const user = Array.isArray(participantsRef.current)
          ? participantsRef.current.find(
            ({ socketId }) => speakerSocketId === socketId,
          )
          : null;

        const currentTime = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const subtitleEntry: ISubtitle = {
          userName: user
            ? getShortUserName(user?.firstName, user?.lastName)
            : 'Guest',
          message: text,
          time: currentTime,
        };

        const subtitleText = `${user
            ? getShortUserName(user?.firstName, user?.lastName)
            : 'Guest'} : ${text}`

        setTranslatedSubtitles(handleSubtitles(subtitleText))
        // setTranslatedSubtitles((prev) => [...prev, subtitleEntry]);
      } catch (e) {
        console.error('Error processing data channel message:', e);
      }
    }
  })
};
