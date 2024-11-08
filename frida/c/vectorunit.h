
#pragma once





struct VuAssetInfo {
    unsigned char _0x00[0x30];
    unsigned char* pOriginalData;
    unsigned char* pCompressedData;
    unsigned int originalDataSize;
    unsigned int compressedDataSize;
    unsigned char _0x48[0x8];
};

struct VuAssetPackFileReader {
    unsigned char _0x00[0x18];
#ifdef _GHIDRA    
    unsigned char mPackFileMap[0x18];
#else 
    std::map<std::string, VuAssetInfo> mPackFileMap;
#endif
    unsigned char _0x30[0x8];
};

struct VuAssetDB {
    unsigned char _0x00[0x70];
    VuAssetPackFileReader basePackFileReader;
    VuAssetPackFileReader subPackFileReader;
};

struct VuAssetFactory {
    unsigned char _0x00[0x68];
    VuAssetDB* mpAssetDB;
#ifdef _GHIDRA    
#else 
    bool isPackFileOpen();
    static VuAssetFactory* mpInterface;
#endif
};


