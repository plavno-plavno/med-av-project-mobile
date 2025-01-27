import { StyleSheet } from "react-native"
import { isIOS } from "@utils/platformChecker"
import React from "react"
import { useTranslation } from "react-i18next"
import { moderateScale } from "react-native-size-matters"
import ScreenWrapper from "src/components/ScreenWrapper"
import RecordingCard from "src/components/RecordingCard"
import NoData from "src/components/NoData"
import { useGetRecordingsQuery } from "src/api/helpCenterApi/helpCenterApi"
import Loading from "src/components/Loading"

const MyRecordsScreen = () => {
  const { t } = useTranslation()

  const { data: recordingsData, isLoading: recordingsLoading } =
    useGetRecordingsQuery({
      limit: 10,
      page: 1,
    })

  return (
    <>
      <ScreenWrapper
        isBackButton
        title={t("MyRecordings")}
        isCenterTitle
        keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
      >
        {recordingsLoading ? (
          <Loading />
        ) : !recordingsData?.data?.length ? (
          <NoData />
        ) : (
          <RecordingCard
            id={1}
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
