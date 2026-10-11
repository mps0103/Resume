package com.mps.resumebuilder

import android.app.Application
import com.facebook.react.PackageList
import cl.json.ShareApplication
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication, ShareApplication {

  /**
   * react-native-share resolves a file path to a content:// URI by trying
   * this authority first, then its own. Its own provider only covers
   * Download/ and the cache directory; exported PDFs live in
   * getExternalFilesDir(null)/Documents, so without this the share sheet
   * fails with an IllegalArgumentException.
   */
  override fun getFileProviderAuthority(): String = "$packageName.fileprovider"


  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Autolinking finds the library packages. These two are local to
          // this app, so they have to be added by hand — without these lines
          // the modules never reach JS: every tamper check silently returns
          // "unverified", the splash sits until its timeout, and backup
          // export and import fail.
          add(AppIntegrityPackage())
          add(AppSupportPackage())
        },
      // Never load JS from Metro, not even in a debug build.
      //
      // useDevSupport defaults to BuildConfig.DEBUG, which makes a debug APK
      // prefer whatever answers on port 8081 over its own packaged bundle.
      // That is the wrong default here: this app sets debuggableVariants = []
      // precisely so the debug APK embeds its bundle and runs standalone on a
      // phone with no laptop attached.
      //
      // It is also actively dangerous on a machine with more than one React
      // Native project. Port 8081 and the adb reverse tunnel are shared by
      // every app on the device, so a Metro left running for a DIFFERENT app
      // will happily serve that app's bundle to this one. The result is not a
      // subtle bug: the bundle asks for native modules this binary does not
      // contain and the runtime dies on startup with "PlatformConstants could
      // not be found", which reads as this app being broken.
      //
      // Nothing of value is lost. The bundle is built with --dev=false, so
      // there is no red box and no fast refresh to give up.
      useDevSupport = false,
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
