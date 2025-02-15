import { fontFamilies, fontWeights } from "@utils/theme"
import { View, Text, StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { useAppSelector, useAppDispatch } from "src/hooks/redux"
import { setSubtitles } from "src/redux/slices/calendarSlice/subtitlesSlice"

interface ISubtitles {
  isActive: boolean
}

const Subtitles = ({ isActive }: ISubtitles) => {
  //REDUX: for subtitles
  const { subtitles } = useAppSelector((state) => state.subtitles)
  const dispatch = useAppDispatch()
  dispatch(setSubtitles("HELLO WORLD"))
  if (!isActive) return null
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{subtitles}</Text>
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
  },
  text: {
    ...fontFamilies.interManropeBold14,
    ...fontWeights.fontWeight500,
    color: colors.white,
  },
})
