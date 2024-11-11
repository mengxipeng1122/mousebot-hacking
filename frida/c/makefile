

APP?=blue

$(info build $(APP))

ifeq ($(wildcard $(NDK_PATH)),)
$(error NDK_PATH path $(NDK_PATH) does not exist. Please set NDK_PATH to a valid NDK installation path)
endif

check_device:
	@if [ -z "$$(adb devices | grep -v List | grep device)" ]; then \
		echo "Error: No Android device connected"; \
		exit 1; \
	fi


ifeq ($(APP),blue)
all: check_device
	$(NDK_PATH)/ndk-build -C jni V=1 APP=$(APP)
	adb push libs/armeabi-v7a/lib$(APP).so /data/local/tmp/
else
all: check_device
	$(NDK_PATH)/ndk-build -C jni V=1 APP=$(APP)
	adb push libs/armeabi-v7a/lib$(APP).so /data/local/tmp/
endif

clean:
	$(NDK_PATH)/ndk-build -C jni clean
