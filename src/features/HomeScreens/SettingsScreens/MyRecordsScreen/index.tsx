import { FlatList, StyleSheet } from "react-native"
import { isIOS } from "@utils/platformChecker"
import React, { useCallback, useEffect, useState } from "react"
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
    isFetching: recordingsFetching,
    refetch,
  } = useGetRecordingsQuery({
    limit: 20,
    page,
  })

  const [recordings, setRecordings] = React.useState<IRecordingsEntity[]>([])
  const [isShouldRecordingsUpdate, setIsShouldRecordingsUpdate] = useState(false);

  const isRecordingsLoadingMore =
    recordingsData && recordings.length < recordingsData?.total

  const onRecordsLoad = () => {
    if (isRecordingsLoadingMore) {
      setPage((prev) => prev + 1)
    }
  }

  const refreshListAfterDelete = () => {
    setPage(1)
    setRecordings([])
    refetch()
  }

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [])
  )

  useEffect(() => {
    if (recordingsData?.data) {
      setRecordings((prev: IRecordingsEntity[]) => {
        if(isShouldRecordingsUpdate) return recordingsData.data
        if (page === 1) return recordingsData.data
        return [...prev, ...recordingsData.data]
      })
      setIsShouldRecordingsUpdate(false);
    }
  }, [recordingsData?.data, isShouldRecordingsUpdate, page])

  return (
    <>
      <ScreenWrapper
        isBackButton
        title={t("MyRecordings")}
        isCenterTitle
        keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
        childrenStyle={{
          paddingHorizontal: moderateScale(0),
          paddingVertical: moderateScale(0),
          paddingTop: moderateScale(10),
        }}
      >
        {recordingsFetching ? (
          <Loading />
        ) : !recordings?.length ? (
          <NoData />
        ) : (
          <FlatList
            onEndReached={onRecordsLoad}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: moderateScale(8),
              paddingHorizontal: moderateScale(16),
              paddingVertical: moderateScale(8),
              marginTop: moderateScale(10),
            }}
            data={recordings}
            renderItem={({ item }) => (
              <RecordingCard
                id={item?.id}
                title={item?.title}
                duration={item?.duration}
                date={item?.createdAt}
                onDeleted={refreshListAfterDelete}
                refetch={refetch}
                srt={item?.srt}
                setIsShouldRecordingsUpdate={setIsShouldRecordingsUpdate}
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
