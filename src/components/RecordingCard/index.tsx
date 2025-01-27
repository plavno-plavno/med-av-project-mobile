import { Icon } from "@components"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import {
  useDownloadRecordingsMutation,
  useRemoveRecordingsMutation,
} from "src/api/helpCenterApi/helpCenterApi"
import colors from "src/assets/colors"

const RecordingCard = ({
  id,
  title,
  duration,
  time,
}: {
  id: number
  title: string
  duration: string
  time: string
}) => {
  const [removeRecordings] = useRemoveRecordingsMutation()
  const [downloadRecordings] = useDownloadRecordingsMutation()
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text style={styles.durationText}>{duration}</Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <View style={[helpers.flexRow, helpers.gap12]}>
        <Icon
          name="deleteAccount"
          onPress={() => removeRecordings({ id: 1 })}
        />
        <Icon name="download" onPress={() => downloadRecordings({ id: 1 })} />
      </View>
    </View>
  )
}

export default RecordingCard

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    boxShadow: "0px 0px 24px 0px rgba(46, 57, 70, 0.08)",
  },
  infoContainer: {
    flex: 1,
    gap: moderateScale(4),
  },
  title: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  durationText: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
  timeText: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.cadetGrey,
  },
})
