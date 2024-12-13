import { fontFamilies, fontWeights } from "@utils/theme"
import moment from "moment"
import { useTranslation } from "react-i18next"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { Icon } from "src/components/Icon"
import { useAppDispatch, useAppSelector } from "src/hooks/redux"
import { changeWeek } from "src/redux/slices/calendarSlice/calendarSlice"

const MonthsToggler = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { currentDate } = useAppSelector((state) => state.calendar)

  const handleChangeWeek = (direction: string) => {
    dispatch(changeWeek(direction))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("Calendar")}</Text>
      <View style={styles.monthsToggler}>
        <Text style={styles.subtitle}>
          {moment(currentDate).format("MMMM, YYYY")}
        </Text>
        <TouchableOpacity onPress={() => handleChangeWeek("prev")}>
          <Icon name="leftButton" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleChangeWeek("next")}>
          <Icon name="rightButton" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default MonthsToggler

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(11),
    paddingHorizontal: moderateScale(16),
  },
  title: {
    ...fontFamilies.interManropeSemiBold18,
    ...fontWeights.fontWeight600,
    color: colors.white,
  },
  subtitle: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.lavenderMist,
  },
  monthsToggler: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
})
