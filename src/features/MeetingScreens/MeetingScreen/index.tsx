import React, { useEffect, useRef, useState } from "react"
import { FlatList, Text, View } from "react-native"
import useWebRtc from "src/hooks/useWebRtc"
import { styles } from "./styles"
import { Icon } from "@components"
import { useStatusBar } from "src/hooks/useStatusBar"
import colors from "src/assets/colors"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portal } from "react-native-portalize"
import MeetingChatModal from "src/modals/MeetingModals/MeetingChatModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"
import VideoGrid from "src/components/VideoGrid/VideoGrid"
import ParticipantsModal from "src/modals/MeetingModals/ParticipantsModal"
import { useRoute, RouteProp } from "@react-navigation/native"
import SubtitlesModal from "src/modals/MeetingModals/SubtitlesModal"
import { Toast } from "react-native-toast-message/lib/src/Toast"
import { useTranslation } from "react-i18next"
import { useKeepAwake } from "@sayem314/react-native-keep-awake"
import Subtitles from "src/components/Subtitles"
import Loading from "src/components/Loading"
import NewJoinRequestModal from "src/modals/MeetingModals/NewJoinRequestModal"
import { useMeetingAccess } from "src/hooks/useMeetingAccess"
import RNFS from "react-native-fs"
import Share from "react-native-share"
import { NativeEventEmitter, NativeModules } from "react-native"
const { ScreenRecorder } = NativeModules

type ParamList = {
  Detail: {
    isCreatorMode?: boolean
    title?: string
    hash?: string
    instanceMeetingOwner?: boolean
    isVideoOff?: boolean
    isMuted?: boolean
    eventId?: string
  }
}

const MeetingScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { isCreatorMode, title, hash, instanceMeetingOwner, eventId } =
    route.params
  const {
    socketRef,
    localStream,
    isMuted,
    isVideoOff,
    roomId,
    participants,
    isSpeakerOn,
    isCameraSwitched,
    messages,
    isScreenShare,
    remoteAudioStreams,
    usersAudioTrackToIdMap,
    remoteVideoStreams,
    usersVideoTrackToIdMap,
    peerConnection,
    localUserId,
    localUserSocketId,
    subtitlesQueue,
    sharedScreen,
    wsRef,
    endCall,
    toggleMedia,
    switchCamera,
    toggleSpeaker,
    sharingOwner,
    sendMessage,
    handleChangedRoomLanguage,
    points,
    clearCanvas,
    setClearCanvas,
    speechLanguage,
  } = useWebRtc(instanceMeetingOwner!)
  const [isRecording, setIsRecording] = useState(false)

  const [invitedParticipants, setInvitedParticipants] = useState<any[]>([])
  const [meInvited, setMeInvited] = useState<boolean | null>(null)

  const {
    joinEvent,
    requestJoinEvent,
    respondJoinRequest,
    isRequestModalOpen,
    setIsRequestModalOpen,
    newUser,
    isRequestingJoin,
    socketInstance,
  } = useMeetingAccess({
    setInvitedParticipants,
    setMeInvited,
    invitedParticipants,
    eventId: eventId!,
  })

  const handleResponse = async (accepted: boolean) => {
    if (!newUser?.socketId || !eventId) {
      console.error("Missing required data to process response")
      return
    }

    respondJoinRequest({
      eventId: String(eventId),
      socketId: newUser.socketId,
      userId: String(newUser.id),
      accepted,
    })

    setIsRequestModalOpen(false)
  }

  useKeepAwake()
  useStatusBar("light-content", colors.dark)
  const [isCaptionOn, setIsCaptionOn] = React.useState(false)
  const meetingTitle = title === "Instant meeting" ? title : hash

  const sheetChatRef = useRef<BottomSheetMethods>(null)
  const sheetCatiptionsRef = useRef<BottomSheetMethods>(null)
  const sheetParticipantsRef = useRef<BottomSheetMethods>(null)

  const handleChatOpen = () => {
    sheetChatRef.current?.open()
  }
  const handleCaptionsOpen = () => {
    sheetCatiptionsRef.current?.open()
  }
  const handleParticipantsOpen = () => {
    sheetParticipantsRef.current?.open()
  }

  const [recordingChunks, setRecordingChunks] = useState<string[]>([]);

  const saveRecordingToFile = async () => {
    try {
      const combinedChunks = recordingChunks.map(chunk => atob(chunk)).join('');
      const path = `${RNFS.DocumentDirectoryPath}/recording.video.raw`;
      await RNFS.writeFile(path, combinedChunks, 'utf8');
      console.log("Recording saved to file at:", path);

      await Share.open({
        url: `file://${path}`,
        title: "Save or Share",
      }).catch((error) => console.error("Error sharing file:", error));

    } catch (error) {
      console.error("Failed to save recording to file:", error);
    }
  };

  const eventEmitter = useRef(new NativeEventEmitter(ScreenRecorder));

  useEffect(() => {
    const chunkListener = eventEmitter.current.addListener("onVideoChunk", ({ chunk }) => {
      console.log("Received chunk:", chunk);
      setRecordingChunks((prevChunks) => [...prevChunks, chunk]);
    });

    return () => {
      chunkListener.remove();
    };
  }, []);

  const startRecording = async () => {
    try {
      await ScreenRecorder.startRecording();
      console.log("Recording started");
      setIsRecording(true);
      setRecordingChunks([]);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      if (ScreenRecorder && isRecording) {
        await ScreenRecorder.stopRecording();
        console.log("Recording stopped");
        setIsRecording(false);
        saveRecordingToFile();
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const callTopActions = [
    {
      name: "swapCamera",
      onPress: switchCamera,
      style: { opacity: isCameraSwitched ? 1 : 0.5 },
    },
    {
      name: "soundOn",
      onPress: toggleSpeaker,
      style: { opacity: isSpeakerOn ? 1 : 0.5 },
    },
    {
      name: "screenRecordStart",
      onPress: () => {
        if (!instanceMeetingOwner) {
          Toast.show({
            type: "error",
            text1: t("OnlyCreatorCanStartScreenRecording"),
          })
          return
        }

        if (isRecording) {
          stopRecording()
        } else {
          startRecording()
        }
      },
      style: { opacity: isRecording ? 1 : 0.5 },
      // style: { opacity: false ? 1 : 0.5 },
    },
  ]

  const callBottomActions = [
    {
      name: "callEnd",
      onPress: () => {
        if (isRecording) {
          stopRecording()
        }
        setTimeout(() => {
          endCall()
          Toast.show({
            type: "success",
            text1: t("YouLeftTheMeeting"),
          })
        }, 500)
      },
    },
    {
      name: isVideoOff ? "cameraOff" : "cameraOn",
      onPress: () => toggleMedia("video"),
    },
    {
      name: isMuted ? "microOff" : "microOn",
      onPress: () => toggleMedia("audio"),
    },
    {
      name: "meetingChat",
      onPress: handleChatOpen,
      active: false,
    },
    {
      name: "participantsIcon",
      onPress: handleParticipantsOpen,
      active: false,
    },
    {
      name: isCaptionOn ? "captionsOn" : "captions",
      onPress: handleCaptionsOpen,
      active: false,
    },
  ]

  useEffect(() => {
    if (!!participants.length && socketInstance) {
      joinEvent({ eventId: String(eventId) })
    }
  }, [participants?.length, socketInstance])

  if (!participants?.length) {
    return <Loading />
  }
  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.mainWrapper}>
          {isRequestModalOpen && (
            <NewJoinRequestModal
              name={"Valery J"}
              onAccept={() => handleResponse(true)}
              onDecline={() => handleResponse(false)}
            />
          )}
          <View style={styles.upperControlContainer}>
            <Text style={styles.title}>{meetingTitle}</Text>
            <View>
              <FlatList
                data={callTopActions}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={[styles.actionButton, item.style]}>
                    <Icon name={item.name as IconName} onPress={item.onPress} />
                  </View>
                )}
              />
            </View>
          </View>
          <VideoGrid
            localStream={localStream}
            isVideoOff={isVideoOff}
            isMuted={isMuted}
            isScreenShare={isScreenShare}
            remoteAudioStreams={remoteAudioStreams}
            usersAudioTrackToIdMap={usersAudioTrackToIdMap}
            remoteVideoStreams={remoteVideoStreams}
            usersVideoTrackToIdMap={usersVideoTrackToIdMap}
            participants={participants}
            peerConnection={peerConnection}
            localUserId={localUserId}
            localUserSocketId={localUserSocketId}
            sharedScreen={sharedScreen}
            sharingOwner={sharingOwner}
            points={points}
            clearCanvas={clearCanvas}
            setClearCanvas={setClearCanvas}
          />
          <Subtitles isActive={isCaptionOn} subtitlesQueue={subtitlesQueue} />
        </View>
        <View>
          <FlatList
            data={callBottomActions}
            horizontal
            contentContainerStyle={styles.bottomControlContainer}
            keyExtractor={(_item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.actionButton}>
                {participants.length > 0 &&
                  item.name === "participantsIcon" && (
                    <View style={styles.participansCountContainer}>
                      <Text style={styles.participantsCount}>
                        {participants.length}
                      </Text>
                    </View>
                  )}
                <Icon name={item.name as IconName} onPress={item.onPress} />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
      <Portal>
        <SubtitlesModal
          sheetRef={sheetCatiptionsRef}
          setIsCaptionOn={setIsCaptionOn}
          isCaptionOn={isCaptionOn}
          handleChangedRoomLanguage={handleChangedRoomLanguage}
          speechLanguage={speechLanguage}
        />
        <ParticipantsModal
          isCreatorMode={isCreatorMode}
          hash={hash}
          participants={participants}
          sheetRef={sheetParticipantsRef}
        />
        <MeetingChatModal
          sheetRef={sheetChatRef}
          messages={messages}
          sendMessage={sendMessage}
        />
      </Portal>
    </>
  )
}

export default MeetingScreen
