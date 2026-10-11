package com.mps.resumebuilder

import android.os.Bundle
import android.view.animation.LinearInterpolator
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * installSplashScreen() must run before super.onCreate(). It also swaps the
   * activity over to postSplashScreenTheme, which is what lets AppTheme.Splash
   * inherit from Theme.SplashScreen without leaving a non-AppCompat theme in
   * place when ReactActivity's AppCompat machinery starts up.
   *
   * The splash is then held until JS says it has drawn its first screen, so
   * the user never sees the gap between the activity appearing and React
   * rendering. SplashGate caps that wait, so a JS crash shows a broken app
   * rather than an app that never launches.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    val splash = installSplashScreen()
    SplashGate.arm()
    splash.setKeepOnScreenCondition { SplashGate.shouldKeepWaiting() }

    // A short straight fade, and nothing else.
    //
    // What is underneath by this point is SplashOverlay, drawing the very
    // same mark at the very same size and position, holding still. Fading
    // one into an identical copy of itself is invisible at any speed.
    //
    // It used to scale up as it faded. That is what made the hand-over
    // visible: the two marks were briefly the same image at different sizes,
    // which reads as a ghost rather than as a transition.
    //
    // remove() MUST be called or the splash window is never torn down, so it
    // is attached to the animation's end action rather than to any condition.
    splash.setOnExitAnimationListener { provider ->
      provider.view
          .animate()
          .alpha(0f)
          .setDuration(SPLASH_EXIT_MS)
          .setInterpolator(LinearInterpolator())
          .withEndAction { provider.remove() }
          .start()
    }

    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ResumeBuilder"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  private companion object {
    /**
     * Only long enough to absorb a dropped frame at the hand-over. It is
     * crossing to an identical image, so there is nothing to see and no
     * reason to linger.
     */
    const val SPLASH_EXIT_MS = 140L
  }
}
