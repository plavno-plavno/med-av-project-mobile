import { BottomSheetMethods } from "@devvie/bottom-sheet"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { User } from "src/api/userApi/types"
import colors from "src/assets/colors"
import { Icon } from "../Icon"
import { useTranslation } from "react-i18next"

interface IModalHeader {
  title: string
  participants?: User[]
  sheetRef: React.RefObject<BottomSheetMethods>
  isBackButton?: boolean
  handleBackButtonPress?: () => void
}

const ModalHeader = ({
  title,
  participants,
  sheetRef,
  isBackButton,
  handleBackButtonPress,
}: IModalHeader) => {
  const { t } = useTranslation()
  return (
    <View style={[helpers.flexRowBetween, helpers.alignItemsCenter]}>
      <View style={[helpers.flexRow, helpers.gap4]}>
        {isBackButton && (
          <TouchableOpacity
            onPress={handleBackButtonPress}
            style={styles.container}
          >
            <Icon name={"backArrow"} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {title} {participants && `(${participants.length})`}
        </Text>
      </View>

      <Icon name="closeButton" onPress={() => sheetRef.current?.close()} />
    </View>
  )
}

export default ModalHeader

const styles = StyleSheet.create({
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
})
