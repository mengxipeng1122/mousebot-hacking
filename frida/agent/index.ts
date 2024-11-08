

import 'ts-frida'

import {mod as modpatchgameinfo} from './modinfos/libpatchgame.js'

type HOOK_TYPE = {
    p: NativePointer,
    name: string,
    opts: MyFrida.HookFunActionOptArgs,
};


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
    return mod;
}

const patch_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

}

const hook_game = (mod: MyFrida.PATHLIB_INFO_TYPE) => {

    const hooks : HOOK_TYPE[] = [
//         _ZN21VuAssetPackFileReader4readERKNSt6__ndk112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEES8_S8_R7VuArrayIhERjRt
        {
            p : Module.getExportByName(soname, '_ZN21VuAssetPackFileReader4readERKNSt6__ndk112basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEES8_S8_R7VuArrayIhERjRt'),
            name: 'VuAssetPackFileReader::read( std::string const&, std::string const&, std::string const&, VuArray<unsigned char>&, unsigned int& hash, unsigned short& type)',
            opts: {
                nparas: 8,
                enterFun(args, tstr, thiz) {

                    const s1 = get_std_string(mod, args[1]);
                    const s2 = get_std_string(mod, args[2]);
                    const s3 = get_std_string(mod, args[3]);
                    console.log(tstr, `s1: ${s1}, s2: ${s2}, s3: ${s3}`);
                    
                },
                leaveFun(retval, tstr, thiz) {
                    console.log(tstr, `retval: ${retval}`);
                    const hash = thiz.args5.readU32();
                    const type = thiz.args6.readU16();
                    console.log(tstr, `hash: ${ptr(hash)}, type: ${type}`);
                }
            }

        }

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
