import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { TouchableOpacity, View, Text, StyleSheet } from "react-native"
import { Icon } from "../Icon"
import colors from "src/assets/colors"

interface ISettingsButton {
  label: string
  info?: string
  isDeleteBtn?: boolean
  onPress?: () => void
}

const SettingsButton = ({
  label,
  info,
  isDeleteBtn,
  onPress,
}: ISettingsButton) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={[helpers.flexRow, helpers.gap8]}>
        {isDeleteBtn && <Icon name={"deleteAccount"} />}
        <View style={[helpers.flexColumn, helpers.gap4]}>
          <Text
            style={[
              styles.label,
              { color: isDeleteBtn ? colors.alertRed : colors.charcoal },
            ]}
          >
            {label}
          </Text>
          {info && <Text style={[styles.info]}>{info}</Text>}
        </View>
      </View>
      <Icon name={isDeleteBtn ? "chevronRightRed" : "chevronRight"} />
    </TouchableOpacity>
  )
}

export default SettingsButton

export const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    alignItems: "center",
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
  },
  info: {
    alignItems: "center",
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.steelGray,
  },
})
