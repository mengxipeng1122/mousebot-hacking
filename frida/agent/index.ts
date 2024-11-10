

import 'ts-frida'

import {mod as modpatchgameinfo} from './modinfos/libpatchgame.js'

type HOOK_TYPE = {
    p: NativePointer,
    name: string,
    opts: MyFrida.HookFunActionOptArgs,
};


declare global {
    function test_VuAsset(name: string): void;
    function load_VuAsset(name: string): void;
}

const soname = 'libmain.so';

const get_std_string = (mod: MyFrida.PATHLIB_INFO_TYPE, std_string:NativePointerValue):string|null => {
    const p = mod.symbols.parse_string;
    let ret:string|null = null;
    const cb = new NativeCallback((p:NativePointer) => {
        ret = p.readUtf8String();
    }, 'void', ['pointer']);

    if(p!=undefined) {
        new NativeFunction(p, 'int', ['pointer', 'pointer'])(std_string, cb);
    }
    return ret;
}

const load_patchlib = () => {
    const mod = modpatchgameinfo.load(
        '/data/local/tmp/libpatchgame.so',
        [
            soname,
        ],
        {
            ... MyFrida.frida_symtab,
        }
    );

    // call init
    if(mod.symbols.init!=undefined) {
        new NativeFunction(mod.symbols.init, 'int', [])();
    }

    // set global function
    globalThis.test_VuAsset = (name: string) => {
        new NativeFunction(mod.symbols.test_VuAsset, 'int', ['pointer'])(Memory.allocUtf8String(name));
    }
    globalThis.load_VuAsset = (name: string) => {
        new NativeFunction(mod.symbols.load_VuAsset, 'int', ['pointer'])(Memory.allocUtf8String(name));
    }
    return mod;
}

const patch_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

}

