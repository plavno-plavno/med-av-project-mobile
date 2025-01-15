import React, { useRef } from "react"
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

type ParamList = {
  Detail: {
    isCreatorMode?: boolean
    title?: string
    hash?: string
  }
}

const MeetingScreen = () => {
  const {
    localStream,
    remoteStreams,
    endCall,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    roomId,
    participants,
    isSpeakerOn,
    isCameraSwitched,
    switchCamera,
    toggleSpeaker,
    messages,
    sendMessage,
  } = useWebRtc()

  useStatusBar("light-content", colors.dark)

  const [isCaptionOn, setIsCaptionOn] = React.useState(false)
  const [subtitleLanguage, setSubtitleLanguage] = React.useState("")
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { isCreatorMode, title, hash } = route.params

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

  //TODO: add actions
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
      onPress: () => {},
    },
  ]
  //TODO: add actions
  const callBottomActions = [
    {
      name: "callEnd",
      onPress: endCall,
    },
    {
      name: isVideoOff ? "cameraOff" : "cameraOn",
      onPress: toggleVideo,
    },
    { name: isMuted ? "microOff" : "microOn", onPress: toggleAudio },
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
            remoteStreams={remoteStreams}
            localStream={localStream}
            isVideoOff={isVideoOff}
            isMuted={isMuted}
          />
        </View>
        <View>
          <FlatList
            data={callBottomActions}
            horizontal
            contentContainerStyle={styles.bottomControlContainer}
            keyExtractor={(index) => index.toString()}
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
