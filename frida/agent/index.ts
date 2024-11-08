

import 'ts-frida'

import {mod as modpatchgameinfo} from './modinfos/libpatchgame.js'


const load_patchlib = () => {
    const mod = modpatchgameinfo.load(
        '/data/local/tmp/libpatchgame.so',
        [
            'libmain.so',
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
