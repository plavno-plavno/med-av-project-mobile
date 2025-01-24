import { Text, View } from "react-native"
import React from "react"
import Toast from "react-native-toast-message"
import { styles } from "./styles"
import { Icon } from "../Icon"

const toastConfig: any = {
  success: ({ text1 }: { text1: string }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastContent}>
        <Icon name="toastSuccess" />
        <Text style={styles.toastText}>{text1}</Text>
      </View>
      <Icon name="closeButton" onPress={() => Toast.hide()} />
    </View>
  ),
  error: ({ text1 }: { text1: string }) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <Icon name="toastError" />
      <Text style={styles.toastText}>{text1}</Text>
      <Icon name="closeButton" onPress={() => Toast.hide()} />
    </View>
  ),
}

const ToastMessage: React.FC = () => {
  return (
    <Toast
      config={toastConfig}
      autoHide={true}
      topOffset={60}
      visibilityTime={2000}
    />
  )
}

export default ToastMessage
