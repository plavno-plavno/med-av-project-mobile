import React from "react"
import { Provider } from "react-redux"
import store from "./redux/store"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Navigation from "./navigation"
import "./i18n/i18next"
import ToastMessage from "./components/ToastMessages"
import NoConnectionScreen from "./components/NoConnectionModal"

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <Navigation />
        <ToastMessage />
        <NoConnectionScreen />
      </Provider>
    </SafeAreaProvider>
  )
}

export default App
