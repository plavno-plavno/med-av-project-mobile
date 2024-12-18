import { fontFamilies, fontWeights } from "@utils/theme";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import colors from "src/assets/colors";

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: moderateScale(20),
        backgroundColor: colors.white,
        alignItems: 'center',
        gap: moderateScale(24),
    },
    bottomSheet: {
        backgroundColor: colors.white,
        paddingBottom: moderateScale(265)
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.blackOpacity06
    },
    header: {
        justifyContent: 'space-between',
        gap: moderateScale(8),
    },
    titleContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        ...fontFamilies.interManropeSemiBold24,
        ...fontWeights.fontWeight500,
        color: colors.charcoal,
    },
    subtitle: {
        ...fontFamilies.interManropeRegular16,
        ...fontWeights.fontWeight400,
        color: colors.midGrey,
    },
    formContainer: {
        width: '100%',
        gap: moderateScale(16),
    }
})