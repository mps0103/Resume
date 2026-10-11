package com.mps.resumebuilder

import android.os.SystemClock

/**
 * Decides how long the system splash stays on screen.
 *
 * The splash is held past the activity's first frame so the user does not see
 * an empty themed window while the JS bundle loads and the first screen
 * renders. JS releases it from App.tsx once there is something to look at.
 *
 * The deadline is the important part: if JS never signals — a bundle that
 * fails to load, a crash during startup, a Metro connection that is not
 * coming — the splash must still come down. An app that is stuck on its
 * splash looks broken in a way that the user cannot report usefully, whereas
 * a red box or an empty screen is at least diagnosable.
 */
object SplashGate {
    /**
     * Generous enough for a cold start on a slow device with a large bundle,
     * short enough that a hung startup is still obviously a hung startup.
     */
    private const val MAX_WAIT_MS = 5_000L

    /*
     * There is deliberately no minimum display time.
     *
     * One existed while this window animated its own icon, to stop the
     * animation being cut off. Holding a window open for longer than it has
     * anything to say is a cost paid on every single launch, and the
     * branded splash that follows is the one with something to show. This
     * window now leaves the instant React Native has drawn over it.
     */

    @Volatile private var released = false

    @Volatile private var armedAt = 0L

    fun arm() {
        armedAt = SystemClock.elapsedRealtime()
        released = false
    }

    /** Called from JS once the first screen has rendered. */
    fun release() {
        released = true
    }

    fun shouldKeepWaiting(): Boolean =
        !released && SystemClock.elapsedRealtime() - armedAt < MAX_WAIT_MS
}
