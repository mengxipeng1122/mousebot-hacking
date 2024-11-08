

#include <map>
#include <string>

#include "utils.h"
#include "vectorunit.h"

static_assert(sizeof(VuAssetPackFileReader) == 0x38, "offsetof(VuAssetPackFileReader, mPackFileMap) != 0x38");

static_assert(offsetof(VuAssetDB, basePackFileReader) == 0x70, "offsetof(VuAssetDB, basePackFileReader) != 0x70");
static_assert(offsetof(VuAssetDB, subPackFileReader) == 0xa8, "offsetof(VuAssetDB, subPackFileReader) != 0xa8");

static_assert(offsetof(VuAssetFactory, mpAssetDB) == 0x68, "offsetof(VuAssetFactory, mpAssetDB) != 0x68");

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
        LOG_INFOS("type_name: %s, file_name: %s", type_name.c_str(), file_name.c_str());

        VuArray<unsigned char> data;
        unsigned int hash;
        unsigned short type;
        auto success = mpAssetDB->basePackFileReader.read(type_name, file_name, "", data, hash, type);
        LOG_INFOS("success: %d", success);
        if (success) {

            LOG_INFOS("data: %zu bytes, hash: %x, type: %d", data.mSize, hash, type);
        }

        // _frida_hexdump((void*)&assetInfo, sizeof(assetInfo));
        // auto* pOriginalData = assetInfo.pOriginalData;
        // LOG_INFOS("pOriginalData: %p", pOriginalData);
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
int init() {
    LOG_INFOS("[+]init");
    test_VuAssetFactory();
    LOG_INFOS("[-]init");
    return 0;
}

