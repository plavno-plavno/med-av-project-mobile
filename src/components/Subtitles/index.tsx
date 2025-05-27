import { View, Text, StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { fontFamilies, fontWeights } from "@utils/theme"
import { isRtlText } from "@utils/isRtlText"

interface Props {
  isActive: boolean
  subtitlesQueue: string[]
}

const Subtitles = ({ isActive, subtitlesQueue }: Props) => {
  if (!isActive) return null
  return (
    <View style={styles.container} removeClippedSubviews={false}>
      {subtitlesQueue.map((subtitle, index) => {
        const isRtl = isRtlText(subtitle)

        const rtlPrefix = "\u200F"
        const ltrPrefix = "\u200E"

        const subtitlesWithDirection =
          (isRtl ? rtlPrefix : ltrPrefix) + subtitle

        return (
          <View key={`${subtitle}-${index}`}>
            <Text
              style={[
                styles.text,
                {
                  writingDirection: isRtl ? "rtl" : "ltr",
                  textAlign: isRtl ? "right" : "left",
                },
              ]}
            >
              {subtitlesWithDirection}
            </Text>
          </View>
        )
      })}
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
    minHeight: moderateScale(44),
  },
  text: {
    ...fontFamilies.interManropeBold14,
    ...fontWeights.fontWeight500,
    color: colors.white,
    marginBottom: moderateScale(4),
  },
})
