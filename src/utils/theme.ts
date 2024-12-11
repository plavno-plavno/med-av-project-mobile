import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { screenWidth } from './screenResponsive';
import fonts from '../assets/fonts';
// import colors from '../assets/colors';

export const fontFamilies = StyleSheet.create({
  interMonrope: {
    fontFamily: fonts.ManropeRegular,
    fontSize: moderateScale(8),
    lineHeight: moderateScale(14),
  },
  interManropeRegular10: {
    fontFamily: fonts.ManropeRegular,
    fontSize: moderateScale(10),
    lineHeight: moderateScale(16),
  },
  interManropeRegular12: {
    fontFamily: fonts.ManropeRegular,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
  },
  interManropeRegular14: {
    fontFamily: fonts.ManropeRegular,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  interManropeRegular16: {
    fontFamily: fonts.ManropeRegular,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
  },

  interManropeBold16: {
    fontFamily: fonts.ManropeBold,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
  },


  interManropeSemiBold12: {
    fontFamily: fonts.ManropeSemiBold,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
  },
  interManropeSemiBold14: {
    fontFamily: fonts.ManropeSemiBold,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  interManropeSemiBold16: {
    fontFamily: fonts.ManropeSemiBold,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
  },
  interManropeSemiBold18: {
    fontFamily: fonts.ManropeSemiBold,
    fontSize: moderateScale(18),
    lineHeight: moderateScale(24),
  },

  interManropeSemiBold32: {
    fontFamily: fonts.ManropeSemiBold,
    fontSize: moderateScale(32),
    lineHeight: moderateScale(38),
  },
});

export const fontWeights = StyleSheet.create({
  fontWeight400: {
    fontStyle: 'normal',
    fontWeight: '400',
  },
  fontWeight500: {
    fontStyle: 'normal',
    fontWeight: '500',
  },
  fontWeight600: {
    fontStyle: 'normal',
    fontWeight: '600',
  },
  fontWeight700: {
    fontStyle: 'normal',
    fontWeight: '700',
  },
});

export const helpers = StyleSheet.create({
  absoluteBottomLeft16: {
    position: 'absolute',
    bottom: 10,
    left: 16,
  },
  absoluteBottom: {
    position: 'absolute',
    bottom: 10,
  },
  hitSlop: {
    top: moderateScale(20),
    left: moderateScale(20),
    bottom: moderateScale(20),
    right: moderateScale(20),
  },
  mt48: {
    marginTop: moderateScale(48),
  },
  mt16: {
    marginTop: moderateScale(16),
  },
  mt10: {
    marginTop: moderateScale(10),
  },
  mt24: {
    marginTop: moderateScale(24),
  },
  mt32: {
    marginTop: moderateScale(32),
  },
  mb16: {
    marginBottom: moderateScale(16),
  },
  mb32: {
    marginBottom: moderateScale(32),
  },
  mb24: {
    marginBottom: moderateScale(24),
  },
  mb48: {
    marginBottom: moderateScale(48),
  },
  mb100: {
    marginBottom: moderateScale(100),
  },
  mb80: {
    marginBottom: moderateScale(80),
  },
  mh16: {
    marginHorizontal: moderateScale(16),
  },
  mh24: {
    marginHorizontal: moderateScale(24),
  },
  mv24: {
    marginVertical: moderateScale(24),
  },
  mv16: {
    marginVertical: moderateScale(16),
  },
  ml16: {
    marginLeft: moderateScale(16),
  },
  mr16: {
    marginRight: moderateScale(16),
  },
  mr4: {
    marginRight: moderateScale(4),
  },
  mt8: {
    marginTop: moderateScale(8),
  },
  mb8: {
    marginBottom: moderateScale(8),
  },
  mb10: {
    marginBottom: moderateScale(10),
  },
  mh8: {
    marginHorizontal: moderateScale(8),
  },
  mv8: {
    marginVertical: moderateScale(8),
  },
  ml0: {
    marginLeft: 0,
  },
  ml4: {
    marginLeft: moderateScale(4),
  },
  ml8: {
    marginLeft: moderateScale(8),
  },
  mr8: {
    marginRight: moderateScale(8),
  },
  mt6: {
    marginTop: moderateScale(6),
  },
  mt4: {
    marginTop: moderateScale(4),
  },
  mt2: {
    marginTop: moderateScale(2),
  },
  mb2: {
    marginBottom: moderateScale(2),
  },
  mb4: {
    marginBottom: moderateScale(4),
  },
  mb6: {
    marginBottom: moderateScale(6),
  },
  mh6: {
    marginHorizontal: moderateScale(6),
  },
  mh2: {
    marginHorizontal: moderateScale(2),
  },
  mv6: {
    marginVertical: moderateScale(6),
  },
  ml6: {
    marginLeft: moderateScale(6),
  },
  mr6: {
    marginRight: moderateScale(6),
  },
  mt20Percent: {
    marginTop: '20%',
  },
  mt25Percent: {
    marginTop: '25%',
  },
  mt50Percent: {
    marginTop: '50%',
  },
  mt40Percent: {
    marginTop: '40%',
  },
  pb0: {
    paddingBottom: 0,
  },
  pl0: {
    paddingLeft: 0,
  },
  pr0: {
    paddingRight: 0,
  },
  pr32: {
    paddingRight: moderateScale(32),
  },
  pr24: {
    paddingRight: moderateScale(24),
  },
  pt0: {
    paddingTop: 0,
  },
  pb16: {
    paddingBottom: moderateScale(16),
  },
  pb24: {
    paddingBottom: moderateScale(24),
  },
  pb32: {
    paddingBottom: moderateScale(32),
  },
  pb60: {
    paddingBottom: moderateScale(60),
  },
  pb80: {
    paddingBottom: moderateScale(80),
  },
  pb100: {
    paddingBottom: moderateScale(100),
  },
  ph0: {
    paddingHorizontal: 0,
  },
  ph8: {
    paddingHorizontal: moderateScale(8),
  },
  ph16: {
    paddingHorizontal: moderateScale(16),
  },
  ph14: {
    paddingHorizontal: moderateScale(14),
  },
  pv0: {
    paddingVertical: moderateScale(0),
  },
  pv8: {
    paddingVertical: moderateScale(8),
  },
  pv10: {
    paddingVertical: moderateScale(10),
  },
  pv16: {
    paddingVertical: moderateScale(16),
  },
  pt6: {
    paddingTop: moderateScale(6),
  },
  pt12: {
    paddingTop: moderateScale(12),
  },
  pt24: {
    paddingTop: moderateScale(24),
  },
  marginVerticalClear: {
    marginBottom: 0,
    marginTop: 0,
    marginVertical: 0,
  },
  flex1: {
    flex: 1,
  },
  flexShrink1: {
    flexShrink: 1,
  },
  flexGrow1: {
    flexGrow: 1,
  },
  flexGrow07: {
    flexGrow: 0.7,
  },
  flexGrow08: {
    flexGrow: 0.8,
  },
  flexGrow05: {
    flexGrow: 0.5,
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexRowCenterBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexRowStartBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flexRowEndBetween: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  flexRowCenterEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  justifyContentEnd: {
    justifyContent: 'flex-end',
  },
  justifyContentCenter: {
    justifyContent: 'center',
  },
  alignItemsEnd: {
    alignItems: 'flex-end',
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  justifyContentSpaceAround: {
    justifyContent: 'space-around',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  height20: {
    height: moderateScale(20),
  },
  height48: {
    height: moderateScale(48),
  },
  height42: {
    height: moderateScale(42),
  },
  height56: {
    height: moderateScale(56),
  },
  minHeight40: {
    minHeight: moderateScale(40),
  },
  minHeight32: {
    minHeight: moderateScale(32),
  },
  minHeight36: {
    minHeight: moderateScale(36),
  },
  height100Percent: {
    height: '100%',
  },
  heightAuto: {
    height: 'auto',
  },
  maxHeightAuto: {
    maxHeight: 'auto',
  },
  maxHeight100Percent: {
    maxHeight: '100%',
  },
  width100Percent: {
    width: '100%',
  },
  width30Percent: {
    width: '30%',
  },
  width35Percent: {
    width: '35%',
  },
  width40Percent: {
    width: '40%',
  },
  width45Percent: {
    width: '45%',
  },
  width50Percent: {
    width: '50%',
  },
  width55Percent: {
    width: '55%',
  },
  width60Percent: {
    width: '60%',
  },
  width65Percent: {
    width: '65%',
  },
  width70Percent: {
    width: '70%',
  },
  width80Percent: {
    width: '80%',
  },
  width85Percent: {
    width: '85%',
  },
  width90Percent: {
    width: '90%',
  },
  width95Percent: {
    width: '95%',
  },
  widthFullScreenWithPadding: {
    width: screenWidth - moderateScale(32),
  },
  opacity03: { opacity: 0.3 },
  opacity05: { opacity: 0.5 },
  minWidth40: {
    minWidth: moderateScale(40),
  },
  maxWidth40: {
    maxWidth: moderateScale(40),
  },
  maxWidth90Percent: {
    maxWidth: '90%',
  },
  maxWidth85Percent: {
    maxWidth: '85%',
  },
  maxWidth80Percent: {
    maxWidth: '80%',
  },
  maxWidth75Percent: {
    maxWidth: '75%',
  },
  maxWidth70Percent: {
    maxWidth: '70%',
  },
  maxWidth65Percent: {
    maxWidth: '65%',
  },
  maxWidth60Percent: {
    maxWidth: '60%',
  },
  maxWidth55Percent: {
    maxWidth: '55%',
  },
  maxWidth50Percent: {
    maxWidth: '50%',
  },
  maxWidth45Percent: {
    maxWidth: '45%',
  },
  maxWidth40Percent: {
    maxWidth: '40%',
  },
  maxWidth35Percent: {
    maxWidth: '35%',
  },
  maxWidth30Percent: {
    maxWidth: '30%',
  },
  maxWidth25Percent: {
    maxWidth: '25%',
  },
  maxWidth20Percent: {
    maxWidth: '20%',
  },
  textAlignCenter: {
    textAlign: 'center',
  },
  alignSelfCenter: {
    alignSelf: 'center',
  },
  alignSelfEnd: {
    alignSelf: 'flex-end',
  },
  textAlignRight: {
    textAlign: 'right',
  },
  // shadow2S: {
  //   shadowColor: colors.warmGrey900,
  //   shadowOffset: {
  //     width: 0,
  //     height: 1,
  //   },
  //   shadowOpacity: 0.06,
  //   shadowRadius: 2,
  //   elevation: 2,
  // },
  // shadow4S: {
  //   shadowColor: colors.warmGrey900,
  //   shadowOffset: {
  //     width: 0,
  //     height: 4,
  //   },
  //   shadowOpacity: 0.03,
  //   shadowRadius: 6,
  //   elevation: 4,
  // },
  gap8: {
    gap: moderateScale(8),
  },
  gap16: {
    gap: moderateScale(16),
  },
  gap24: {
    gap: moderateScale(24),
  },
});
