

APP:=blue


ifeq ($(APP),blue)
NDK_PATH?=/opt/android-ndk-r9d
else
NDK_PATH?=/opt/android-ndk-r23b
endif

all: build_c convert_so
	npx frida-compile agent/index.$(APP).ts -o _agent.js -c

ifeq ($(APP),blue)
convert_so:
	./node_modules/ts-frida/dist/bin/so2ts.py  -b c/libs/armeabi-v7a/lib${APP}.so -o agent/modinfos/lib${APP}.ts --no-content
else 
convert_so:
	./node_modules/ts-frida/dist/bin/so2ts.py  -b c/libs/arm64-v8a/libpatchgame.so -o agent/modinfos/libpatchgame.ts --no-content
endif

build_c:
	make -C c all NDK_PATH=$(NDK_PATH) APP=$(APP)

clean:
	make -C c clean
	rm -f _agent.js
