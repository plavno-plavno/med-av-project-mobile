import React, { useEffect, useRef, useState } from "react"
import { FlatList, PermissionsAndroid, Platform, Text, View } from "react-native"
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
import useSttConnection from "src/hooks/useSttConnection"
import RecordScreen, { RecordingResult } from 'react-native-record-screen';
import RNFS from 'react-native-fs';
import RNFetchBlob from "react-native-blob-util"
import base64 from "base64-js";

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

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk

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
    sttUrl,

    endCall,
    toggleMedia,
    switchCamera,
    toggleSpeaker,
    sendMessage,
    startCall,
  } = useWebRtc()
  // const { stopStreaming, isSttConnected, toggleSttMicrophoneMute, handleChangeSttLanguage, subtitles } = useSttConnection({ sttUrl,
  //   isAudioOn: !isMuted });
  // console.log(isSttConnected, 'isSttConnectedisSttConnected');
  // console.log(subtitles, 'subtitlessubtitlessubtitlessubtitlessubtitles');

  useKeepAwake()
  useStatusBar("light-content", colors.dark)
  const [isCaptionOn, setIsCaptionOn] = React.useState(false)
  const [subtitleLanguage, setSubtitleLanguage] = React.useState("")
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { isCreatorMode, title, hash, instanceMeetingOwner } = route.params

  const sheetChatRef = useRef<BottomSheetMethods>(null)
  const sheetCatiptionsRef = useRef<BottomSheetMethods>(null)
  const sheetParticipantsRef = useRef<BottomSheetMethods>(null)

  useEffect(() => {
    startCall({
       isVideoOn: !route.params?.isVideoOff,
       isAudioOn: !route.params?.isMuted,
    });
  }, [])

  const handleChatOpen = () => {
    sheetChatRef.current?.open()
  }
  const handleCaptionsOpen = () => {
    sheetCatiptionsRef.current?.open()
  }
  const handleParticipantsOpen = () => {
    sheetParticipantsRef.current?.open()
  }

  const moveFileToDownloads = async (filePath: string) => {
    const newPath = `${RNFS.ExternalStorageDirectoryPath}/Download/recordedVideo.mp4`;
    try {
      await RNFS.copyFile(filePath, newPath);
      console.log("File moved successfully:", newPath);
      return newPath;
    } catch (error) {
      console.error("Error moving file:", error);
    }
  };


  const streamFile = async (filePath: string, sendChunk: (data: Uint8Array) => void) => {
    try {
      const fileStat = await RNFetchBlob.fs.stat(filePath);
      const fileSize = fileStat.size;
      let offset = 0;
  
      console.log(`Starting file stream, size: ${fileSize} bytes`);
  
      const stream = await RNFetchBlob.fs.readStream(filePath, "base64", CHUNK_SIZE);
  
      stream.open();
  
      stream.onData((data) => {
        if (typeof data === "string") {
          const chunkBuffer = base64.toByteArray(data); // Convert base64 to Uint8Array
          sendChunk(chunkBuffer);
        }
      });
  
      stream.onError((err) => {
        console.error("Error reading stream:", err);
      });
  
      stream.onEnd(() => {
        console.log("File streaming complete");
      });
    } catch (error) {
      console.error("Error streaming file:", error);
    }
  };

const sendChunk = (data: Uint8Array) => {
  console.log(data, 'datadatadatadatadatadata');
};

const [isStarted, setIsStarted] = useState(false);
  const startRecording = async () => {
    try {
      console.log('asdfasdfsfsfsaf');
      
      const res = RecordScreen.startRecording({
        onBuffer: (buffer) => {
          console.log(buffer, ' bufferbufferbufferbuffer');
          
          // This is where you access the buffer data.
          // sendBufferOverWebSocket(buffer);
        },
      });

      if (res === RecordingResult.PermissionError) {
        return
      }
      setIsStarted(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res: any = await RecordScreen.stopRecording().catch((error) => console.warn(error));
      console.log(res, 'Recording result:', res);
      
      // await new Promise(resolve => setTimeout(resolve, 1000));
      // RecordScreen.clean();
      setIsStarted(false);
  
      // if (res?.result?.outputURL) {
      //   const outputPath = res.result.outputURL;
      //   moveFileToDownloads(outputPath)
      //   streamFile(outputPath, sendChunk);
      // }
    } catch (error) {
      console.error('Error stopping and saving recording:', error);
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
        instanceMeetingOwner
          ? isStarted ? stopRecording() : startRecording()
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
      onPress: endCall,
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
          />
          <Subtitles isActive={isCaptionOn} />
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
          setSubtitleLanguage={setSubtitleLanguage}
          sheetRef={sheetCatiptionsRef}
          setIsCaptionOn={setIsCaptionOn}
          isCaptionOn={isCaptionOn}
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
