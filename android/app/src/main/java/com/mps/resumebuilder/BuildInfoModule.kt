package com.mps.resumebuilder

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Exposes whether this is a debug build.
 *
 * JS cannot answer this reliably on its own: __DEV__ tracks how the bundle
 * was built, not how the APK was signed, and this project bundles the JS into
 * the debug APK so that it runs without Metro — which makes __DEV__ false in
 * a build that is still very much a debug build.
 *
 * BuildConfig.DEBUG comes from the build type itself, so anything gated on it
 * is compiled out of a release APK rather than merely hidden in it.
 */
class BuildInfoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppBuildInfo"

    override fun getConstants(): Map<String, Any> =
        mapOf("isDebugBuild" to BuildConfig.DEBUG)

    /**
     * The same answer as a call rather than a constant.
     *
     * Under the New Architecture a legacy module reaches JS through the
     * TurboModule interop layer, which exposes methods but does not spread
     * constants onto the module object the way the old bridge did. Reading
     * NativeModules.AppBuildInfo.isDebugBuild therefore yields undefined, and
     * anything gated on it silently stays off. A method is unambiguous.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isDebugBuildSync(): Boolean = BuildConfig.DEBUG

    /**
     * The authoritative answer, as a promise.
     *
     * Constants and synchronous methods both depend on how the interop layer
     * bridges a legacy module, and neither survived the trip on this build —
     * the debug-only Pro override stayed off in a debug APK. A promise-backed
     * @ReactMethod is the one shape proven to work here (it is what backup
     * export uses, and that writes a real file), so it is what the override
     * is gated on.
     */
    @ReactMethod
    fun fetchIsDebugBuild(promise: Promise) {
        promise.resolve(BuildConfig.DEBUG)
    }
}
