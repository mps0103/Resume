package com.mps.resumebuilder

import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.*
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import java.security.MessageDigest

/**
 * Reads the signing certificate, the installing package, and requests a Play
 * Integrity token.
 *
 * Every value here is advisory. A modded build can return whatever it likes
 * from these methods — the JS side treats an unavailable or failed check as
 * "unverified" and never as proof of anything. The certificate check is the
 * useful one: a repackaged APK cannot carry Play's signature, because the
 * modder does not hold the private key.
 *
 * Set CLOUD_PROJECT_NUMBER from Google Cloud, linked to the Play Console app.
 */
class AppIntegrityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AppIntegrity"

    private val cloudProjectNumber = 0L // TODO: set before release

    @ReactMethod
    fun getSigningCertificateSha256(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val pkg = reactApplicationContext.packageName

            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val info = pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES)
                info.signingInfo?.apkContentsSigners
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES).signatures
            }

            val first = signatures?.firstOrNull()
            if (first == null) {
                promise.reject("no_signature", "No signing certificate found")
                return
            }

            val digest = MessageDigest.getInstance("SHA-256").digest(first.toByteArray())
            promise.resolve(digest.joinToString(":") { "%02X".format(it) })
        } catch (e: Exception) {
            promise.reject("signature_error", e.message, e)
        }
    }

    @ReactMethod
    fun getInstallerPackageName(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val pkg = reactApplicationContext.packageName
            val installer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                pm.getInstallSourceInfo(pkg).installingPackageName
            } else {
                @Suppress("DEPRECATION")
                pm.getInstallerPackageName(pkg)
            }
            promise.resolve(installer)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun requestIntegrityToken(nonce: String, promise: Promise) {
        if (cloudProjectNumber == 0L) {
            promise.reject("not_configured", "Cloud project number is not set")
            return
        }
        try {
            val manager = IntegrityManagerFactory.create(reactApplicationContext)
            manager.requestIntegrityToken(
                IntegrityTokenRequest.builder()
                    .setNonce(nonce)
                    .setCloudProjectNumber(cloudProjectNumber)
                    .build()
            ).addOnSuccessListener { promise.resolve(it.token()) }
             .addOnFailureListener { promise.reject("integrity_failed", it.message, it) }
        } catch (e: Exception) {
            promise.reject("integrity_error", e.message, e)
        }
    }
}
