import { fontFamilies, fontWeights } from "@utils/theme";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import colors from "src/assets/colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingRight: 0, 
        paddingBottom: 0 
    },
    hourStyle: {
        ...fontFamilies.interManropeSemiBold12,
        ...fontWeights.fontWeight500,
        color: colors.cadetGrey
    },
    cellStyle: {
        backgroundColor: colors.brandColor,
        borderRadius: moderateScale(6),
        maxWidth: '95%',
    },
    cellTextColor: {
        color: colors.alertRed
    }
});