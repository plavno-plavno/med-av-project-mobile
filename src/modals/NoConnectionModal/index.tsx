import { View, Text, Modal, StatusBar } from "react-native"
import { styles } from "./styles"
import { Icon } from "../Icon"
import { useTranslation } from "react-i18next"
import { CustomButton } from "../CustomButton"
import { helpers } from "@utils/theme"
import NetInfo, { useNetInfoInstance } from "@react-native-community/netinfo"
import { useEffect, useState } from "react"

NetInfo.configure({
  reachabilityLongTimeout: 30 * 1000, // How often to check when app is in foreground
  reachabilityRequestTimeout: 1 * 1000, // How long to wait for each check
})

const NoConnectionScreen = () => {
  const { t } = useTranslation()
  const [isModalVisible, setIsModalVisible] = useState(false)

  const {
    netInfo: { isConnected },
    refresh,
  } = useNetInfoInstance()

  useEffect(() => {
    if (isConnected !== null) {
      setIsModalVisible(!isConnected)
    }
  }, [isConnected])

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
        onPress={refresh}
        rightIcon="refresh"
      />
    </Modal>
  )
}

export default NoConnectionScreen