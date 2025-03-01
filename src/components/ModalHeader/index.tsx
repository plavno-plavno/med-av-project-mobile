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
  isBackButton?: boolean
  onClose: () => void
  handleBackButtonPress?: () => void
}

const ModalHeader = ({
  title,
  participants,
  isBackButton,
  handleBackButtonPress,
  onClose,
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
            <Icon name={"backArrowGray"} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {title} {participants && `(${participants.length})`}
        </Text>
      </View>

      <Icon name="closeButton" onPress={onClose} />
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
