import React from "react"
import { Provider } from "react-redux"
import store from "./redux/store"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Navigation from "./navigation"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { helpers } from "./utils/theme"
import "./i18n/i18next"
import ToastMessage from "./components/ToastMessages"

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <GestureHandlerRootView style={helpers.flex1}>
          <Navigation />
          <ToastMessage />
        </GestureHandlerRootView>
      </Provider>
    </SafeAreaProvider>
  )
}

export default App
