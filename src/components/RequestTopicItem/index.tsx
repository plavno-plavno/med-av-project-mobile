import { Icon } from "@components"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

const RequestTopicItem = ({
  title,
  date,
  status,
  count,
}: {
  title: string
  date: string
  status: string
  count?: number
}) => {
  const statusBackgroundColor =
    status === "resolved" ? colors.successGreenLight : colors.pumpkin
  const statusTextColor =
    status === "resolved" ? colors.successGreen : colors.alertWarning
  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.infoContainer}>
        <Text style={styles.dateText}>{date}</Text>
        <View style={[helpers.flexRow, helpers.gap12]}>
          {count && <Text style={styles.countText}>{count}</Text>}
          <Icon name="chevronRight" />
        </View>
      </View>
      <View style={[helpers.flexRow]}>
        <Text
          style={[
            styles.statusText,
            {
              backgroundColor: statusBackgroundColor,
              color: statusTextColor,
            },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  )
}

export default RequestTopicItem

export const styles = StyleSheet.create({
  container: {
    gap: moderateScale(4),
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    boxShadow: "0px 0px 10px 0px rgba(46, 57, 70, 0.08)",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  dateText: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.cadetGrey,
  },
  statusText: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.cadetGrey,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(7),
  },
  countText: {
    ...fontFamilies.interManropeSemiBold12,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
    backgroundColor: colors.successGreen,
    borderRadius: moderateScale(50),
    width: moderateScale(20),
    height: moderateScale(20),
    textAlign: "center",
  },
})
