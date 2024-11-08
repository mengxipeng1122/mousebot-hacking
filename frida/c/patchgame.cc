

#include <map>
#include <string>

#include "utils.h"
#include "vectorunit.h"

struct VuAssetPackFileReader {
    unsigned char _0x00[0x18];
    std::map<std::string, void*> mPackFileMap;
    unsigned char _0x30[0x8];
};
static_assert(sizeof(VuAssetPackFileReader) == 0x38, "offsetof(VuAssetPackFileReader, mPackFileMap) != 0x38");

struct VuAssetDB {
    unsigned char _0x00[0x70];
    VuAssetPackFileReader basePackFileReader;
    VuAssetPackFileReader subPackFileReader;
};
static_assert(offsetof(VuAssetDB, basePackFileReader) == 0x70, "offsetof(VuAssetDB, basePackFileReader) != 0x70");
static_assert(offsetof(VuAssetDB, subPackFileReader) == 0xa8, "offsetof(VuAssetDB, subPackFileReader) != 0xa8");

struct VuAssetFactory {
    unsigned char _0x00[0x68];
    VuAssetDB* mpAssetDB;
    bool isPackFileOpen();
    static VuAssetFactory* mpInterface;
};

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
        LOG_INFOS("basePackFileMap: %s -> %p", key.c_str(), value);
    }

    auto& subPackFileMap = mpAssetDB->subPackFileReader.mPackFileMap;
    LOG_INFOS("subPackFileMap: %zu", subPackFileMap.size());

    return 0;
}

extern "C" __attribute__((visibility("default")))
int init() {
    LOG_INFOS("[+]init");
    LOG_INFOS("sizeof(std::map<std::string, std::string>): %zu", sizeof(std::map<std::string, std::string>));
    test_VuAssetFactory();
    LOG_INFOS("[-]init");
    return 0;
}

