import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  FlatList,
  PermissionsAndroid,
  Platform,
  Text,
  View,
} from "react-native"
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
import { Buffer } from "buffer"
import moment from "moment"
import { useScreenSharing } from "src/hooks/useScreenSharing"
import { formatLastName } from "@utils/utils"

type ParamList = {
  Detail: {
    isCreatorMode?: boolean
    title?: string
    hash?: string
    instanceMeetingOwner?: boolean
    isVideoOff?: boolean
    isMuted?: boolean
    eventId?: string
    ownerEmail?: string
  }
}

const MeetingScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const {
    isCreatorMode,
    title,
    hash,
    instanceMeetingOwner,
    eventId,
    ownerEmail,
  } = route.params
  const [invitedParticipants, setInvitedParticipants] = useState<any[]>([])

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
    wsRef,
    endCall,
    toggleMedia,
    switchCamera,
    toggleSpeaker,
    sendMessage,
    handleChangedRoomLanguage,
    points,
    clearCanvas,
    setClearCanvas,
    speechLanguage,
    meetId,

    recordingUrl,
    onStartRecord,
    onStopRecord,
    startRecording,
    stopRecording,
    isScreenRecording,
    recordingNameRef,
  } = useWebRtc(instanceMeetingOwner!, invitedParticipants)
  const [meInvited, setMeInvited] = useState<boolean | null>(null)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const startTimeRef = useRef<any>()
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

  const newUserFullName = `${newUser?.firstName} ${formatLastName(
    newUser?.lastName
  )}`

  const { isScreenSharing, sharingOwner, sharedScreen } = useScreenSharing(
    roomId!,
    socketRef.current,
    peerConnection
  )

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
  const meetingTitle = title === "Instant meeting" ? hash : title

  const sheetChatRef = useRef<BottomSheetMethods>(null)
  const sheetCatiptionsRef = useRef<BottomSheetMethods>(null)
  const sheetParticipantsRef = useRef<BottomSheetMethods>(null)

  const handleChatOpen = () => {
    setUnreadMessagesCount(0)
    sheetChatRef.current?.open()
  }
  const handleCaptionsOpen = () => {
    sheetCatiptionsRef.current?.open()
  }
  const handleParticipantsOpen = () => {
    sheetParticipantsRef.current?.open()
  }
  const checkScreenRecordingPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      )
      return granted === PermissionsAndroid.RESULTS.GRANTED
    }

    return true
  }

  const saveChunkToFile = async (chunk: any) => {
    console.log("saveChunkToFile")
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/recording-${roomId}.h264`
      const binary = Buffer.from(chunk, "base64") // convert base64 to binary
      const fileExists = await RNFS.exists(filePath)
      if (fileExists) {
        // Append to file instead of overwriting
        await RNFS.appendFile(filePath, binary.toString("base64"), "base64")
      } else {
        // If file doesn't exist, create a new file
        await RNFS.writeFile(filePath, binary.toString("base64"), "base64")
      }

      // Get file stats to check the size
      const statResult = await RNFS.stat(filePath)
      console.log("File size:", statResult.size)

      console.log(`Chunk saved to file at: ${filePath}`)
    } catch (error) {
      console.error("Failed to save chunk to file:", error)
    }
  }

  useEffect(() => {
    if (recordingUrl.current) {
      let reconnectTimeout: NodeJS.Timeout | null = null

      const connectWebSocket = () => {
        if (wsRef.current) {
          wsRef.current.close()
        }
        // const recordingUrl = 'http://192.168.0.105:8080'
        // const recordingUrl = socketRecordingUrl!

        wsRef.current = new WebSocket(recordingUrl.current)

        wsRef.current.onopen = () => {
          console.log("recording connected")
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
        }

        wsRef.current.onerror = (error) => {
          console.error("recording error:", error)
          console.log("recording connection error. Reconnecting...")
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000)
          }
        }

        wsRef.current.onclose = () => {
          console.warn("recording connection closed")
        }
      }

      connectWebSocket()

      return () => {
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        wsRef.current?.close()
      }
    }
  }, [recordingUrl.current])

  const removeFileIfExisted = async () => {
    const filePath = `${RNFS.DocumentDirectoryPath}/recording-${roomId}.h264`
    try {
      const fileExists = await RNFS.exists(filePath)
      if (fileExists) {
        await RNFS.unlink(filePath)
        console.log("Recording file deleted:", filePath)
      }
    } catch (error) {
      console.warn("Error stopping recorder or file not found.", error)
    } finally {
      return
    }
  }

  const handleRecordingButton = useCallback(() => {
    if (!instanceMeetingOwner) {
      Toast.show({
        type: "error",
        text1: t("OnlyCreatorCanStartScreenRecording"),
      })
      return
    }

    const handleAsync = async () => {
      const granted = await checkScreenRecordingPermission()
      if (!granted) {
        Toast.show({
          type: "error",
          text1: t("ScreenRecordingPermissionDenied"),
        })
        return
      }

      if (isScreenRecording) {
        handleStopRecording()
      } else {
        await removeFileIfExisted().finally(async () => {
          recordingNameRef.current = `recording-${Date.now()}`
          await startRecording()
          onStartRecord()
          startTimeRef.current = moment()
        })
      }
    }

    handleAsync()
  }, [isScreenRecording, instanceMeetingOwner])

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
      name: isScreenRecording ? "recordingOn" : "screenRecordStart",
      onPress: handleRecordingButton,
    },
  ]

  const handleStopRecording = () => {
    const endPayload = {
      fileName: recordingNameRef.current,
      action: "end",
      meetId,
      userId: localUserId,
      fileExtension: "raw",
      platform: Platform.OS,
      streamGroup: "mobile",
      mediaType: "both",
    }

    wsRef.current?.send(JSON.stringify(endPayload))
    onStopRecord()
    stopRecording()
    // const endVideoPayload = {
    //   fileName: `recording-${roomId}`,
    //   action: 'end',
    //   meetId,
    //   userId: localUserId,
    //   fileExtension: 'h256',
    //   platform: Platform.OS,
    //   duration,
    //   streamGroup: 'mobile'
    // };

    // wsRef.current?.send(JSON.stringify(endVideoPayload));
  }

  const callBottomActions = [
    {
      name: "callEnd",
      onPress: () => {
        if (isScreenRecording) {
          handleStopRecording()
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
    if (messages.length > 0) {
      setUnreadMessagesCount((prev) => prev + 1)
    }
  }, [messages])
  useEffect(() => {
    if (!!participants.length && socketInstance && eventId) {
      joinEvent({ eventId: String(eventId) })
    }
  }, [participants?.length, socketInstance, eventId])

  if (!participants?.length) {
    return <Loading />
  }
  console.log("\x1b[31m%s\x1b[0m", "meetingTitle", meetingTitle)
  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.mainWrapper}>
          {isRequestModalOpen && (
            <NewJoinRequestModal
              name={newUserFullName || "Guest"}
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
            isScreenShare={isScreenSharing}
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
                {unreadMessagesCount > 0 && item.name === "meetingChat" && (
                  <View style={styles.participansCountContainer}>
                    <Text style={styles.participantsCount}>
                      {unreadMessagesCount}
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
          ownerEmail={ownerEmail}
          isCreatorMode={isCreatorMode}
          hash={hash}
          participants={participants}
          sheetRef={sheetParticipantsRef}
        />
        <MeetingChatModal
          sheetRef={sheetChatRef}
          messages={messages}
          sendMessage={sendMessage}
          setUnreadMessagesCount={setUnreadMessagesCount}
        />
      </Portal>
    </>
  )
}

export default MeetingScreen
