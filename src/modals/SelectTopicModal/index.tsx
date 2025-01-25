import BottomSheet from "@devvie/bottom-sheet"
import { screenHeight } from "@utils/screenResponsive"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"
import colors from "src/assets/colors"
import { CustomButton } from "@components"
import { moderateScale } from "react-native-size-matters"
import ModalHeader from "src/components/ModalHeader"
import { useGetTopicsQuery } from "src/api/helpCenterApi/helpCenterApi"
import TopicItem from "src/components/TopicItem"
import { HelpTopicEntity } from "src/api/helpCenterApi/types"
import { useState } from "react"

const SelectTopicModal = ({ sheetRef, formikRef, setTopicId }: any) => {
  const { t } = useTranslation()

  const [selectedTopic, setSelectedTopic] = useState<HelpTopicEntity | null>(
    null
  )

  const { data: topics } = useGetTopicsQuery({
    limit: 10,
    page: 1,
  })

  const topicsList = topics?.data.map((topic) => ({
    ...topic,
    isSelected: selectedTopic?.id === topic.id,
    onPress: () => {
      setSelectedTopic(topic)
    },
  }))

  const onModalClose = () => {
    formikRef.current?.setFieldValue("topic", selectedTopic?.name || "")
    setTopicId(selectedTopic?.id || null)
    sheetRef?.current?.close()
  }

  return (
    <BottomSheet
      ref={sheetRef}
      height={screenHeight * 0.9}
      backdropMaskColor={colors.blackOpacity08}
      style={styles.bottomSheet}
      disableBodyPanning
      disableKeyboardHandling
    >
      <View style={styles.container}>
        <ModalHeader title={t("SelectTopic")} sheetRef={sheetRef} />
        <FlatList
          contentContainerStyle={{ gap: 1 }}
          data={topicsList}
          renderItem={({ item }) => <TopicItem topic={item} />}
        />
        <CustomButton
          type="primary"
          text={t("Select")}
          onPress={onModalClose}
          style={styles.button}
        />
      </View>
    </BottomSheet>
  )
}

export default SelectTopicModal

export const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: colors.white,
  },
  container: {
    height: screenHeight * 0.82,
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    backgroundColor: colors.white,
    gap: moderateScale(24),
  },
  button: {
    width: "100%",
  },
})
