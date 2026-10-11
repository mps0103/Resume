# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Play Billing — reflection on purchase models
-keep class com.android.vending.billing.** { *; }
-keep class com.android.billingclient.api.** { *; }

# Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.ump.** { *; }

# react-native-html-to-pdf uses a WebView bridge
-keep class android.webkit.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Play Integrity
-keep class com.google.android.play.core.integrity.** { *; }

# Keep line numbers so Play Console crash reports stay readable after
# the mapping file is uploaded.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# This app's own native modules.
#
# They are reached only by name from JavaScript, so R8 sees no Java caller
# and is entitled to strip or rename them. The symptom in a release build is
# not a crash but silence: NativeModules.AppBuildInfo and friends come back
# undefined, the splash never hides, backup and Downloads stop working, and
# every integrity check reports "unverified".
-keep class com.mps.resumebuilder.** { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Native module stacks that resolve classes reflectively.
-keep class com.margelo.nitro.** { *; }
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.margelo.nitro.**

# PdfBox-Android, pulled in by react-native-html-to-pdf.
#
# Its JPXFilter can decode JPEG 2000 images through com.gemalto.jp2, which is
# a separate optional dependency this app does not ship. R8 treats the
# dangling reference as a hard error and fails minifyRelease outright, so the
# release build cannot be produced at all without this line.
#
# Safe to suppress: the class is only reached when a PDF being *read*
# contains a JP2 image, and this app only ever writes PDFs.
-dontwarn com.gemalto.jp2.JP2Decoder
