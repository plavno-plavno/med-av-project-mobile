import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { WebView } from "react-native-webview"
import { RouteProp, useRoute } from "@react-navigation/native"
import { ActivityIndicator } from "react-native"
import { moderateScale } from "react-native-size-matters"

const PrivacyPolicyScreen = () => {
  const route = useRoute<
    RouteProp<{
      PrivacyParams: { link: string; title: string }
    }>
  >()
  const { link, title } = route.params

  return (
    <ScreenWrapper
      title={title}
      isCenterTitle
      isBackButton
      childrenStyle={{
        paddingHorizontal: 2,
        paddingTop: 10,
        overflow: "hidden",
      }}
    >
      <WebView
        source={{ uri: link }}
        showsVerticalScrollIndicator={false}
        startInLoadingState={true}
        renderLoading={() => {
          return (
            <ActivityIndicator
              size={"large"}
              style={{ top: moderateScale(-300) }}
            />
          )
        }}
      />
    </ScreenWrapper>
  )
}

export default PrivacyPolicyScreen
