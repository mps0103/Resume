package com.mps.resumebuilder

import android.content.ContentValues
import android.os.Build
import android.util.Base64
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * Copies a finished file into the device's public Downloads folder.
 *
 * Exports previously landed in getExternalFilesDir()/Documents, which is the
 * app's own external directory. Android 11 hid that path from the Files app
 * and from every other file manager, so a user who exported a PDF had no way
 * to find it except through the share sheet at the moment it was made. A
 * resume the user cannot locate afterwards may as well not have been saved.
 *
 * MediaStore is used rather than a direct write because it needs no storage
 * permission on Android 10 and later. The app deliberately declares none —
 * see the note in AndroidManifest.xml — and adding WRITE_EXTERNAL_STORAGE
 * just to reach Downloads would mean a Play data-safety declaration for the
 * sake of older devices.
 */
class DownloadsModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    override fun getName() = "AppDownloads"

    /**
     * Writes base64 bytes to a private file and resolves its path.
     *
     * The Word export is assembled in JavaScript as a zip of XML parts, and
     * JavaScript has nowhere to put bytes — the PDF path never needed this
     * because the converter is native and writes the file itself. The caller
     * then hands the path to saveToDownloads, so both exports travel the same
     * proven route to the user's Downloads folder.
     *
     * Files land in cache rather than files/: this copy exists only long
     * enough to be copied out and shared, and Android is free to reclaim it.
     */
    @ReactMethod
    fun writeTempFile(fileName: String, base64: String, promise: Promise) {
        try {
            val dir = File(ctx.cacheDir, "exports").apply { mkdirs() }
            val target = File(dir, sanitise(fileName))

            // Paranoia about the name, not about the caller: a resume title
            // becomes a file name, and a title with a slash in it must not be
            // able to place a file outside this directory.
            if (target.canonicalFile.parentFile != dir.canonicalFile) {
                promise.reject("bad_name", "That file name cannot be used.")
                return
            }

            target.writeBytes(Base64.decode(base64, Base64.DEFAULT))
            promise.resolve(target.absolutePath)
        } catch (e: Exception) {
            promise.reject("write_failed", e.message ?: "The file could not be written.", e)
        }
    }

    /** Strips anything that is not safe in a file name, keeping the extension. */
    private fun sanitise(name: String): String {
        val cleaned = name.replace(Regex("[^A-Za-z0-9._-]"), "_").trim('.', '_')
        return if (cleaned.isEmpty()) "resume" else cleaned.take(80)
    }

    /**
     * Resolves the user-facing location on success, or null when this device
     * is too old for the permissionless path. Null is not an error: the
     * caller falls back to the app's own folder plus the share sheet, which
     * is how export worked before.
     */
    @ReactMethod
    fun saveToDownloads(
        sourcePath: String,
        fileName: String,
        mimeType: String,
        promise: Promise,
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(null)
            return
        }

        val source = File(sourcePath)
        if (!source.exists()) {
            promise.reject("missing_source", "The exported file is no longer there.")
            return
        }

        try {
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                put(MediaStore.Downloads.MIME_TYPE, mimeType)
                put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                // Keeps the entry invisible until the bytes are all written,
                // so a file manager cannot show a half-copied PDF.
                put(MediaStore.Downloads.IS_PENDING, 1)
            }

            val resolver = ctx.contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            if (uri == null) {
                promise.reject("insert_failed", "Downloads could not be written to.")
                return
            }

            resolver.openOutputStream(uri).use { out ->
                if (out == null) {
                    resolver.delete(uri, null, null)
                    promise.reject("open_failed", "Downloads could not be opened for writing.")
                    return
                }
                source.inputStream().use { it.copyTo(out) }
            }

            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, values, null, null)

            // MediaStore renames collisions itself (report.pdf, report (1).pdf),
            // so the stored name is read back rather than assumed.
            val saved = resolver.query(uri, arrayOf(MediaStore.Downloads.DISPLAY_NAME), null, null, null)
                ?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
                ?: fileName

            promise.resolve("Downloads/$saved")
        } catch (e: Exception) {
            promise.reject("save_failed", e.message ?: "The file could not be saved.", e)
        }
    }
}
