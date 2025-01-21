import { StyleSheet, Text, View } from "react-native"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import colors from "src/assets/colors"

const Title = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <View style={[helpers.gap8]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

export default Title

export const styles = StyleSheet.create({
  title: {
    ...fontFamilies.interManropeSemiBold32,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  subtitle: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
})
