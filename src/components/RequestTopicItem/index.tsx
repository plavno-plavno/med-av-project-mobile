import { Icon } from "@components"
import { useNavigation } from "@react-navigation/native"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { useGetHelpQuery } from "src/api/helpCenterApi/helpCenterApi"
import colors from "src/assets/colors"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"

const RequestTopicItem = ({
  title,
  date,
  status,
  count,
  id,
}: {
  title: string
  date: string
  status: string
  count?: number
  id: number
}) => {
  const navigation = useNavigation<ROUTES>()

  const { data: helpData } = useGetHelpQuery({id})

  const statusBackgroundColor =
    status === "resolved" ? colors.successGreenLight : colors.pumpkin
  const statusTextColor =
    status === "resolved" ? colors.successGreen : colors.alertWarning

  const handlePress = () => {
    navigation.navigate(ScreensEnum.MY_REQUEST_DETAILS, {
      id: helpData?.id,
    })
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.infoContainer}>
        <Text style={styles.dateText}>{date}</Text>
        <View style={[helpers.flexRow, helpers.gap12]}>
          {!!count && <Text style={styles.countText}>{count}</Text>}
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
    </TouchableOpacity>
  )
}

export default RequestTopicItem

export const styles = StyleSheet.create({
  container: {
    width: "98%",
    alignSelf: "center",
    gap: moderateScale(4),
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),

    shadowColor: "#2E3946",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
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
    lineHeight: moderateScale(20), // Ensures the text is vertically centered
  },
})
