import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Linking, Text, View } from "react-native"
import { styles } from "./styles"
import { usePrivacyFilesQuery } from "src/api/mediaApi/mediaApi"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { privacyPolicy } from "@utils/mockData"

const TermsAndConditions = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  const { data: privacyFiles, isLoading: isPrivacyLoading } =
    usePrivacyFilesQuery()

  const termsOfUseLink = privacyFiles?.find(
    (file: any) => file.tag === "terms"
  )?.link
  const privacyPolicyLink = privacyFiles?.find(
    (file: any) => file.tag === "privacy"
  )?.link

  return (
    <View>
      <Text style={styles.text}>
        <Trans
          i18nKey="TermsAndConditions"
          components={{
            termsOfUse: (
              <Text
                style={styles.link}
                onPress={() =>
                  navigation.navigate(ScreensEnum.PRIVACY_FILES, {
                    link: termsOfUseLink,
                    title: t("Terms of Use"),
                    isLoading: isPrivacyLoading,
                  })
                }
              />
            ),
            privacyPolicy: (
              <Text
                style={styles.link}
                onPress={() =>
                  navigation.navigate(ScreensEnum.PRIVACY_FILES, {
                    link: privacyPolicy,
                    title: t("Privacy Policy"),
                    isLoading: isPrivacyLoading,
                  })
                }
              />
            ),
          }}
        />
      </Text>
    </View>
  )
}

export default TermsAndConditions
