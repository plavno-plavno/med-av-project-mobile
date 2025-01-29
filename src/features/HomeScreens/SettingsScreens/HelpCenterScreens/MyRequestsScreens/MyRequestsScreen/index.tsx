import { useFocusEffect } from "@react-navigation/native"
import { DateTimeFormatEnum } from "@utils/enums"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import { t } from "i18next"
import moment from "moment"
import { useCallback, useEffect } from "react"
import { FlatList } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { useGetRequestQuery } from "src/api/helpCenterApi/helpCenterApi"
import Loading from "src/components/Loading"
import NoData from "src/components/NoData"
import RequestTopicItem from "src/components/RequestTopicItem"
import ScreenWrapper from "src/components/ScreenWrapper"
import useWebSocket from "src/socket/socket"

const MyRequestsScreen = () => {
  const {
    data: requestData,
    isLoading: requestLoading,
    refetch,
  } = useGetRequestQuery({
    limit: 50,
    page: 1,
  })

  useWebSocket(refetch)

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [])
  )

  return (
    <ScreenWrapper
      isBackButton
      title={t("MyRequests")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      {requestLoading ? (
        <Loading />
      ) : !requestData?.data?.length ? (
        <NoData />
      ) : (
        <FlatList
          scrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            helpers.gap8,
            {
              paddingTop: moderateScale(3),
              paddingBottom: moderateScale(20),
            },
          ]}
          data={requestData?.data}
          renderItem={({ item }) => (
            <RequestTopicItem
              id={item?.id}
              title={item?.category?.name}
              date={moment(item?.createdAt).format(DateTimeFormatEnum.DDMMYYYY)}
              status={item?.status?.name}
              count={item?.unreadCount}
            />
          )}
        />
      )}
    </ScreenWrapper>
  )
}

export default MyRequestsScreen
