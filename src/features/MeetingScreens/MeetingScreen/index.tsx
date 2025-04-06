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
import Config from "react-native-config"
import { useMeetingRecording } from "src/hooks/useMeetingRecording"
import NewJoinRequestModal from "src/modals/MeetingModals/NewJoinRequestModal"
import { connectAccessMeetingSocket } from "src/hooks/meetingAccessSocketInstance"
import { useMeetingAccess } from "src/hooks/useMeetingAccess"

const recordingUrl = Config.SOCKET_RECORDING_URL

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
  // const { startRecording, stopRecording, isRecording } = useMeetingRecording(
  //   String(roomId),
  //   peerConnection
  // )
  const { joinEvent, requestJoinEvent, respondJoinRequest } = useMeetingAccess()
  useKeepAwake()
  useStatusBar("light-content", colors.dark)
  const [isCaptionOn, setIsCaptionOn] = React.useState(false)
  const meetingTitle = title === "Instant meeting" ? title : hash
  const startTimeRef = useRef<number | null>(null)
  const recordingNameRef = useRef<string | null>(null)

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
  const isInitialized = useRef(false)
  // useEffect(() => {
  //   if (peerConnection) {
  //     updatePeerConnections(peerConnection)
  //   }
  // }, [peerConnection])

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.close()
      }

      wsRef.current = new WebSocket(recordingUrl!)

      wsRef.current.onopen = () => {
        console.log("WebSocket connected")
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
          reconnectTimeout = null
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        console.log("WebSocket connection error. Reconnecting...")
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000)
        }
      }

      wsRef.current.onclose = () => {
        console.warn("WebSocket connection closed")
      }
    }
    const initSockets = async () => {
      if (!isInitialized.current) {
        connectAccessMeetingSocket()
        isInitialized.current = true
      }
    }

    initSockets()
    setTimeout(() => {
      joinEvent({ eventId })
    }, 300)
    // connectWebSocket()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      wsRef.current?.close()
    }
  }, [eventId])

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

        // if (isRecording) {
        //   stopRecording()
        // } else {
        //   startRecording()
        // }
      },
      // style: { opacity: isRecording ? 1 : 0.5 },
      style: { opacity: false ? 1 : 0.5 },
    },
  ]

  const callBottomActions = [
    {
      name: "callEnd",
      onPress: () => {
        // if (isRecording) {
        //   stopRecording()
        // }
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

  if (!participants.length) {
    return <Loading />
  }
  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.mainWrapper}>
          {/* <NewJoinRequestModal
            name={"Valery J"}
            onAccept={function (): void {
              throw new Error("Function not implemented.")
            }}
            onDecline={function (): void {
              throw new Error("Function not implemented.")
            }}
          /> */}
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
          hash={roomId}
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
