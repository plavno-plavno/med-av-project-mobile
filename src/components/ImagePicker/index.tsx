import { Modal, StyleSheet, View, TouchableOpacity, FlatList, Text } from 'react-native';
import React, { ReactNode } from 'react';
import colors from '../../assets/colors';
import { useTranslation } from 'react-i18next';
import { isAndroid, isIOS } from '../../utils/platformChecker';
import { moderateScale } from 'react-native-size-matters';
import { requestCameraPermission } from '@utils/androidPermissions';
import Toast from 'react-native-toast-message';
import { fontFamilies, fontWeights, helpers } from '@utils/theme';
import { Icon } from '../Icon';
import ImagePicker from 'react-native-image-crop-picker';

interface Props {
  isModalVisible: boolean;
  setIsModalVisible: () => void;
  handleImagePicker: (arg0: any) => void;
}

const ImagesPicker: React.FC<Props> = ({
  isModalVisible,
  setIsModalVisible,
  handleImagePicker,
}) => {
  const { t } = useTranslation();

  const openCamera = async () => {
    try{
    if (isAndroid()) {
      const result = await requestCameraPermission();
      if (!result) {
        Toast.show({ type: 'error', text1: 'Permission not given' })
        setIsModalVisible();
        return;
      }
    }

    ImagePicker.openCamera({
      mediaType: 'photo',
      width: 300,
      height: 400,
      cropping: true,
      includeBase64: true,
      cropperCircleOverlay: true,
    }).then(image => {
      handleImagePicker(image);
      setIsModalVisible();
    });

  } catch (error) {
    console.log(error, 'error openCamera');
  }
  };

  const openLibrary = async () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      width: 300,
      height: 400,
      cropping: true,
      includeBase64: true,
      cropperCircleOverlay: true,

    }).then(image => {
      console.log(image);
          if (image) {
      handleImagePicker(image);
      setIsModalVisible();
    }
    });
  };

  const buttons = [
      {
        id: 1,
        icon: <Icon name={'makeAPhoto'} />,
        text: t('TakeAPhoto'),
        onPress: openCamera,
      },
      {
        id: 2,
        icon: <Icon name={'uploadPhoto'} />,
        text: t('UploadANewPhoto'),
        onPress: openLibrary,
      },
    ]

  const renderButtons = ({ item }: { item: { icon: ReactNode; text: string; onPress: () => void; id: number } }) => (
    <TouchableOpacity style={styles.buttonContainer} onPress={item.onPress}>
      <View style={[helpers.flexRowCenter, helpers.gap12]}>
        <View style={styles.iconContainer}>{item.icon}</View>
        <Text style={[styles.buttonText]}>{item.text}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      statusBarTranslucent
      animationType="fade"
      onRequestClose={() => {
        setIsModalVisible();
      }}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          setIsModalVisible();
        }}>
        <TouchableOpacity style={styles.modalView} disabled>
          <View style={styles.modalViewWrapper}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("Upload")}</Text>
              <Icon name={"closeButton"} onPress={() => setIsModalVisible()} />
            </View>
            <FlatList
              data={buttons}
              renderItem={renderButtons}
              contentContainerStyle={styles.buttonsContentContainer}
              keyExtractor={(item) => String(item.id)}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ImagesPicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.blackOpacity06,
  },
  modalView: {
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
  },
  header: {
    width: '100%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    justifyContent: 'space-between',
  },
  buttonText: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
  },
  iconContainer: {
    borderRadius: moderateScale(100),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    backgroundColor: colors.cadetGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalViewWrapper: {
    width: '100%',
    borderRadius: moderateScale(24),
    overflow: 'hidden',
  },
  buttonsContentContainer: {
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.white,
    paddingTop: moderateScale(18),
    paddingBottom: isIOS() ? moderateScale(20) : moderateScale(10),
  },
  headerContainerStyle: {
    backgroundColor: colors.white,
  },
});
