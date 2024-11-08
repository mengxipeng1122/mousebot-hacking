
# the original Apk is using ndk r23b
NDK_SDK:=/opt/android-ndk-r23c

ifeq ($(wildcard $(NDK_SDK)),)
$(error NDK_SDK path $(NDK_SDK) does not exist. Please set NDK_SDK to a valid NDK installation path)
endif

all:
	$(NDK_SDK)/ndk-build -C jni 

clean:
	$(NDK_SDK)/ndk-build -C jni clean
