import { fontFamilies, fontWeights } from "@utils/theme";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import colors from "src/assets/colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: moderateScale(20),
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...fontFamilies.interManropeSemiBold32,
        ...fontWeights.fontWeight500,
        color: colors.charcoal,
    },
    subtitle: {
        ...fontFamilies.interManropeRegular16,
        ...fontWeights.fontWeight400,
        color: colors.midGrey,
        textAlign: 'center',
    },
    refreshButton:{
        position: "absolute",
        bottom: moderateScale(36),
        left: moderateScale(24),
        right: moderateScale(24)
    }
})