
ifeq ($(APP),blue)
APP_ABI := armeabi-v7a
APP_STL := stlport_static
# Available APP_STL choices in NDK r9d:
# system              -> Use the minimal system C++ runtime library
# stlport_static      -> Use STLport built as a static library
# stlport_shared      -> Use STLport built as a shared library
# gnustl_static       -> Use GNU libstdc++ as a static library
# gnustl_shared       -> Use GNU libstdc++ as a shared library
# gabi++_static       -> Use GAbi++ runtime as a static library
# gabi++_shared       -> Use GAbi++ runtime as a shared library
# c++_static         -> Use LLVM libc++ as a static library
# c++_shared         -> Use LLVM libc++ as a shared library

else
APP_ABI := arm64-v8a
endif

# set the minimum supported API level
# use `adb shell getprop ro.build.version.sdk` to check the current API level
APP_PLATFORM := android-30