import React, { useEffect } from "react"
import { FlatList, Text, View } from "react-native"
import useWebRtc from "src/hooks/useWebRtc"
import { styles } from "./styles"
import { Icon } from "@components"
import { helpers } from "@utils/theme"

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
  } = useWebRtc()

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
      onPress: () => {},
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

  useEffect(() => {
    startCall()
  }, [])
  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <View style={styles.upperControlContainer}>
          <Text style={styles.title}>qqqtestqqq</Text>
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
          <RTCView streamURL={localStream?.toURL()} style={styles.videoCall} />
          <FlatList
            data={Object.values(remoteStreams)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              console.log(item, "itemitemitemitemitem")

              return <RTCView streamURL={item?.toURL()} style={styles.video} />
            }}
          />
        </View>
      </View>
      <View style={styles.bottomControlContainer}>
        <FlatList
          data={callBottomActions}
          horizontal
          contentContainerStyle={[helpers.flex1, helpers.flexRowCenterBetween]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.actionButton}>
              <Icon name={item.name as IconName} onPress={item.onPress} />
            </View>
          )}
        />
      </View>
    </View>
  )
}

export default MeetingScreen