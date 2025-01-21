import BottomSheet from "@devvie/bottom-sheet"
import { screenHeight } from "@utils/screenResponsive"
import { helpers } from "@utils/theme"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import colors from "src/assets/colors"
import { CustomButton } from "@components"
import { moderateScale } from "react-native-size-matters"
import ModalHeader from "src/components/ModalHeader"

const SelectTopicModal = ({ onClose, sheetRef }: any) => {
  const { t } = useTranslation()

  const onModalClose = () => {
    onClose()
  }

  return (
    <>
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
          <View>Content</View>
          <CustomButton
            type="primary"
            text={t("Select")}
            onPress={() => {}}
            style={styles.button}
          />
        </View>
      </BottomSheet>
    </>
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
