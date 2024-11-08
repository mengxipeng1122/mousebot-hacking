
# the original Apk is using ndk r23b
NDK_SDK:=/opt/android-ndk-r23c

ifeq ($(wildcard $(NDK_SDK)),)
$(error NDK_SDK path $(NDK_SDK) does not exist. Please set NDK_SDK to a valid NDK installation path)
endif

check_device:
	@if [ -z "$$(adb devices | grep -v List | grep device)" ]; then \
		echo "Error: No Android device connected"; \
		exit 1; \
	fi


all: check_device
	$(NDK_SDK)/ndk-build -C jni V=1
	adb push libs/arm64-v8a/libpatchgame.so /data/local/tmp/

clean:
	$(NDK_SDK)/ndk-build -C jni clean
