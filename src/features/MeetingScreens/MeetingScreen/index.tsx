import React, { useEffect, useRef, useState } from "react"
import { Alert, FlatList, Text, View } from "react-native"
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
import { NativeEventEmitter, NativeModules } from "react-native"
const { ScreenRecorder } = NativeModules

import { Linking, Platform } from "react-native"
import RNFS from "react-native-fs"

const openRecordedVideo = async () => {
  try {
    const filePath = await ScreenRecorder.getRecordedFilePath();
    if (!filePath) {
      Alert.alert("Error", "No recorded file found.");
      return;
    }

    const exists = await RNFS.exists(filePath);
    if (!exists) {
      Alert.alert("Error", "Recorded file not found.");
      return;
    }

    const fileInfo = await RNFS.stat(filePath);
    console.log(`File size: ${fileInfo.size} bytes`);

    if (fileInfo.size < 1024) {
      Alert.alert("Error", "Recorded file is too small or corrupted.");
      return;
    }

    const newPath = `${RNFS.DownloadDirectoryPath}/screen_record.mp4`;
    await RNFS.copyFile(filePath, newPath);
    console.log(`File copied to: ${newPath}`);

    // 🔴 Переконаємось, що файл має правильні права доступу
    await RNFS.scanFile(newPath);

    Linking.openURL(`file://${newPath}`).catch(() => Alert.alert("Error", "Failed to open video."));
  } catch (error) {
    console.error("Failed to get recorded file:", error);
    Alert.alert("Error", "Failed to retrieve recorded file.");
  }
};

const recordingUrl = Config.SOCKET_RECORDING_URL

type ParamList = {
  Detail: {
    isCreatorMode?: boolean
    title?: string
    hash?: string
    instanceMeetingOwner?: boolean
    isVideoOff?: boolean
    isMuted?: boolean
  }
}

const MeetingScreen = () => {
  const { t } = useTranslation()
  const {
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
    allLanguagesRef,
    subtitlesQueue,
    sharedScreen,
    wsRef,
    endCall,
    toggleMedia,
    switchCamera,
    toggleSpeaker,
    sendMessage,
    handleChangedRoomLanguage,
  } = useWebRtc()
  useKeepAwake()
  useStatusBar("light-content", colors.dark)
  const [isCaptionOn, setIsCaptionOn] = React.useState(false)
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { isCreatorMode, title, hash, instanceMeetingOwner } = route.params
  const startTimeRef = useRef<number | null>(null);
  const recordingNameRef = useRef<string | null>(null);

  const sheetChatRef = useRef<BottomSheetMethods>(null)
  const sheetCatiptionsRef = useRef<BottomSheetMethods>(null)
  const sheetParticipantsRef = useRef<BottomSheetMethods>(null)

  const [isStarted, setIsStarted] = useState(false)

  const handleChatOpen = () => {
    sheetChatRef.current?.open()
  }
  const handleCaptionsOpen = () => {
    sheetCatiptionsRef.current?.open()
  }
  const handleParticipantsOpen = () => {
    sheetParticipantsRef.current?.open()
  }

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(ScreenRecorder);
    const chunkListener = eventEmitter.addListener("onVideoChunk", (base64Chunk) => {
      console.log("Received chunk:", base64Chunk);
      sendChunkToServer(base64Chunk);
    });
  
    return () => {
      chunkListener.remove();
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log(wsRef.current?.readyState, 'wsRef.current?.readyState');
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        recordingNameRef.current = `recording-${Date.now()}`;
        startTimeRef.current = Date.now();
        await ScreenRecorder.startRecording();

        console.log("Recording started:")
        setIsStarted(true)
      }
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
      if(ScreenRecorder && isStarted) {
      await ScreenRecorder.stopRecording()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const duration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
        const data = {
          fileName: recordingNameRef.current,
            fileExtension: 'mp4',
            action: 'end',
            meetId: roomId,
            userId: localUserId,
            duration,
        }
        console.log(data, 'datadatadata');
        
        wsRef.current.send(
          JSON.stringify({
            fileName: recordingNameRef.current,
            fileExtension: 'mp4',
            action: 'end',
            meetId: roomId,
            userId: localUserId,
            duration,
          }),
        );
      }
      startTimeRef.current = null;
      openRecordedVideo();
    }
    setIsStarted(false)
    } catch (error) {
      console.error("Failed to stop recording:", error)
    }
  }

useEffect(() => {
  let reconnectTimeout: NodeJS.Timeout | null = null;

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = new WebSocket(recordingUrl!);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.log("WebSocket connection error. Reconnecting...");
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    wsRef.current.onclose = () => {
      console.warn("WebSocket connection closed");
    };
  };

  connectWebSocket();

  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    wsRef.current?.close();
  };
}, []);
  
  const sendChunkToServer = async (base64Chunk: any) => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('here');
        wsRef.current.send(
          JSON.stringify({
            fileName: recordingNameRef.current,
            fileExtension: 'mp4',
            chunks: base64Chunk,
            action: 'stream',
          }),
        );
    }
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
        instanceMeetingOwner
          ? isStarted
            ? stopRecording()
            : startRecording()
          : Toast.show({
              type: "error",
              text1: t("OnlyCreatorCanStartScreenRecording"),
            })
      },
      style: { opacity: isStarted ? 1 : 0.5 },
    },
  ]

  const callBottomActions = [
    {
      name: "callEnd",
      onPress: () => {
        stopRecording()
        endCall()
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
          <View style={styles.upperControlContainer}>
            <Text style={styles.title}>{title || hash}</Text>
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
            sharedScreen={sharedScreen}
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
          allLanguagesRef={allLanguagesRef}
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
