import React, { useRef } from "react"
import { FlatList, Text, View } from "react-native"
import useWebRtc from "src/hooks/useWebRtc"
import { styles } from "./styles"
import { Icon } from "@components"
import { helpers } from "@utils/theme"
import { useStatusBar } from "src/hooks/useStatusBar"
import colors from "src/assets/colors"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portal } from "react-native-portalize"
import MeetingChatModal from "src/modals/MeetingChatModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"
import VideoGrid from "src/components/VideoGrid/VideoGrid"
import ParticipantsModal from "src/modals/ParticipantsModal"
import { useRoute, RouteProp } from "@react-navigation/native"

type ParamList = {
  Detail: {
    isCreatorMode?: boolean
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
  console.log(participants, "participants")

  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { isCreatorMode } = route.params

  const sheetChatRef = useRef<BottomSheetMethods>(null)
  const sheetParticipantsRef = useRef<BottomSheetMethods>(null)

  const handleChatOpen = () => {
    sheetChatRef.current?.open()
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
      name: "captions",
      onPress: () => {},
      active: false,
    },
  ]

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.mainWrapper}>
          <View style={styles.upperControlContainer}>
            <Text style={styles.title}>{roomId}</Text>
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
