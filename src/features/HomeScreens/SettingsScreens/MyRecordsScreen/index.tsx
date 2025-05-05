import { FlatList, StyleSheet } from "react-native"
import { isIOS } from "@utils/platformChecker"
import React, { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { moderateScale } from "react-native-size-matters"
import ScreenWrapper from "src/components/ScreenWrapper"
import RecordingCard from "src/components/RecordingCard"
import NoData from "src/components/NoData"
import { useGetRecordingsQuery } from "src/api/helpCenterApi/helpCenterApi"
import Loading from "src/components/Loading"
import { IRecordingsEntity } from "src/api/helpCenterApi/types"
import { useFocusEffect } from "@react-navigation/native"

const MyRecordsScreen = () => {
  const { t } = useTranslation()

  const [page, setPage] = React.useState(1)

  const {
    data: recordingsData,
    isLoading: recordingsLoading,
    refetch: recordingsDataRefetch,
  } = useGetRecordingsQuery({
    limit: 20,
    page,
  })

  const [recordings, setRecordings] = React.useState<IRecordingsEntity[]>([])
  const isRecordingsLoadingMore =
    recordingsData && recordings.length < recordingsData?.total

  const onRecordsLoad = () => {
    if (isRecordingsLoadingMore) {
      setPage((prev) => prev + 1)
    }
  }

  useFocusEffect(
    useCallback(() => {
      recordingsDataRefetch()
    }, [])
  )

  useEffect(() => {
    if (isRecordingsLoadingMore) {
      setRecordings((prev: IRecordingsEntity[]) => [
        ...prev,
        ...recordingsData?.data,
      ])
    }
  }, [recordingsData])
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
          <FlatList
            onEndReached={onRecordsLoad}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: moderateScale(8) }}
            data={recordings}
            renderItem={({ item }) => (
              <RecordingCard
                id={item?.id}
                title={item?.title}
                duration={item?.duration}
                date={item?.createdAt}
                recordingsDataRefetch={recordingsDataRefetch}
                srt={item?.srt}
              />
            )}
            keyExtractor={(item) => String(item?.id)}
          />
        )}
      </ScreenWrapper>
    </>
  )
}

export default MyRecordsScreen

export const styles = StyleSheet.create({})
