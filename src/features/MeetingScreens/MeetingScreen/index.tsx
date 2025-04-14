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
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native"
import SubtitlesModal from "src/modals/MeetingModals/SubtitlesModal"
import { Toast } from "react-native-toast-message/lib/src/Toast"
import { useTranslation } from "react-i18next"
import { useKeepAwake } from "@sayem314/react-native-keep-awake"
import Subtitles from "src/components/Subtitles"
import Loading from "src/components/Loading"
import Config from "react-native-config"
import NewJoinRequestModal from "src/modals/MeetingModals/NewJoinRequestModal"
import { useMeetingAccess } from "src/hooks/useMeetingAccess"
import { useAudioRecorder } from "src/hooks/useAudioRecorder"
import { NativeEventEmitter, NativeModules } from "react-native"
const { ScreenRecorder } = NativeModules
import RNFS from 'react-native-fs';
import Base64 from 'react-native-base64';

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

  const { onStartRecord, onStopRecord } = useAudioRecorder()
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
    meetId,
    rtcError,
  } = useWebRtc(instanceMeetingOwner!)
  const { goBack } = useNavigation()
  const [isRecording, setIsRecording] = useState(false);

  const [invitedParticipants, setInvitedParticipants] = useState<any[]>([])
  const [meInvited, setMeInvited] = useState<boolean | null>(null)

  const recordingNameRef = useRef<any>();
  const startTimeRef = useRef<any>();

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


  const saveChunkToFile = async (chunk: any) => {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/recording-${Date.now()}.webm`;
      const decodedData = Base64.decode(chunk);
      await RNFS.writeFile(filePath, decodedData, 'base64');

      RNFS.stat(filePath)
        .then((statResult) => {
          console.log('File size:', statResult.size);
          if (statResult.size > 0) {
            RNFS.readFile(filePath, 'base64')
              .then((fileData) => {
                console.log('File data (base64):', fileData);
              })
              .catch((error) => {
                console.error('Failed to read file:', error);
              });
          } else {
            console.log('File is empty.');
          }
        })
        .catch((error) => {
          console.error('Failed to get file stats:', error);
        });

      console.log(`Chunk saved to file at: ${filePath}`);
    } catch (error) {
      console.error("Failed to save chunk to file:", error);
    }
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(ScreenRecorder)
    const chunkListener = eventEmitter.addListener(
      "onVideoChunk",
      ({ chunk }) => {
        console.log("Received chunk:", chunk)
        sendChunkToServer(chunk)
      }
    )

    return () => {
      chunkListener.remove()
    }
  }, [])

  const startRecording = async () => {
    try {
      // if (wsRef.current?.readyState === WebSocket.OPEN) {
      //  recordingNameRef.current = `recording-mobile-${Date.now()}`
      // startTimeRef.current = Date.now()
      await ScreenRecorder.startRecording();
      console.log("Recording started")
      setIsRecording(true)
      // }
    } catch (error) {
      console.error(
        "Failed to start recording:",
        { ScreenRecorder, froMNATIVE: NativeModules.ScreenRecorder },
        error
      )
    }
  }
  const stopRecording = async () => {
    try {
      if (ScreenRecorder && isRecording) {
        await ScreenRecorder.stopRecording()
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const duration = startTimeRef.current
            ? Math.floor((Date.now() - startTimeRef.current) / 1000)
            : 0

          wsRef.current.send(
            JSON.stringify({
              fileName: recordingNameRef.current,
              fileExtension: "webm",
              action: "end",
              meetId,
              userId: localUserId,
              duration,
            })
          )
        }
        startTimeRef.current = null
      }
      setIsRecording(false)
    } catch (error) {
      console.error("Failed to stop recording:", error)
    }
  }

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

    connectWebSocket()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      wsRef.current?.close()
    }
  }, [])

  const sendChunkToServer = async (base64Chunk: any) => {
    try {
      await saveChunkToFile(base64Chunk);
      // if (wsRef.current?.readyState === WebSocket.OPEN) {
      //   wsRef.current.send(
      //     JSON.stringify({
      //       fileName: recordingNameRef.current,
      //       fileExtension: "mp4",
      //       chunks: base64Chunk,
      //       action: "stream",
      //     })          
      //   )
      //   console.log('chunk sent');
      // }
    } catch (error) {
      console.error("Failed to send chunk:", error)
    }
  }

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
          onStopRecord()
        } else {
          startRecording()
          onStartRecord()
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

  if (rtcError) {
    Toast.show({
      type: "error",
      text1:
        "Connection to media servers cannot be established, please consider rejoining",
    })
    goBack()
  }
  // if (!participants?.length) {
  //   return <Loading />
  // }
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
