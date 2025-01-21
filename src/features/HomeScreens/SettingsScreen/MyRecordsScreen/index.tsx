import { StyleSheet, View } from "react-native"
import { Icon } from "@components"
import { isIOS } from "@utils/platformChecker"
import React from "react"
import { useTranslation } from "react-i18next"
import { Text } from "react-native"
import { moderateScale } from "react-native-size-matters"
import ScreenWrapper from "src/components/ScreenWrapper"
import { fontFamilies, fontWeights } from "@utils/theme"
import colors from "src/assets/colors"
import RecordingCard from "src/components/RecordingCard"

const MyRecordsScreen = () => {
  const { t } = useTranslation()

  return (
    <>
      <ScreenWrapper
        isBackButton
        title={t("MyRecordings")}
        isCenterTitle
        keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
      >
        {1 ? (
          <View style={styles.noDataContainer}>
            <Icon name="noData" />
            <Text style={styles.title}>{t("NoData")}</Text>
          </View>
        ) : (
          <RecordingCard
            title="Title"
            duration="RecordDuration"
            time="RecordTimeSave"
          />
        )}
      </ScreenWrapper>
    </>
  )
}

export default MyRecordsScreen

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
