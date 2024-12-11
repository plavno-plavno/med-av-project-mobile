import { View, Text, Modal, StatusBar } from "react-native"
import { styles } from "./styles"
import { Icon } from "../Icon"
import { useTranslation } from "react-i18next"
import { CustomButton } from "../CustomButton"
import { helpers } from "@utils/theme"

const NoConnectionScreen = () => {
  const { t } = useTranslation()
  return (
    <Modal transparent={true} animationType="slide" visible={true}>
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
        onPress={() => {}}
        rightIcon="refresh"
      />
    </Modal>
  )
}

export default NoConnectionScreen
