import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {Icon} from '../Icon';
import {styles} from './styles';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';

const BackButton = () => {
  const {t} = useTranslation();
  const {goBack} = useNavigation();

  return (
    <TouchableOpacity onPress={() => goBack()} style={styles.container}>
      <Icon name={'backArrow'} />
      <Text style={styles.text}>{t('Back')}</Text>
    </TouchableOpacity>
  );
};

export default BackButton;
