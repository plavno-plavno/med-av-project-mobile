import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native"
import useWebRtc from "src/hooks/useWebRtc"
import { styles } from "./styles"
import { Icon } from "@components"
import { useStatusBar } from "src/hooks/useStatusBar"
import colors from "src/assets/colors"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
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
import { formatLastName } from "@utils/utils"
import { moderateScale } from "react-native-size-matters"

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
  const insets = useSafeAreaInsets()

  const hasRoundedCorners =
    Platform.OS === 'ios' &&
    (insets.top > 20 || insets.bottom > 0 || insets.left > 0 || insets.right > 0)
  const {
    socket,
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
    // onStartRecord,
    onStopRecord,
    startRecording,
    stopRecording,
    isScreenRecording,
    recordingNameRef,
    isRecordingStarted,
    setIsSpeakerOn,
    sharedScreen,
    sharingOwner,
    isScreenSharing,
    isCurrentUserJoined,
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
  const meetingTitle = title === "Instant meeting" ? "Instant meeting" : title

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


  const sendActionToMainSocket = useCallback(() => {
    if (!socket?.id) return
    socket?.emit('action', {
      roomId: roomId,
      action: 'start-recording',
      socketId: socket?.id,
    });
  }, [socket?.id])

  useEffect(() => {
    if (recordingUrl.current) {
      let reconnectTimeout: NodeJS.Timeout | null = null
      let retryCount = 0
      const MAX_RETRIES = 3

      const connectWebSocket = () => {
        if (wsRef.current) {
          wsRef.current.close()
        }

        // wsRef.current = new WebSocket('http://192.168.0.105:8080')
        wsRef.current = new WebSocket(recordingUrl.current)

        wsRef.current.onopen = () => {
          console.log("recording connected")
          retryCount = 0
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
        }

        wsRef.current!.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'error') {
              Toast.show({
                type: 'error',
                text1: JSON.stringify(message.error)
              })
              handleStopRecording()
              wsRef.current?.close();
              isRecordingStarted.current = false
            }

            if (message.type === 'start_allowed') {
              isRecordingStarted.current = true
              startTimeRef.current = moment()
              sendActionToMainSocket();
              await startRecording()
            }
          } catch (err) {
            console.warn(
              '[RecorderManager] Failed to parse WebSocket message:',
              event.data,
            );
          }
        };

        wsRef.current.onerror = (error) => {
          console.error("recording error:", error)
          if (retryCount < MAX_RETRIES) {
            console.log(`Reconnect attempt #${retryCount + 1}`)
            retryCount += 1
            reconnectTimeout = setTimeout(connectWebSocket, 3000)
          } else {
            console.warn("Max retries reached. Giving up.")
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
  }, [recordingUrl.current, isRecordingStarted.current])

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

  const handleAsync = useCallback(async () => {
    const granted = await checkScreenRecordingPermission()
    if (!granted) {
      Toast.show({
        type: "error",
        text1: t("ScreenRecordingPermissionDenied"),
      })
      return
    }
    if (isRecordingStarted.current && meetId) {
      handleStopRecording()
      isRecordingStarted.current = false
    } else {
      const recName = `recording-${Date.now()}`
      recordingNameRef.current = recName

      const startPayload = {
        action: 'start',
        fileName: recName,
        fileExtension: "raw",
        meetId,
        userId: localUserId,
      };
      try {
        wsRef.current?.send(JSON.stringify(startPayload))
      } catch (error) {
        console.log(error, 'error handleAsync');
      }
    }
  }, [isRecordingStarted.current, recordingNameRef.current, wsRef.current, localUserId, meetId])

  const handleRecordingButton = useCallback(() => {
    if (!instanceMeetingOwner) {
      Toast.show({
        type: "error",
        text1: t("OnlyCreatorCanStartScreenRecording"),
      })
      return
    }

    handleAsync()
  }, [isScreenRecording, instanceMeetingOwner, wsRef.current])

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

  const handleStopRecording = useCallback(() => {
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
    socket?.emit('action', {
      roomId: roomId,
      action: 'stop-recording',
      socketId: socket.id,
    });
    onStopRecord()
    stopRecording()
  }, [socket, recordingNameRef.current, localUserId, roomId])

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

  if (!isCurrentUserJoined) {
    return <Loading />
  }
  return (
    <View style={{ flex: 1 }}>
      {isScreenRecording && (
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            borderWidth: moderateScale(2.5),
            borderColor: colors.lightAqua,
            zIndex: 9999,
            right: 3,
            borderRadius: hasRoundedCorners ? moderateScale(58) : 0,
          }}
        />
      )}
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
    </View>
  )
}

export default MeetingScreen
