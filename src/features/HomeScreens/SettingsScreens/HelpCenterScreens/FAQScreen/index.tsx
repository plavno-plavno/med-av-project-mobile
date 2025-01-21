import { isIOS } from "@utils/platformChecker"
import { fontWeights, fontFamilies, helpers } from "@utils/theme"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import NavigationItem from "src/components/NavigationItem"
import ScreenWrapper from "src/components/ScreenWrapper"

const FAQScreen = () => {
  const { t } = useTranslation()

  const [questions, setQuestions] = useState([
    {
      leftIcon: "faq" as IconName,
      rightIcon: "plusButton" as IconName,
      title: "What is the AI in your software?",
      description:
        "The AI in Medical employs deep learning techniques, including advanced speech recognition and natural language processing algorithms. These algorithms enable Medical to understand and accurately transcribe medical dictations. The AI continuously learns and improves its performance as healthcare professionals use the platform.",
      onPress: () => {},
      isExpanded: false,
    },
  ])

  return (
    <ScreenWrapper
      isBackButton
      title={t("FAQ")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      <View style={[helpers.flex1, helpers.gap20]}>
        <Text style={styles.title}>{t("PersonalQuestions")}</Text>
        {/* //TODO: Connect API */}
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
