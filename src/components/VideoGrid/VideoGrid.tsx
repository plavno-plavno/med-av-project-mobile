import React from "react"
import { fontFamilies, fontWeights } from "@utils/theme"
import { useTranslation } from "react-i18next"
import { View, StyleSheet, Text, ViewStyle } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { MediaStream, RTCView } from "react-native-webrtc"
import colors from "src/assets/colors"

const VideoGrid = ({ remoteStreams, localStream }: any) => {
  const { t } = useTranslation()
  const getGridStyle = ({
    idx,
    total,
  }: {
    idx?: number
    total: number
  }): ViewStyle => {
    if (total === 0) return { width: "100%", height: "100%" }
    if (total === 1) return { width: "100%", height: "49.6%" }
    if (total === 2)
      return {
        width: idx === 1 ? "100%" : "49.3%",
        height: "49.6%",
      }
    if (total === 3) return { width: "49.3%", height: "49.6%" }
    if (total >= 4) return { width: "49.3%", height: "32.8%" }
    return { width: "100%", height: "100%" }
  }

  const renderTile = (item: any, index: number, total: number) => {
    if (index === 4 && total > 5) {
      return (
        <View
          style={[
            styles.overflowTile,
            styles.video,
            getGridStyle({ total: remoteStreams.length, idx: index }),
          ]}
        >
          <Text style={styles.overflowText}>
            {total - 4} {t("morePeople")}
          </Text>
        </View>
      )
    }

    const mediaStream = new MediaStream()
    if (item.videoTrack) mediaStream.addTrack(item.videoTrack)
    if (item.audioTrack) mediaStream.addTrack(item.audioTrack)

    return (
      <RTCView
        key={index}
        streamURL={mediaStream?.toURL?.()}
        style={[
          styles.video,
          getGridStyle({ total: remoteStreams.length, idx: index }),
        ]}
        objectFit="cover"
      />
    )
  }

  return (
    <View style={styles.container}>
      {/* Локальний потік */}
      <RTCView
        streamURL={localStream?.toURL?.()}
        style={[getGridStyle({ total: remoteStreams.length }), styles.video]}
      />
      {/* Віддалені потоки */}
      {Object.values(remoteStreams).map((item, index) =>
        renderTile(item, index, remoteStreams.length)
      )}
    </View>
  )
}

export default VideoGrid

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    gap: moderateScale(4),
    justifyContent: "center",
    overflow: "hidden",
  },
  overflowTile: {
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.charcoal,
  },
  overflowText: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight600,
    color: colors.ghostWhite,
  },
})
