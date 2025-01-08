import { BottomSheetMethods } from "@devvie/bottom-sheet"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { StyleSheet, Text, View } from "react-native"
import { User } from "src/api/userApi/types"
import colors from "src/assets/colors"
import { Icon } from "../Icon"

interface IModalHeader {
  title: string
  participants?: User[]
  sheetRef: React.RefObject<BottomSheetMethods>
}

const ModalHeader = ({ title, participants, sheetRef }: IModalHeader) => {
  return (
    <View style={[helpers.flexRowBetween, helpers.alignItemsCenter]}>
      <Text style={styles.title}>
        {title} {participants && `(${participants.length})`}
      </Text>
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
})