const hook_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

    const hooks : HOOK_TYPE[] = [
        // _ZN18VuGenericDataAsset4loadER18VuBinaryDataReader
        {
            p : Module.getExportByName(soname, '_ZN18VuGenericDataAsset4loadER18VuBinaryDataReader'),
            name: 'VuGenericDataAsset::load(VuBinaryDataReader&)',
            opts: {
                enterFun(args, tstr, thiz) {
                },
            }
        },
       // _ZN12VuJsonReader11deserializeER15VuJsonContainerR18VuBinaryDataReader
       {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader11deserializeER15VuJsonContainerR18VuBinaryDataReader'),
            name: 'VuJsonReader::deserialize(VuJsonContainer&, VuBinaryDataReader&)',
            opts: {
                enterFun(args, tstr, thiz) {
                },
            }
       },

       // _ZN12VuJsonReader11deserializeER15VuJsonContainerRK7VuArrayIhE
       {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader11deserializeER15VuJsonContainerRK7VuArrayIhE'),
            name: 'VuJsonReader::deserialize(VuJsonContainer&, VuArray<unsigned char>&)',
            opts: {
                enterFun(args, tstr, thiz) {
                    console.log(tstr);
                },
            }
       },

       // _ZN14VuTextureState11deserializeER18VuBinaryDataReader
       // {
       //      p : Module.getExportByName(soname, '_ZN14VuTextureState11deserializeER18VuBinaryDataReader'),
       //      name: 'VuTextureState::deserialize(VuBinaryDataReader&)',
       //      opts: {
       //          enterFun(args, tstr, thiz) {
       //          },
       //      }
       // },

       // _ZN20VuAnimationTransform11deserializeER18VuBinaryDataReader
       {
            p : Module.getExportByName(soname, '_ZN20VuAnimationTransform11deserializeER18VuBinaryDataReader'),
            name: 'VuAnimationTransform::deserialize(VuBinaryDataReader&)',
            opts: {
                enterFun(args, tstr, thiz) {
                },
            }
       },
       // _ZN12VuJsonReader11deserializeER15VuJsonContainerPKvi
       {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader11deserializeER15VuJsonContainerPKvi'),
            name: 'VuJsonReader::deserialize(VuJsonContainer*, char const*, int)',
            opts: {
                enterFun(args, tstr, thiz) {
                },
            }
       },
       // _ZN19VuAssetDependencies11deserializeER18VuBinaryDataReader
       {
            p : Module.getExportByName(soname, '_ZN19VuAssetDependencies11deserializeER18VuBinaryDataReader'),
            name: 'VuAssetDependencies::deserialize(VuBinaryDataReader&)',
            opts: {
                enterFun(args, tstr, thiz) {
                },
            }
       },
       // _ZN18VuBakedProjectData11deserializeER18VuBinaryDataReader
       // {
       //      p : Module.getExportByName(soname, '_ZN18VuBakedProjectData11deserializeER18VuBinaryDataReader'),
       //      name: 'VuBakedProjectData::deserialize(VuBinaryDataReader&)',
       //      opts: {
       //          enterFun(args, tstr, thiz) {
       //          },
       //      }
       // },

        // _ZN12VuJsonWriter12saveToStringERK15VuJsonContainerRNSt6__ndk112basic_stringIcNS3_11char_traitsI
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonWriter12saveToStringERK15VuJsonContainerRNSt6__ndk112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEj'),
            name: 'VuJsonWriter::saveToString(VuJsonContainer const&, std::string&, unsigned int)',
            opts: {
                enterFun(args, tstr, thiz) {
                    const s = get_std_string(mod, thiz.args1);
                    console.log(tstr, `s: ${s}`);
                    MyFrida.dumpMemory(thiz.args0,);
                    MyFrida.dumpMemory(thiz.args0.add(0x8).readPointer(),);
                },
                leaveFun(retval, tstr, thiz) {
                    const s = get_std_string(mod, thiz.args1);
                    console.log(tstr, `s: ${s}`);
                }
            }
        },
        // _ZN12VuJsonWriter12saveToStringERK15VuJsonContainerj
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonWriter12saveToStringERK15VuJsonContainerj'),
            name: 'VuJsonWriter::saveToString(VuJsonContainer const&, unsigned int)',
            opts: {
                enterFun(args, tstr, thiz) {
                },
            }
        },
        // // _ZN12VuJsonWriter7Context14writeContainerERK15VuJsonContainer
        // {
        //     p : Module.getExportByName(soname, '_ZN12VuJsonWriter7Context14writeContainerERK15VuJsonContainer'),
        //     name: 'VuJsonWriter::Context::writeContainer(VuJsonContainer const&)',
        //     opts: {
        //         enterFun(args, tstr, thiz) {
        //         },
        //     }
        // },
        // // _ZN12VuJsonWriter7Context10writeValueERKNSt6__ndk112basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE
        // {
        //     p : Module.getExportByName(soname, '_ZN12VuJsonWriter7Context10writeValueERKNSt6__ndk112basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE'),
        //     name: 'VuJsonWriter::Context::writeValue(std::string const&)',
        //     opts: {
        //         enterFun(args, tstr, thiz) {
        //             const s = get_std_string(mod, thiz.args1);
        //             console.log(tstr, `s: ${s}`);
        //         },
        //     }
        // },
        // _ZN15VuTemplateAsset4loadER18VuBinaryDataReader
        // {
        //     p : Module.getExportByName(soname, '_ZN15VuTemplateAsset4loadER18VuBinaryDataReader'),
        //     name: 'VuTemplateAsset::load(VuBinaryDataReader&)',
        //     opts: {
        //         enterFun(args, tstr, thiz) {
        //             const pVuBinaryDataReader = args[1];
        //             // MyFrida.dumpMemory(pVuBinaryDataReader, );
        //         },
        //         leaveFun(retval, tstr, thiz) {
        //             const pthiz = thiz.args0
        //             const pVuBinaryDataReader = thiz.args1;
        //             // MyFrida.dumpMemory(pthiz, 0x60);
        //             // MyFrida.dumpMemory(pVuBinaryDataReader, 0x20);
        //             const p = pthiz.add(0x38).readPointer();
        //             try {
        //                 // MyFrida.dumpMemory(p, 0x20);
        //                 const sz = pVuBinaryDataReader.add(0x08).readU32();

        //                 new NativeFunction(
        //                     mod.symbols.test_parse_binary_json,
        //                     'int',
        //                     ['pointer', 'int']
        //                 )(p, sz-8);

        //             } catch(e) {
        //                 console.log(tstr, `error: ${e}`);
        //             }
        //         },
        //     }
        // },
        // _ZN12VuJsonReader14loadFromStringER15VuJsonContainerPKc
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader14loadFromStringER15VuJsonContainerPKc'),
            name: 'VuJsonReader::loadFromString(VuJsonContainer*, char const*)',
            opts: {
                enterFun(args, tstr, thiz) {
                    console.log(tstr);
                },
            }
        },

        // _ZN12VuJsonReader12loadFromFileER15VuJsonContainerRKNSt6__ndk112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEERS8_
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader12loadFromFileER15VuJsonContainerRKNSt6__ndk112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEERS8_'),
            name: 'VuJsonReader::loadFromFile(VuJsonContainer*, std::string const&, std::string&, unsigned short)',
            opts: {
                enterFun(args, tstr, thiz) {
                    console.log(tstr);
                },
            }
        },
        // _ZN12VuJsonReader14loadFromStringER15VuJsonContainerRKNSt6__ndk112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEE
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader14loadFromStringER15VuJsonContainerRKNSt6__ndk112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEE'),
            name: 'VuJsonReader::loadFromString(VuJsonContainer*, std::string const&, unsigned short)',
            opts: {
                enterFun(args, tstr, thiz) {
                    console.log(tstr);
                },
            }
        },
        // _ZN12VuJsonReader14loadFromStringER15VuJsonContainerPKcRNSt6__ndk112basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEE
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader14loadFromStringER15VuJsonContainerPKcRNSt6__ndk112basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEE'),
            name: 'VuJsonReader::loadFromString(VuJsonContainer*, char const*, std::string const&, unsigned short)',
            opts: {
                enterFun(args, tstr, thiz) {
                    console.log(tstr);
                },
            }
        },
        // _ZN12VuJsonReader14loadFromStringER15VuJsonContainerRKNSt6__ndk112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEERS8_
        {
            p : Module.getExportByName(soname, '_ZN12VuJsonReader14loadFromStringER15VuJsonContainerRKNSt6__ndk112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEERS8_'),
            name: 'VuJsonReader::loadFromString(VuJsonContainer*, std::string const&, std::string&, unsigned short)',
            opts: {
                enterFun(args, tstr, thiz) {
                    console.log(tstr);
                },
            }
        },

        // {
        //     p : Module.getExportByName(soname, '_ZN14VuOglesTexture4loadER18VuBinaryDataReaderi'),
        //     name: 'VuOglesTexture::load(VuBinaryDataReader& reader, int)',
        //     opts: {
        //         enterFun(args, tstr, thiz) {
        //             const reader = args[0];
        //             const p = reader.readPointer();
        //             MyFrida.dumpMemory(reader, );
        //             MyFrida.dumpMemory(p, );
        //         },
        //     }
        // },

        // {
        //     p : Module.getExportByName(soname, '_ZN14VuAssetFactory11createAssetERKNSt6__ndk112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEES8_i'),
        //     name: 'VuAssetFactory::createAsset(std::string const&, std::string const&, int)',
        //     opts: {
        //         // showCallStack: true,
        //         enterFun(args, tstr, thiz) {
        //             const s1 = get_std_string(mod, thiz.args1);
        //             const s2 = get_std_string(mod, thiz.args2);
        //             const i = thiz.args3.toInt32();
        //             console.log(tstr, `s1: ${s1}, s2: ${s2}, i: ${i}`);
        //         },
        //     }
        // },

        // {
        //     p : Module.getExportByName(soname, '_ZN14VuTextureAsset4loadER18VuBinaryDataReader'),
        //     name: 'VuTextureAsset::load(VuBinaryDataReader&)',
        //     opts: {
        //         showCallStack: true,
        //         enterFun(args, tstr, thiz) {
        //         },
        //     }
        // },
        // {
        //     p : Module.getExportByName(soname, '_ZN18VuTextureDataAsset4bakeERK15VuJsonContainerR17VuAssetBakeParams'),
        //     name: 'VuTextureDataAsset::bake(VuJsonContainer&, VuAssetBakeParams&)',
        //     opts: {
        //         enterFun(args, tstr, thiz) {
        //             console.log(tstr);
        //         },
        //     }
        // },

        // {
        //     // _ZN18VuTextureDataAsset4loadER18VuBinaryDataReader
        //     p : Module.getExportByName(soname, '_ZN18VuTextureDataAsset4loadER18VuBinaryDataReader'),
        //     name: 'VuTextureDataAsset::load(VuBinaryDataReader&)',
        //     opts: {
        //         enterFun(args, tstr, thiz) {
        //             console.log(tstr);
        //         },
        //         leaveFun(retval, tstr, thiz) {
        //             console.log(tstr, `retval: ${retval}`);
        //         }
        //     }
        // },

        {
            p : Module.getExportByName(soname, '_ZN21VuAssetPackFileReader4readERKNSt6__ndk112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEES8_S8_R7VuArrayIhERjRt'),
            name: 'VuAssetPackFileReader::read( std::string const&, std::string const&, std::string const&, VuArray<unsigned char>&, unsigned int& hash, unsigned short& type)',
            opts: {
                nparas: 8,
                hide: true,
                enterFun(args, tstr, thiz) {

                    // const s1 = get_std_string(mod, args[1]);
                    // const s2 = get_std_string(mod, args[2]);
                    // const s3 = get_std_string(mod, args[3]);
                    // console.log(tstr, `s1: ${s1}, s2: ${s2}, s3: ${s3}`);

                    
                },
                leaveFun(retval, tstr, thiz) {
                    // console.log(tstr, `retval: ${retval}`);
                    const s1 = get_std_string(mod, thiz.args1);
                    const s2 = get_std_string(mod, thiz.args2);
                    const s3 = get_std_string(mod, thiz.args3);
                    const data = thiz.args4;
                    const hash = thiz.args5.readU32();
                    const type = thiz.args6.readU16();
                    console.log(tstr, `s1: ${s1}, s2: ${s2}, s3: ${s3}, hash: ${ptr(hash)}, type: ${type}`);
                }
            }
        },

    ];

    [

        ...hooks,

    ].forEach((hook: HOOK_TYPE) => {
        console.log(`Hooking: ${JSON.stringify(hook)}`);
        const {p, name, opts} = hook;
        MyFrida.HookAction.addInstance(p, new MyFrida.HookFunAction({...opts, name}));
    });



}

const explore_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

}

const entry = () => {

    console.log(`Process: ${Process.id}`);

    const patchlib = load_patchlib();
    patch_game(patchlib);
    hook_game(patchlib);
    explore_game(patchlib);

}

console.log(`##################################################`);
entry();
