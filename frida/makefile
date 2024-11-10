
# the original Apk is using ndk r23d
NDK_PATH?=/opt/android-ndk-r23b

all: build_c convert_so
	npx frida-compile agent/index.ts -o _agent.js -c

convert_so:
	./node_modules/ts-frida/dist/bin/so2ts.py  -b c/libs/arm64-v8a/libpatchgame.so -o agent/modinfos/libpatchgame.ts --no-content

build_c:
	make -C c all NDK_PATH=$(NDK_PATH)

clean:
	make -C c clean
	rm -f _agent.js
