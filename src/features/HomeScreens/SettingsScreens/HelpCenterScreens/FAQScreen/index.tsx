import { isIOS } from "@utils/platformChecker"
import { fontWeights, fontFamilies, helpers } from "@utils/theme"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { useGetFaqQuestionsQuery } from "src/api/helpCenterApi/helpCenterApi"
import colors from "src/assets/colors"
import NavigationItem from "src/components/NavigationItem"
import ScreenWrapper from "src/components/ScreenWrapper"

const FAQScreen = () => {
  const { t } = useTranslation()
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null
  )

  const { data: faqQuestions } = useGetFaqQuestionsQuery({
    limit: 10,
    page: 1,
  })

  const questions = faqQuestions?.data.map((item) => ({
    id: item.id,
    leftIcon: "faq" as IconName,
    rightIcon:
      expandedQuestionId === item.id
        ? ("minusButton" as IconName)
        : ("plusButton" as IconName),
    title: item.question,
    description: item.answer,
    onPress: () => {
      setExpandedQuestionId((prevId) => (prevId === item.id ? null : item.id))
    },
    isExpanded: expandedQuestionId === item.id,
  }))

  return (
    <ScreenWrapper
      isBackButton
      title={t("FAQ")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      <View style={[helpers.flex1, helpers.gap20]}>
        <Text style={styles.title}>{t("PersonalQuestions")}</Text>
        <FlatList
          data={questions}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => <NavigationItem {...item} />}
        />
      </View>
    </ScreenWrapper>
  )
}

export default FAQScreen

export const styles = StyleSheet.create({
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
})
