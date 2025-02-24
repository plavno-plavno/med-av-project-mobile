import React from "react";
import { View, StyleSheet, ViewStyle, Image, Text } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { MediaStream, RTCView } from "react-native-webrtc";
import LinearGradient from "react-native-linear-gradient";
import colors from "src/assets/colors";
import { Icon } from "@components";
import { RemoteStream, User } from "src/hooks/useWebRtc";
import useHighlightSpeaker from "src/hooks/useHighlightSpeaker";
import { fontFamilies, fontWeights } from "@utils/theme";

export interface UserInMeeting extends User {
  isAudioOn: boolean | null;
  isVideoOn: boolean | null;
}

const VideoGrid = ({
  localStream,
  isVideoOff,
  remoteAudioStreams,
  usersAudioTrackToIdMap,
  remoteVideoStreams,
  usersVideoTrackToIdMap,
  participants,
  peerConnection,
  localUserId,
  isMuted,
}: any) => {
  const adaptParticipantsToShow = (): RemoteStream[] => {
    const remoteStreams: Record<string | number, RemoteStream> = {};

    remoteAudioStreams.forEach((audioStream: any) => {
      const midId = Number(audioStream.midId);
      const userId = usersAudioTrackToIdMap[midId];
      if (userId) {
        if (!remoteStreams[userId]) {
          remoteStreams[userId] = {
            userId: Number(userId),
            audioTrack: null,
            videoTrack: null,
            mid: String(midId),
          };
        }

        remoteStreams[userId].audioTrack = audioStream.audioTrack;
      }
    });

    remoteVideoStreams.forEach((videoStream: any) => {
      const midId = Number(videoStream.midId);
      const userId = usersVideoTrackToIdMap[midId];

      if (userId) {
        if (!remoteStreams[userId]) {
          remoteStreams[userId] = {
            userId: Number(userId),
            audioTrack: null,
            videoTrack: null,
            mid: String(midId),
          };
        }

        remoteStreams[userId].videoTrack = videoStream.videoTrack;
      }
    });

    const participantsSteams = Object.values(remoteStreams);
    if (localStream) {
      participantsSteams.unshift(localStream);
    }

    return participantsSteams;
  };

  const participantsToShow = adaptParticipantsToShow();
  // const activeSpeaker = 1
  // console.log(participantsToShow, 'participantsToShowparticipantsToShowparticipantsToShow');
  const isLocalUser = localUserId != null;
  // const activeSpeaker = useHighlightSpeaker(peerConnection, usersAudioTrackToIdMap) // for Highlight need to test it in nearest future
  const activeSpeaker = useHighlightSpeaker(peerConnection, participantsToShow, isLocalUser, localUserId, isMuted);
  const totalParticipants = participantsToShow.length;
// console.log(totalParticipants, 'totalParticipantstotalParticipants');

  // check it for share screen, user who shared screen should be the first one in list
  // const sharingScreenStream = participantsToShow.find((stream) => stream?.userId === Number(sharingOwner));
  // const currentSharedUser = participants.find((user) => user.id === sharingScreenStream?.userId);

  // if (sharingScreenStream) {
  //   const index = participantsToShow.findIndex((stream) => stream?.userId === Number(sharingOwner));
  //   participantsToShow.splice(index, 1);
  // }

  const getGridStyle = ({
    idx,
    total,
  }: {
    idx?: number;
    total: number;
  }): ViewStyle => {
    if (total === 1) return { width: "100%", height: "100%" };
    if (total === 2) return { width: "100%", height: "49.9%" };
    if (total === 3)
      return {
        width: idx === 2 ? "100%" : "49.3%",
        height: "49.6%",
      };
    if (total >= 4) return { width: "49.3%", height: "49.8%" };
    return { width: "100%", height: "100%" };
  };

  const renderStream = (item: any, index: number) => {
    // const isActive = activeSpeaker !== null && Number(activeSpeaker) === Number(item.userId);
    const isActive =
      activeSpeaker !== null && Number(activeSpeaker) === Number(item.userId);
    const mediaStream = new MediaStream();
    if (item?.videoTrack) mediaStream.addTrack(item?.videoTrack);
    if (item?.audioTrack) mediaStream.addTrack(item?.audioTrack);
    const user = participants?.find((user: User) => user.id === item.userId) as UserInMeeting;
    const lastNameInitial = user?.lastName?.charAt?.(0) || "";
  
    return (
      <View key={item?.id || index} style={getGridStyle({ total: totalParticipants, idx: index })}>
        {isActive && (
          <LinearGradient
            colors={["#70DDE3", "#9FF8E1", "#B8FFC6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeSpeakerBorder}
          />
        )}
        <View style={styles.videoContainer}>
          {(!item?.userId && isVideoOff) || !user?.isVideoOn ? (
            <View style={[styles.cameraOffContainer]}>
              {user?.photo?.link ?
                <Image source={{ uri: user.photo.link }} style={{ width: moderateScale(88), height: moderateScale(88), borderRadius: moderateScale(100) }} />
                :
                <Icon name="avatarEmpty" />
              }
            </View>
          ) : (
            <View style={{ margin: moderateScale(2), borderRadius: moderateScale(12), overflow: 'hidden' }}>
              <RTCView
                mirror={true}
                streamURL={mediaStream?.toURL?.()}
                style={styles.rtcView}
                objectFit="cover"
              />
            </View>
          )}
          <Text style={styles.userName}>{user?.firstName} {lastNameInitial}.</Text>
          {!user?.isAudioOn &&
            <Icon
              name="microMuted"
              style={{
                position: "absolute",
                top: moderateScale(12),
                right: moderateScale(12),
              }}
            />
          }
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {participantsToShow.map((item, index) =>
        renderStream(item, index)
      )}
    </View>
  );
};

export default VideoGrid;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    gap: moderateScale(4),
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: colors.charcoal,
    width: "100%",
    height: "100%",
  },
  rtcView: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: moderateScale(12),
  },
  videoContainer: {
    position: "relative",
    borderRadius: moderateScale(12),
    overflow: "hidden",
    width: "99%",
    height: "98%",
    marginTop: 2,
    marginLeft: 2,
  },
  cameraOffContainer: {
    backgroundColor: colors.charcoal,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  activeSpeakerBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(16),
  },
  userName: {
    position: 'absolute',
    left: moderateScale(12),
    bottom: moderateScale(12),
    ...fontFamilies.interManropeBold16,
    ...fontWeights.fontWeight600,
    color: colors.white,
  }
});
