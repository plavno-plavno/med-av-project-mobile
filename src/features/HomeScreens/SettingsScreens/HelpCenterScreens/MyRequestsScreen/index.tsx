import { DateTimeFormatEnum } from "@utils/enums"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import { t } from "i18next"
import moment from "moment"
import { FlatList } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { useGetRequestQuery } from "src/api/helpCenterApi/helpCenterApi"
import NoData from "src/components/NoData"
import RequestTopicItem from "src/components/RequestTopicItem"
import ScreenWrapper from "src/components/ScreenWrapper"

const MyRequestsScreen = () => {
  const { data: requestData, isLoading: requestLoading } = useGetRequestQuery({
    limit: 10,
    page: 1,
  })
  console.log(requestData, "requestData")

  return (
    <ScreenWrapper
      isBackButton
      title={t("MyRequests")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      {!requestData ? (
        <NoData />
      ) : (
        <FlatList
          contentContainerStyle={helpers.gap8}
          data={requestData?.data}
          renderItem={({ item }) => (
            <RequestTopicItem
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
