# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-vector-icons - prevent R8 from stripping the native font module
-keep class com.oblador.vectoricons.** { *; }
-keep class com.oblador.vectoricons.VectorIconsPackage { *; }
-keep class com.oblador.vectoricons.VectorIconsModule { *; }

# Expo modules - keep all expo module classes
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }
-keep class expo.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Mapbox
-keep class com.mapbox.** { *; }

# Socket.io
-keep class io.socket.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }

# General rules to prevent issues with reflection
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions

# Add any project specific keep options here:

# Auto-generated rules for missing classes (from R8 missing_rules.txt)
-dontwarn expo.modules.kotlin.services.FilePermissionService$Permission
-dontwarn expo.modules.kotlin.services.FilePermissionService
