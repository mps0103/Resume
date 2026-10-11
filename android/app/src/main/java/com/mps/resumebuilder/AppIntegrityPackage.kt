package com.mps.resumebuilder

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Registers AppIntegrityModule with React Native. Without this the module is
 * compiled but never reaches JS, NativeModules.AppIntegrity is undefined, and
 * every integrity check silently returns 'unverified'. Add it to the package
 * list in MainApplication.
 */
class AppIntegrityPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(AppIntegrityModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
