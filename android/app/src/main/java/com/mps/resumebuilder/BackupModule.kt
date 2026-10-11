package com.mps.resumebuilder

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * File access for backup export and import.
 *
 * This exists instead of a document-picker dependency because the app needs
 * exactly two operations — write one text file where the existing
 * FileProvider can already share it, and read one text file the user points
 * at. A picker library would add another native module to autolink, another
 * thing to break on a React Native upgrade, and a Play review surface, for
 * two intents.
 *
 * Writes go to the same Documents directory as exported PDFs, which
 * res/xml/file_paths.xml already declares, so the share sheet works with no
 * further configuration and no storage permission.
 */
class BackupModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx), ActivityEventListener {

    private companion object {
        const val REQUEST_PICK = 7321

        /**
         * A backup is JSON describing resumes the user typed by hand, so a
         * real one is measured in kilobytes. The cap is here because the user
         * can point this at any file on the device and the contents are read
         * into memory in one go.
         */
        const val MAX_IMPORT_BYTES = 8L * 1024 * 1024
    }

    private var pending: Promise? = null

    init {
        ctx.addActivityEventListener(this)
    }

    override fun getName() = "BackupFiles"

    /** Returns the absolute path of the written file, for the share sheet. */
    @ReactMethod
    fun writeBackup(fileName: String, contents: String, promise: Promise) {
        try {
            // getExternalFilesDir can be null when external storage is not
            // mounted; filesDir is the documented fallback and is declared in
            // file_paths.xml for exactly this case.
            val base = ctx.getExternalFilesDir(null) ?: ctx.filesDir
            val dir = File(base, "Documents")
            if (!dir.exists() && !dir.mkdirs()) {
                promise.reject("write_failed", "Could not create the Documents folder.")
                return
            }
            val file = File(dir, sanitise(fileName))
            file.writeText(contents, Charsets.UTF_8)
            promise.resolve(file.absolutePath)
        } catch (e: Exception) {
            promise.reject("write_failed", e.message ?: "The backup could not be written.", e)
        }
    }

    /**
     * Opens the system document picker. Resolves with the file's text, or
     * null if the user backed out — cancelling is not an error and should not
     * surface as one in JS.
     */
    @ReactMethod
    fun pickBackup(promise: Promise) {
        // Not getCurrentActivity(): that overload is deprecated from 0.80 and
        // is a plain function rather than a property, so it does not resolve
        // through Kotlin synthetic access.
        val activity = ctx.currentActivity
        if (activity == null) {
            promise.reject("no_activity", "The app is not in the foreground.")
            return
        }
        if (pending != null) {
            promise.reject("busy", "A file picker is already open.")
            return
        }

        // ACTION_OPEN_DOCUMENT rather than GET_CONTENT: it returns a stable
        // document uri and does not need any storage permission.
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            // Some file managers refuse to show .json under a narrow type, so
            // the filter is broad and the JSON is validated in JS instead.
            type = "*/*"
            putExtra(
                Intent.EXTRA_MIME_TYPES,
                arrayOf("application/json", "text/plain", "application/octet-stream"),
            )
        }

        pending = promise
        try {
            activity.startActivityForResult(intent, REQUEST_PICK)
        } catch (e: Exception) {
            pending = null
            promise.reject("no_picker", "This device has no file picker.", e)
        }
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        if (requestCode != REQUEST_PICK) return
        val promise = pending ?: return
        pending = null

        val uri = data?.data
        if (resultCode != Activity.RESULT_OK || uri == null) {
            promise.resolve(null) // cancelled
            return
        }

        try {
            val size = ctx.contentResolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: -1L
            if (size > MAX_IMPORT_BYTES) {
                promise.reject("too_large", "That file is too large to be a backup.")
                return
            }
            val text = ctx.contentResolver.openInputStream(uri)?.use {
                it.readBytes().toString(Charsets.UTF_8)
            }
            if (text == null) {
                promise.reject("read_failed", "That file could not be opened.")
            } else {
                promise.resolve(text)
            }
        } catch (e: Exception) {
            promise.reject("read_failed", e.message ?: "That file could not be read.", e)
        }
    }

    override fun onNewIntent(intent: Intent) = Unit

    /** Keeps a caller-supplied name from escaping the Documents directory. */
    private fun sanitise(name: String): String {
        val cleaned = name.replace(Regex("[^A-Za-z0-9._-]"), "_").trimStart('.')
        return if (cleaned.isEmpty()) "backup.json" else cleaned
    }
}
