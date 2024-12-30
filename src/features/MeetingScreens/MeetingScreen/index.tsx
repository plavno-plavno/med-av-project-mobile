import React, { useRef } from "react"
import { FlatList, Text, View } from "react-native"
import useWebRtc from "src/hooks/useWebRtc"
import { styles } from "./styles"
import { Icon } from "@components"
import { helpers } from "@utils/theme"
import { MediaStream } from "react-native-webrtc"
import { useStatusBar } from "src/hooks/useStatusBar"
import colors from "src/assets/colors"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portal } from "react-native-portalize"
import MeetingChatModal from "src/modals/DetailsEventModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"

const MeetingScreen = () => {
  const {
    localStream,
    remoteStreams,
    startCall,
    endCall,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    messages,
    sendMessage,
    setLocalStream,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    sharingOwner,
    participants,
    RTCView,
    roomId,
  } = useWebRtc()

  useStatusBar("light-content", colors.dark)

  const sheetRef = useRef<BottomSheetMethods>(null)

  const onClose = () => {
    sheetRef.current?.close()
  }

  const onOpen = () => {
    sheetRef.current?.open()
  }

  //TODO: add actions
  const callTopActions = [
    {
      name: "swapCamera",
      onPress: () => {},
    },
    {
      name: "soundOn",
      onPress: () => {},
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
      onPress: onOpen,
      active: false,
    },
    {
      name: "participantsIcon",
      onPress: () => {},
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
                  <View style={styles.actionButton}>
                    <Icon name={item.name as IconName} onPress={item.onPress} />
                  </View>
                )}
              />
            </View>
          </View>
          <View style={styles.videoContainer}>
            <RTCView
              streamURL={localStream?.toURL?.()}
              style={styles.videoCall}
            />
            <FlatList
              data={Object.values(remoteStreams)}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                if (!item.videoTrack && !item.audioTrack) {
                  return null // Skip if no tracks
                }

                // Create a MediaStream from the tracks
                const mediaStream = new MediaStream()

                if (item.videoTrack) {
                  mediaStream.addTrack(item.videoTrack)
                }

                if (item.audioTrack) {
                  mediaStream.addTrack(item.audioTrack)
                }

                return (
                  <View
                    style={{ width: 200, height: 500, backgroundColor: "blue" }}
                  >
                    <RTCView
                      streamURL={mediaStream.toURL()}
                      style={styles.video}
                    />
                  </View>
                )
              }}
            />
          </View>
        </View>
        <View style={styles.bottomControlContainer}>
          <FlatList
            data={callBottomActions}
            horizontal
            contentContainerStyle={[
              helpers.flex1,
              helpers.flexRowCenterBetween,
            ]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.actionButton}>
                <Icon name={item.name as IconName} onPress={item.onPress} />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
      <Portal>
        <MeetingChatModal sheetRef={sheetRef} />
      </Portal>
    </>
  )
}

export default MeetingScreen
