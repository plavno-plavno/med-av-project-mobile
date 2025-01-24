import { StyleSheet, View } from "react-native"
import { isIOS } from "@utils/platformChecker"
import React from "react"
import { useTranslation } from "react-i18next"
import { moderateScale } from "react-native-size-matters"
import ScreenWrapper from "src/components/ScreenWrapper"
import RecordingCard from "src/components/RecordingCard"
import NoData from "src/components/NoData"

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
          <NoData />
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

export const styles = StyleSheet.create({})
