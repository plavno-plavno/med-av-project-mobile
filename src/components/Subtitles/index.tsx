import { fontFamilies, fontWeights } from "@utils/theme"
import { View, Text, StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { ISubtitle } from "src/hooks/useWebRtc"

interface Props {
  isActive: boolean
  subtitlesQueue: ISubtitle[];
}

const Subtitles = ({ isActive, subtitlesQueue }: Props) => {
  if (!isActive) return null
  return (
    <View style={styles.container}>
      {subtitlesQueue.map(subtitle => (
        <Text style={styles.text}>{subtitle.text}</Text>
      ))}
    </View>
  )
}

export default Subtitles

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: moderateScale(-8),
    left: moderateScale(16),
    right: moderateScale(16),
    backgroundColor: colors.mirage,
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    maxHeight: moderateScale(86),
    minHeight: moderateScale(44),
  },
  text: {
    ...fontFamilies.interManropeBold14,
    ...fontWeights.fontWeight500,
    color: colors.white,
  },
})
