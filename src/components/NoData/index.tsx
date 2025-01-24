import { Text, View } from "react-native"

import { fontWeights } from "@utils/theme"
import { fontFamilies } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { Icon } from "@components"
import { useTranslation } from "react-i18next"

const NoData = () => {
  const { t } = useTranslation()
  return (
    <View style={styles.noDataContainer}>
      <Icon name="noData" />
      <Text style={styles.title}>{t("NoData")}</Text>
    </View>
  )
}

export default NoData

export const styles = StyleSheet.create({
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
    marginTop: moderateScale(8),
  },
})
