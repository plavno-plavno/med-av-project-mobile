import { View, Text, Modal, StatusBar } from "react-native"
import { styles } from "./styles"
import { useTranslation } from "react-i18next"

import { helpers } from "@utils/theme"
import NetInfo, { useNetInfoInstance } from "@react-native-community/netinfo"
import { useEffect, useState } from "react"
import { Icon, CustomButton } from "@components"

NetInfo.configure({
  reachabilityLongTimeout: 30 * 1000, // How often to check when app is in foreground
  reachabilityRequestTimeout: 1 * 1000, // How long to wait for each check
})

const NoConnectionModal = () => {
  const { t } = useTranslation()
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    netInfo: { isConnected },
    refresh,
  } = useNetInfoInstance()

  useEffect(() => {
    if (isConnected !== null) {
      setIsModalVisible(!isConnected);
    }
  }, [isConnected])

  const onRefreshPress = async () => {
    try {
      setIsLoading(true);
      await refresh();
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.log(error, 'error onRefreshPress');

    }
  }

  return (
    <Modal transparent={true} animationType="slide" visible={isModalVisible}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <Icon name={"noConnection"} style={[helpers.mb16]} />
        <Text style={[helpers.mb8, styles.title]}>
          {t("OopsYouAreOffline")}
        </Text>
        <Text style={styles.subtitle}>
          {t("YourInternetConnectionIsNotWorking")}
        </Text>
      </View>

      <CustomButton
        style={styles.refreshButton}
        type="primary"
        text={t("Refresh")}
        onPress={onRefreshPress}
        rightIcon="refresh"
        isLoading={isLoading}
      />
    </Modal>
  )
}

export default NoConnectionModal
