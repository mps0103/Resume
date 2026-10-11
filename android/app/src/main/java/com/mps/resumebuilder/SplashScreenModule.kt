package com.mps.resumebuilder

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Lets JS take the splash screen down when the first screen is ready.
 *
 * There is deliberately no show() — the splash is owned by the system and
 * only ever appears at launch. Re-showing it later would be a loading
 * overlay, which is a different thing and belongs in JS.
 */
class SplashScreenModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SplashGate"

    /**
     * Safe to call more than once and safe to call after the deadline has
     * already dropped the splash, so JS does not have to track whether it
     * has run.
     */
    @ReactMethod
    fun hide(promise: Promise) {
        SplashGate.release()
        promise.resolve(true)
    }
}
