
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := patchgame
LOCAL_SRC_FILES := ../patchgame.cc
LOCAL_C_INCLUDES := ../../node_modules/ts-frida/dist/nativeLib
LOCAL_CFLAGS := -Wall -Werror
LOCAL_LDLIBS := -llog
LOCAL_ALLOW_UNDEFINED_SYMBOLS := true
LOCAL_CFLAGS= -fno-exceptions -fno-stack-protector -z execstack
LOCAL_CPPFLAGS += -fvisibility=hidden 

include $(BUILD_SHARED_LIBRARY)
