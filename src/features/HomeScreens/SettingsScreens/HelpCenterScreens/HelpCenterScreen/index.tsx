import { CustomButton } from "@components"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, View } from "react-native"
import { ActivityIndicator } from "react-native-paper"
import { moderateScale } from "react-native-size-matters"
import { useGetMessageCountQuery } from "src/api/helpCenterApi/helpCenterApi"
import NavigationItem from "src/components/NavigationItem"
import ScreenWrapper from "src/components/ScreenWrapper"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import useWebSocket from "src/socket/socket"

const HelpCenterScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()

  const { data: messageCount, refetch, isLoading } = useGetMessageCountQuery()

  const helpCenterTopics = [
    {
      title: t("MyRequests") + ` (${messageCount})`,
      leftIcon: "myRequest" as IconName,
      rightIcon: "chevronRight" as IconName,
      onPress: () => {
        navigation.navigate(ScreensEnum.MY_REQUESTS, {})
      },
    },
    {
      title: t("FAQ"),
      leftIcon: "faq" as IconName,
      rightIcon: "chevronRight" as IconName,
      onPress: () => {
        navigation.navigate(ScreensEnum.FAQ, {})
      },
    },
  ]
  const privacyPolicyTopics = [
    {
      title: t("TermsOfUse"),
      leftIcon: "privacyPolicy" as IconName,
      rightIcon: "openArrow" as IconName,
      onPress: () => {
        // navigation.navigate(ScreensEnum.TERMS_OF_USE, {})
      },
    },
    {
      title: t("PrivacyPolicy"),
      leftIcon: "privacyPolicy" as IconName,
      rightIcon: "openArrow" as IconName,
      onPress: () => {
        // navigation.navigate(ScreensEnum.PRIVACY_POLICY, {})
      },
    },
  ]

  useWebSocket(refetch)

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [])
  )
  return (
    <ScreenWrapper
      isBackButton
      title={t("HelpCenter")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      <View style={[helpers.flex1, helpers.gap20]}>
        <View>
          <FlatList
            contentContainerStyle={[helpers.gap8]}
            data={helpCenterTopics}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => <NavigationItem {...item} />}
          />
        </View>
        <View>
          <FlatList
            contentContainerStyle={[helpers.gap8]}
            data={privacyPolicyTopics}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => <NavigationItem {...item} />}
          />
        </View>
      </View>
      <CustomButton
        style={{ bottom: moderateScale(30) }}
        text={t("ContactSupport")}
        rightIcon={"nextArrow"}
        onPress={() => {
          navigation.navigate(ScreensEnum.CONTACT_SUPPORT, {})
        }}
      />
    </ScreenWrapper>
  )
}

export default HelpCenterScreen
