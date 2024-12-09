import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import colors from '../../../../assets/colors';
import { fontFamilies, fontWeights } from '../../../../utils/theme';

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(20),
        borderTopLeftRadius: moderateScale(32),
        borderTopRightRadius: moderateScale(32),
        backgroundColor: colors.white,
        gap: moderateScale(16),
    },
    content: {
        gap: moderateScale(24),
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
    },
});
