import React from "react"
import { Provider } from "react-redux"
import store from "./redux/store"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Navigation from "./navigation"
import "./i18n/i18next"
import ToastMessage from "./components/ToastMessages"
import NoConnectionModal from "./modals/NoConnectionModal"
import { Host } from "react-native-portalize"
import { LogBox } from "react-native"

LogBox.ignoreAllLogs();

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <Host>
          <Navigation />
        </Host>
        <ToastMessage />
        <NoConnectionModal />
      </Provider>
    </SafeAreaProvider>
  )
}

export default App
