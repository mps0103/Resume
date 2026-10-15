package com.mps.resumebuilder

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.util.zip.ZipInputStream

/**
 * Picks an existing resume and returns its plain text.
 *
 * Only the text is returned. All of the structure — which line is a job
 * title, which is a date — is worked out in JS by services/resumeImport, so
 * that logic stays unit testable rather than living in a native module that
 * can only be exercised on a device.
 *
 * Three formats, because between them they are what people actually have:
 *
 *  - PDF, via PdfBox-Android. It is already on the classpath as a
 *    dependency of react-native-html-to-pdf, so this costs no app size.
 *  - DOCX, which is a zip; word/document.xml holds the text.
 *  - Plain text.
 *
 * A scanned PDF — a photograph of a printed page — contains no text layer
 * and will come back empty. That is reported as such rather than as a
 * failure, because the file is not corrupt and the user needs to be told
 * the actual reason.
 */
class ResumeImportModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx), ActivityEventListener {

    private companion object {
        const val REQUEST_PICK = 7322

        /**
         * A resume is a few pages. Anything much larger is a different kind
         * of document, and PdfBox holds the whole page model in memory.
         */
        const val MAX_BYTES = 12L * 1024 * 1024

        val MIME_TYPES = arrayOf(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
        )
    }

    private var pending: Promise? = null

    init {
        ctx.addActivityEventListener(this)
    }

    override fun getName() = "ResumeImport"

    /**
     * Resolves { fileName, text }, or null if the user backed out.
     *
     * ACTION_OPEN_DOCUMENT is used rather than a storage permission: it
     * grants access to exactly the one file the user chose and needs no
     * permission at all, which is why this app declares none.
     */
    @ReactMethod
    fun pickResume(promise: Promise) {
        val activity = ctx.currentActivity
        if (activity == null) {
            promise.reject("no_activity", "The app is not in the foreground.")
            return
        }

        pending?.resolve(null) // a previous pick that never came back
        pending = promise

        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                // Some file providers honour only the wildcard, and filter
                // on EXTRA_MIME_TYPES; setting both is what works broadly.
                type = "*/*"
                putExtra(Intent.EXTRA_MIME_TYPES, MIME_TYPES)
            }
            activity.startActivityForResult(intent, REQUEST_PICK)
        } catch (e: Exception) {
            pending = null
            promise.reject("no_picker", "No app on this device can pick a file.", e)
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

        // PDF parsing is far too slow for the UI thread, and this runs on it.
        Thread {
            try {
                promise.resolve(read(uri))
            } catch (e: OutOfMemoryError) {
                promise.reject("too_complex", "That file needs more memory than this device has free.")
            } catch (e: Exception) {
                promise.reject("read_failed", e.message ?: "That file could not be read.", e)
            }
        }.start()
    }

    override fun onNewIntent(intent: Intent) = Unit

    private fun read(uri: Uri): com.facebook.react.bridge.WritableMap {
        val resolver = ctx.contentResolver

        val size = resolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: -1L
        if (size > MAX_BYTES) {
            throw IllegalArgumentException("That file is too large to read as a resume.")
        }

        val name = displayName(uri)
        val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalStateException("That file could not be opened.")

        val text = when {
            looksLikePdf(bytes) -> readPdf(bytes)
            looksLikeZip(bytes) -> readDocx(bytes)
            else -> bytes.toString(Charsets.UTF_8)
        }

        return Arguments.createMap().apply {
            putString("fileName", name)
            putString("text", text)
        }
    }

    /**
     * The magic bytes, not the file extension or the reported MIME type.
     * Both of those are routinely wrong — files arrive from chat apps named
     * .pdf while being anything at all — and a wrong guess here reads a zip
     * as UTF-8 and produces pages of mojibake instead of an honest error.
     */
    private fun looksLikePdf(bytes: ByteArray) =
        bytes.size > 4 && bytes[0] == 0x25.toByte() && bytes[1] == 0x50.toByte() &&
            bytes[2] == 0x44.toByte() && bytes[3] == 0x46.toByte()

    private fun looksLikeZip(bytes: ByteArray) =
        bytes.size > 4 && bytes[0] == 0x50.toByte() && bytes[1] == 0x4B.toByte()

    private fun readPdf(bytes: ByteArray): String {
        // Loads the font and glyph-list assets PdfBox needs. Safe to call
        // more than once.
        PDFBoxResourceLoader.init(ctx.applicationContext)
        return PDDocument.load(bytes).use { document ->
            if (document.isEncrypted) {
                throw IllegalArgumentException(
                    "That PDF is password protected, so its text cannot be read.",
                )
            }
            PDFTextStripper().apply {
                // Reading order matters enormously here: the default follows
                // the content stream, which on a two-column resume
                // interleaves the columns into nonsense.
                sortByPosition = true
            }.getText(document)
        }
    }

    /**
     * A .docx is a zip. word/document.xml carries the text, with each
     * paragraph in a <w:p> and each run of text in a <w:t>.
     */
    private fun readDocx(bytes: ByteArray): String {
        var xml: String? = null

        ZipInputStream(bytes.inputStream()).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                if (entry.name == "word/document.xml") {
                    xml = zip.readBytes().toString(Charsets.UTF_8)
                    break
                }
                zip.closeEntry()
            }
        }

        val body = xml ?: throw IllegalArgumentException(
            "That Word file has no readable document inside it.",
        )

        return body
            // Paragraph and line breaks have to become newlines BEFORE the
            // tags are stripped, or the whole resume collapses into one line
            // and every section boundary is lost.
            .replace(Regex("</w:p>"), "\n")
            .replace(Regex("<w:br[^>]*/>"), "\n")
            .replace(Regex("<w:tab[^>]*/>"), " ")
            .replace(Regex("<[^>]+>"), "")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&apos;", "'")
    }

    private fun displayName(uri: Uri): String {
        val projection = arrayOf(OpenableColumns.DISPLAY_NAME)
        return ctx.contentResolver.query(uri, projection, null, null, null)
            ?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
            ?: "resume"
    }
}
