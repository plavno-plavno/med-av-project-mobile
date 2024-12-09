import React from 'react';
import {Trans} from 'react-i18next';
import {Linking, Text, View} from 'react-native';
import {styles} from './styles';

const TermsAndConditions = () => {
  return (
    <View>
      <Text style={styles.text}>
        <Trans
          i18nKey="TermsAndConditions"
          components={{
            termsOfUse: (
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://google.com')}
              />
            ),
            privacyPolicy: (
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://google.com')}
              />
            ),
          }}
        />
      </Text>
    </View>
  );
};

export default TermsAndConditions;
