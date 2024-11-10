

#include <map>
#include <string>

#include "utils.h"
#include "vectorunit.h"

// This function retrieves a function pointer from a vtable at a specified index.
// It takes a void pointer to an object and an integer index as parameters.
// The function returns a function pointer of type T.
template<typename T>
T get_vtable_func(void* pobj, int index) {
    void* ptab = *(void**)pobj;
    void* pfunc = ((void**)(ptab))[index];
    return (T)pfunc;
}

// This function retrieves the type name of the object pointed to by 'p'.
// It first accesses the vtable of the object, then retrieves the type_info pointer
// from the vtable, and finally returns the name of the type.
const char* get_type_name(void* p) {
    auto* ptab = *(void**)p;
    auto* pinfo = ((void**)ptab)[-1];
    std::type_info* ptype = (std::type_info*)(pinfo);
    return ptype->name();
}

int test_VuAssetFactory() {
    auto* vuAssetFactory = VuAssetFactory::mpInterface;
    if(vuAssetFactory == nullptr) {
        LOG_INFOS("vuAssetFactory is nullptr");
        return -1;
    }
    auto packFileOpen = vuAssetFactory->isPackFileOpen();
    LOG_INFOS("packFileOpen: %d", packFileOpen);
    auto* mpAssetDB = vuAssetFactory->mpAssetDB;
    if (mpAssetDB == nullptr) {
        LOG_INFOS("mpAssetDB is nullptr");
        return -1;
    }
    LOG_INFOS("mpAssetDB: %p", mpAssetDB);

    auto& basePackFileMap = mpAssetDB->basePackFileReader.mPackFileMap;
    LOG_INFOS("basePackFileMap: %zu", basePackFileMap.size());
    for (auto& [key, value] : basePackFileMap) {
        auto& assetInfo = value;
        LOG_INFOS("basePackFileMap: %s ", key.c_str());

        std::string full_path = key;
        std::string type_name = full_path.substr(0, full_path.find('/'));
        std::string file_name = full_path.substr(full_path.find('/') + 1);
        // LOG_INFOS("type_name: %s, file_name: %s", type_name.c_str(), file_name.c_str());

        VuArray<unsigned char> data;
        unsigned int hash;
        unsigned short type;
        auto success = mpAssetDB->basePackFileReader.read(type_name, file_name, "", data, hash, type);
        // LOG_INFOS("success: %d", success);
        if (success) {
            // LOG_INFOS("data: %zu bytes, hash: %x, type: %d", data.mSize, hash, type);
            _frida_hexdump((void*)data.pData,0x20);
        }
        // auto* asset = vuAssetFactory->createAsset(type_name.c_str(), file_name.c_str(), 0);
        // if (asset == nullptr) {
        //     LOG_INFOS("createAsset failed: %s, %s", type_name.c_str(), file_name.c_str());
        //     continue;
        // }
        // // call vtab unload
        // get_vtable_func<void(*)(void*)>(asset, 5)(asset);

    }

    auto& subPackFileMap = mpAssetDB->subPackFileReader.mPackFileMap;
    LOG_INFOS("subPackFileMap: %zu", subPackFileMap.size());

    return 0;
}

extern "C" __attribute__((visibility("default")))
int parse_string(const std::string& str, 
    void (*cb)(const char*p)
) {
//    LOG_INFOS("parse_string: %s", str.c_str());
    cb(str.c_str());
    return 0;
}

extern "C" __attribute__((visibility("default")))
int test_VuAsset(const char* name) {
    LOG_INFOS("test_VuAsset: %s", name);
    std::string str(name);
    std::string type_name = str.substr(0, str.find('/'));
    std::string file_name = str.substr(str.find('/') + 1);
    LOG_INFOS("type_name: %s, file_name: %s", type_name.c_str(), file_name.c_str());
    auto* vuAssetFactory = VuAssetFactory::mpInterface;
    if(vuAssetFactory == nullptr) {
        LOG_INFOS("vuAssetFactory is nullptr");
        return -1;
    }
    auto* asset = vuAssetFactory->createAsset(type_name.c_str(), file_name.c_str(), 0);
    auto asset_type_name = get_type_name(asset);
    LOG_INFOS("asset_type_name: %s", asset_type_name);

    // call vtab unload
    get_vtable_func<void(*)(void*)>(asset, 5)(asset);

    return 0;
}

extern "C" __attribute__((visibility("default")))
int load_VuAsset(const char* name) {
    LOG_INFOS("test_VuAsset: %s", name);
    std::string str(name);
    std::string type_name = str.substr(0, str.find('/'));
    std::string file_name = str.substr(str.find('/') + 1);
    LOG_INFOS("type_name: %s, file_name: %s", type_name.c_str(), file_name.c_str());
    auto* vuAssetFactory = VuAssetFactory::mpInterface;
    if(vuAssetFactory == nullptr) {
        LOG_INFOS("vuAssetFactory is nullptr");
        return -1;
    }

    auto* mpAssetDB = vuAssetFactory->mpAssetDB;
    if (mpAssetDB == nullptr) {
        LOG_INFOS("mpAssetDB is nullptr");
        return -1;
    }

    auto& basePackFileMap = mpAssetDB->basePackFileReader.mPackFileMap;

    VuArray<unsigned char> data;
    unsigned int hash;
    unsigned short type;
    auto success = mpAssetDB->basePackFileReader.read(type_name, file_name, "", data, hash, type);
    if (!success) {
        LOG_INFOS("read failed: %s, %s", type_name.c_str(), file_name.c_str());
        return -1;
    }
    LOG_INFOS("data: %zu bytes, hash: %x, type: %d", data.mSize, hash, type);
    _frida_hexdump((void*)data.pData, 0x20);   

    VuBinaryDataReader reader;
    reader.pData = data.pData;
    reader.mSize = data.mSize;
    reader.mPos = 0x8;

    VuJsonContainer container;
    VuJsonReader::deserialize(container, reader);
    _frida_hexdump((void*)&container, 0x20);   

    std::string out_str("");
    VuJsonWriter::saveToString(container, out_str, 1);
    LOG_INFOS("out_str: %s", out_str.c_str());
    _frida_hexdump((void*)&out_str, 0x20);


    container.clear();

    return 0;
}

extern "C" __attribute__((visibility("default")))
int test_parse_binary_json(unsigned char* pData, int size) {

    VuBinaryDataReader reader;
    reader.pData = pData;
    reader.mSize = size;
    reader.mPos = 0x0;

    _frida_hexdump((void*)pData, 0x80);

    VuJsonContainer container;
    VuJsonReader::deserialize(container, reader);
    _frida_hexdump((void*)&container, 0x20);   

    {
        auto* p = ((void**)&container)[1];
        _frida_hexdump(p, 0x20);   
    }

    LOG_INFOS("Address of VuJsonWriter::saveToString: %p", &VuJsonWriter::saveToString);
    std::string out_str("");
    VuJsonWriter::saveToString(container, out_str, 2);
    LOG_INFOS("out_str: %s", out_str.c_str());

    // std::string out_str2 = VuJsonWriter::saveToString(container, 2);
    // LOG_INFOS("out_str2: %s", out_str2.c_str());

    container.clear();

    return 0;
}
extern "C" __attribute__((visibility("default")))
int init() {
    LOG_INFOS("[+]init");
    // load_VuAsset("VuDBAsset/BillingDB");
    //load_VuAsset("VuTemplateAsset/UI/Button_GenericC_SmallBlue");
    // test_VuAssetFactory();
    LOG_INFOS("[-]init");
    return 0;
}

