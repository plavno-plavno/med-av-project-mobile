package com.MedAV

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen;
import android.content.Intent
import android.net.Uri
import com.oney.WebRTCModule.WebRTCModuleOptions
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactInstanceManager

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "MedAV"

  override fun onCreate(savedInstanceState: Bundle?) {
      SplashScreen.show(this)
        // Initialize the WebRTC module options.
      val options = WebRTCModuleOptions.getInstance()
      options.enableMediaProjectionService = true
      super.onCreate(savedInstanceState)
      // ATTENTION: This was auto-generated to handle app links.
      val appLinkIntent: Intent = intent
      val appLinkAction: String? = appLinkIntent.action
      val appLinkData: Uri? = appLinkIntent.data
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
      super.onActivityResult(requestCode, resultCode, data)
      val reactInstanceManager = reactNativeHost.reactInstanceManager
      val currentReactContext = reactInstanceManager.currentReactContext

      if (currentReactContext != null) {
          val screenRecorderModule = currentReactContext
              .getNativeModule(ScreenRecorderModule::class.java)
          screenRecorderModule?.onActivityResult(this, requestCode, resultCode, data)
      }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
