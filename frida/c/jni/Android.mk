
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := patchgame
LOCAL_SRC_FILES := ../patchgame.cc
LOCAL_CFLAGS := -Wall -Werror
LOCAL_LDLIBS := -llog

include $(BUILD_SHARED_LIBRARY)
