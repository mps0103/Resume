package com.mps.resumebuilder

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Registers the app's own non-integrity native modules. Kept separate from
 * AppIntegrityPackage so the anti-tamper surface stays one file with one
 * reason to change.
 *
 * Like AppIntegrityPackage, this has to be added to the package list in
 * MainApplication or the modules compile but never reach JS.
 */
class AppSupportPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> =
        listOf(
            SplashScreenModule(reactContext),
            BackupModule(reactContext),
            DownloadsModule(reactContext),
            BuildInfoModule(reactContext),
        )

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
