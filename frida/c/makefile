

ifeq ($(wildcard $(NDK_PATH)),)
$(error NDK_PATH path $(NDK_PATH) does not exist. Please set NDK_PATH to a valid NDK installation path)
endif

check_device:
	@if [ -z "$$(adb devices | grep -v List | grep device)" ]; then \
		echo "Error: No Android device connected"; \
		exit 1; \
	fi


all: check_device
	$(NDK_PATH)/ndk-build -C jni V=1
	adb push libs/arm64-v8a/libpatchgame.so /data/local/tmp/

clean:
	$(NDK_PATH)/ndk-build -C jni clean
