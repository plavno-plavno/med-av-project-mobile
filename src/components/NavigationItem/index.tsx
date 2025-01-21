import { StyleSheet, Text, TouchableOpacity } from "react-native"

import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { View } from "react-native"
import { Icon } from "@components"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

interface INavigationItem {
  title: string
  leftIcon: IconName
  rightIcon: IconName
  onPress: () => void
  description?: string
  isExpanded?: boolean
}

const NavigationItem = ({
  title,
  leftIcon,
  rightIcon,
  onPress,
  description,
  isExpanded,
}: INavigationItem) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.itemContainer}>
      <View style={styles.menuItem}>
        <View style={[helpers.flexRow, helpers.gap8]}>
          <Icon name={leftIcon} />
          <Text style={styles.menuTitle}>{title}</Text>
        </View>
        <Icon name={rightIcon} />
      </View>
      {isExpanded && <Text style={styles.menuDescription}>{description}</Text>}
    </TouchableOpacity>
  )
}

export default NavigationItem

export const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: colors.aquaHaze,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    gap: moderateScale(8),
  },
  menuItem: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  menuTitle: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  menuDescription: {
    paddingHorizontal: moderateScale(32),
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
})
