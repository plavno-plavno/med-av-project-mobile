import { CustomButton } from "@components"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { privacyPolicy } from "@utils/mockData"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import React, { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { useGetMessageCountQuery } from "src/api/helpCenterApi/helpCenterApi"
import { usePrivacyFilesQuery } from "src/api/mediaApi/mediaApi"
import NavigationItem from "src/components/NavigationItem"
import ScreenWrapper from "src/components/ScreenWrapper"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import useWebSocket from "src/socket/socket"

const HelpCenterScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()

  const { data: messageCount, refetch } = useGetMessageCountQuery()
  const { data: privacyFiles, isLoading: isPrivacyLoading } =
    usePrivacyFilesQuery()

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
  const privacyPolicyTopics = privacyFiles?.flatMap((item: any) => {
    const title = item.tag === "privacy" ? t("PrivacyPolicy") : t("TermsOfUse")
    return [
      {
        title,
        leftIcon: "privacyPolicy" as IconName,
        rightIcon: "openArrow" as IconName,
        onPress: () => {
          navigation.navigate(ScreensEnum.PRIVACY_FILES, {
            link: privacyPolicy,
            title: title,
            isLoading: isPrivacyLoading,
          })
        },
      },
    ]
  })

  useWebSocket(refetch)

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [])
  )
  return (
    <ScreenWrapper isBackButton title={t("HelpCenter")} isCenterTitle>
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
        style={{ bottom: isIOS() ? moderateScale(10) : 0 }}
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
