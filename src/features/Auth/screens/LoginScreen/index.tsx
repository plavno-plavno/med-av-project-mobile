import { Text, View } from 'react-native';
import React, { useState } from 'react';
import ScreenWrapper from 'src/components/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useEmailLoginMutation } from 'src/api/auth/authApi';
import { CustomButton } from '@components';

const LoginScreen = () => {
  const { t } = useTranslation()

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailLogin, { isLoading: isEmailLoginLoading }] = useEmailLoginMutation();

  const onPress = async () => {
    try {
      const res = await emailLogin({ email, password }).unwrap();
      console.log(res, 'res login');
    } catch (error) {
      console.log(error, 'error login');
    }
  }
  return (
    <ScreenWrapper isBackButton>

      <CustomButton
        type="primary"
        text={t('LogIn')}
        onPress={onPress}
        isLoading={isEmailLoginLoading}
      />
    </ScreenWrapper>
  );
};

export default LoginScreen;
