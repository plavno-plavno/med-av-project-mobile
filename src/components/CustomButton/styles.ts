import { StyleSheet } from 'react-native';
import colors from '../../assets/colors';
import { fontFamilies, fontWeights } from '../../utils/theme';
import { moderateScale } from 'react-native-size-matters';

export const styles = StyleSheet.create({
    button_primary: {
        backgroundColor: colors.charcoal,
        borderRadius: moderateScale(16),
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(18),
    },

    button_primary_text: {
        ...fontFamilies.interManropeSemiBold16,
        ...fontWeights.fontWeight600,
        color: colors.white,
    },

    button_secondary: {
        backgroundColor: colors.aquaHaze,
    },

    button_secondary_text: {
        color: colors.charcoal,
    },
    disabled: {
        opacity: 0.5,
    }
});
