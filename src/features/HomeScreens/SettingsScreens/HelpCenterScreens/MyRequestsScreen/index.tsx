import { isIOS } from "@utils/platformChecker"
import { t } from "i18next"
import { moderateScale } from "react-native-size-matters"
import RequestTopicItem from "src/components/RequestTopicItem"
import ScreenWrapper from "src/components/ScreenWrapper"

const MyRequestsScreen = () => {
  return (
    <ScreenWrapper
      isBackButton
      title={t("MyRequests")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      <>
        <RequestTopicItem
          title="Request Topic Name"
          date="05.08.2024"
          status="resolved"
          count={1}
        />
      </>
    </ScreenWrapper>
  )
}

export default MyRequestsScreen
