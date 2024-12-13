import { fontFamilies, fontWeights } from "@utils/theme"
import { useTranslation } from "react-i18next"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Pressable } from "react-native-gesture-handler"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { Icon } from "src/components/Icon"

const MonthsToggler = () => {
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("Calendar")}</Text>
      <View style={styles.monthsToggler}>
        <Text style={styles.subtitle}>October, 2024</Text>
        <TouchableOpacity onPress={() => {}}>
          <Icon name="leftButton" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
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
