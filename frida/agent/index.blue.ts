import "ts-frida"
import {mod as libblueinfo} from './modinfos/libblue.js'
import { get } from "node:http"

import { 
    LogEntry, 
    TextureInfo,
} from './common.js';

const soname = "libBlue.so"

declare global {
    function get_asset_binary(asset_type: string, asset_name: string, asset_lang: string) : ArrayBuffer | null;
    function get_asset_json(asset_type: string, asset_name: string, asset_lang: string) : string | null;
    function get_asset_texture_info(asset_type: string, asset_name: string, asset_lang: string) : TextureInfo[];
    function get_asset_texture_binary(asset_type: string, asset_name: string, asset_lang: string, level: number) : ArrayBuffer | null;
}

type HOOK_TYPE = {
    p: NativePointer,
    name: string,
    opts: MyFrida.HookFunActionOptArgs,
}

const parse_vu_array_unsigned_char = (mod: MyFrida.PATHLIB_INFO_TYPE, arr: NativePointer) : ArrayBuffer | null => {
    let bs : ArrayBuffer | null = null;
    let cb  = new NativeCallback((p:NativePointer, len:number) => {
        bs = p.readByteArray(len)
    }, 'void', ['pointer', 'int']);
    const fn = new NativeFunction(mod.symbols.parse_vu_array_unsigned_char, 'void', ['pointer', 'pointer'])
    fn(arr, cb)
    return bs;
}

const parse_std_string = (mod: MyFrida.PATHLIB_INFO_TYPE, str: NativePointer) : string | null => {
    let s : string | null = null;
    let cb  = new NativeCallback((p:NativePointer) => {
        s = p.readUtf8String();
    }, 'void', ['pointer']);

    const fn = new NativeFunction(mod.symbols.parse_std_string, 'void', ['pointer', 'pointer'])
    fn(str, cb)
    return s;
}

const load_patchlib = ()=>{
    const mod = libblueinfo.load('/data/local/tmp/libblue.so',[
        soname
    ],{
        ... MyFrida.frida_symtab,
    });

    if(mod.symbols.init) {
        new NativeFunction(mod.symbols.init, 'int', [])()
    }

    const get_asset_binary = (asset_type: string, asset_name: string, asset_lang: string) => {
            let bs: ArrayBuffer | null = null;

            const cb = new NativeCallback((p:NativePointer, size:number) => {
                bs = p.readByteArray(size)
                console.log(`get_asset_binary: ${bs?.byteLength}`)
            }, 'void', ['pointer', 'int'])


            if (mod.symbols.get_asset_binary) {
                new NativeFunction(mod.symbols.get_asset_binary, 
                    'int', 
                    ['pointer', 'pointer', 'pointer', 'pointer'])(
                        Memory.allocUtf8String(asset_type), 
                        Memory.allocUtf8String(asset_name), 
                        Memory.allocUtf8String(asset_lang), 
                        cb)
            }
            return bs;
        };

    const get_asset_json = (asset_type: string, asset_name: string, asset_lang: string) : string | null => {
        let json: string | null = null;

        const cb = new NativeCallback((p:NativePointer) => {
            json = p.readUtf8String()
        }, 'void', ['pointer'])

        new NativeFunction(mod.symbols.get_asset_json, 
            'int', 
            ['pointer', 'pointer', 'pointer', 'pointer'])(
                Memory.allocUtf8String(asset_type), 
                Memory.allocUtf8String(asset_name), 
                Memory.allocUtf8String(asset_lang), 
                cb)
        return json;
    }

    const get_asset_texture_info = (asset_type: string, asset_name: string, asset_lang: string) => {
        let images: TextureInfo[] = [];

        const cb = new NativeCallback((size:number, level:number, width:number, height:number, pitch:number, glFormat:number) => {
            console.log(`get_asset_texture_info: ${level} ${width} ${height} ${pitch} ${glFormat}`)
            images.push({
                level,
                width,
                height,
                pitch,
                glFormat,
            })
        }, 'void', ['int', 'int', 'int', 'int', 'int', 'int'])

        new NativeFunction(mod.symbols.get_asset_texture_info, 
            'int', 
            ['pointer', 'pointer', 'pointer', 'pointer'])(
                Memory.allocUtf8String(asset_type), 
                Memory.allocUtf8String(asset_name), 
                Memory.allocUtf8String(asset_lang), 
                cb)
        console.log(`get_asset_texture_info: ${images.length} ${JSON.stringify(images)}`)
        return images;
    }

    const get_asset_texture_binary = (asset_type: string, asset_name: string, asset_lang: string, level: number) => {
        let bs: ArrayBuffer | null = null;
        const cb = new NativeCallback((p:NativePointer, size:number) => {
            bs = p.readByteArray(size)
        }, 'void', ['pointer', 'int'])

        new NativeFunction(mod.symbols.get_asset_texture_binary, 
            'int', 
            ['pointer', 'pointer', 'pointer', 'int', 'pointer'])(
                Memory.allocUtf8String(asset_type), 
                Memory.allocUtf8String(asset_name), 
                Memory.allocUtf8String(asset_lang), 
                level,
                cb);
        return bs;
    }

    rpc.exports = {
        // Add two numbers and return result
        invoke_init: function(a, b) {
            console.log(`init: ${a} ${b}`)
            return  "Hello from frida ts"
        },

        get_asset_binary,

        get_asset_json,

        get_asset_texture_info,

        get_asset_texture_binary,

    }

    global.get_asset_binary = get_asset_binary
    global.get_asset_json = get_asset_json
    global.get_asset_texture_info = get_asset_texture_info
    global.get_asset_texture_binary = get_asset_texture_binary

    return mod
}

const patch_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {
}

const hook_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

    const hooks: HOOK_TYPE[] = [    
        {
            p: Module.getExportByName(soname, '_ZN21VuAssetPackFileReader4readEPKcRKSsS3_RjS4_R7VuArrayIhE'),
            name: 'VuAssetPackFileReader::read(const char*, std::string const&, std::string const&, unsigned int&, unsigned int&, std::vector<unsigned char>const',
            opts: {
                nparas: 8,
                hide: true,
                enterFun(args, tstr, thiz) {
                },
                leaveFun(args, tstr, thiz) {
                    const asset_type = thiz.args1.readUtf8String();
                    const asset_name = parse_std_string(mod, thiz.args2)
                    const asset_lang = parse_std_string(mod, thiz.args3)
                    const type = thiz.args4.readU32()
                    const crc = thiz.args5.readU32()
                    const arr = parse_vu_array_unsigned_char(mod, thiz.args6)
                    console.log(tstr, `${asset_type}/${asset_name} ${asset_lang} type: ${type}, crc: ${crc} ${arr?.byteLength}`)
                    const data : LogEntry = {
                        assetType: asset_type ?? '',
                        assetName: asset_name ?? '',
                        assetLang: asset_lang ?? '',
                        type: type.toString(),
                        crc:ptr(crc).toString(),
                        size:arr?.byteLength ?? 0,
                    }
                    send({
                        type:'asset_read',
                        data,
                    });

                }
            }
        },
    ];

    [
        ...hooks,
    ].forEach((hook: HOOK_TYPE) => {
        console.log(`hook ${JSON.stringify(hook)}`)
        const {p, name, opts} = hook
        MyFrida.HookAction.addInstance(p, new MyFrida.HookFunAction({...opts,name}));
    })

}

const explore_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

}


const entry = () => {

    const mod = load_patchlib()

    patch_game(mod)

    hook_game(mod)

    explore_game(mod)
}

console.log("########################################")
Java.perform(entry)
