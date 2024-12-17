import { StyleSheet, TouchableOpacity, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { Icon } from "../Icon"
import React from "react"

const ColorPicker = ({ onChange }: { onChange: (value: string) => void }) => {
  const [colorsArr, setColorsArr] = React.useState([
    {
      color: colors.lightAqua,
      checked: false,
    },
    {
      color: colors.defaultBlue,
      checked: false,
    },
    {
      color: colors.violet,
      checked: false,
    },
    {
      color: colors.rose,
      checked: false,
    },
    {
      color: colors.alertRed,
      checked: false,
    },
    {
      color: colors.alertWarning,
      checked: false,
    },
    {
      color: colors.successGreen,
      checked: false,
    },
  ])
  return (
    <View style={styles.container}>
      {colorsArr.map((item) => (
        <TouchableOpacity
          key={item.color}
          style={styles.colorContainer}
          onPress={() => {
            setColorsArr((prevColors) =>
              prevColors.map((color) => ({
                ...color,
                checked: color.color === item.color ? !color.checked : false,
              }))
            )
            onChange(item.color)
          }}
        >
          <View
            style={[
              styles.color,
              {
                backgroundColor: item.color,
              },
            ]}
          >
            {item.checked && <Icon name="check" />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default ColorPicker

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  colorContainer: {
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.borderGrey,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(6),
  },
  color: {
    alignItems: "center",
    justifyContent: "center",
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(4),
  },
})
