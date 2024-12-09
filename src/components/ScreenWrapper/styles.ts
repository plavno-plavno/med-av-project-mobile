import { StyleSheet } from 'react-native';
import colors from '../../assets/colors';
import { moderateScale } from 'react-native-size-matters';
import { fontFamilies } from '../../utils/theme';

export const styles = StyleSheet.create({
    container: {

    },
    navigation_container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(11),
        paddingHorizontal: moderateScale(16),
    },
    title: {
        ...fontFamilies.interManropeSemiBold18,
        color: colors.white,
    },
    empty_view: {
        width: moderateScale(69),
    },
    onboarding_container: {
        height: '40%',
        backgroundColor: colors.pearlAqua,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
