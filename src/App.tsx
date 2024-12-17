import React from "react"
import { Provider } from "react-redux"
import store from "./redux/store"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Navigation from "./navigation"
import "./i18n/i18next"
import ToastMessage from "./components/ToastMessages"
import NoConnectionModal from "./modals/NoConnectionModal"

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <Navigation />
        <ToastMessage />
        <NoConnectionModal />
      </Provider>
    </SafeAreaProvider>
  )
}

export default App
