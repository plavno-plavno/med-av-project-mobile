import { fontFamilies, fontWeights } from "@utils/theme";
import { StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import colors from "src/assets/colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: moderateScale(70),
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(24),
        backgroundColor: colors.white,
        alignItems: 'center',
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
        gap: moderateScale(24),
        paddingBottom: moderateScale(32),
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