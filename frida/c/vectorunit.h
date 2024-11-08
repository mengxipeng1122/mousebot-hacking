
#pragma once


#ifndef _GHIDRA
template<typename T>
struct VuArray {
    T* pData;
    unsigned int mSize;
    unsigned int mCapacity;

    VuArray() {
        pData = nullptr;
        mSize = 0;
        mCapacity = 0;
    }

    ~VuArray() {
        if (pData) {
            delete[] pData;
            pData = nullptr;
        }
    }
};
#endif


struct VuBinaryDataReader {
    unsigned char* pData;
    unsigned int mSize;
    unsigned int mPos;
};


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

#ifdef _GHIDRA
#else 
    bool read( std::string const& type_str, 
        std::string const& name_str, 
        std::string const& lang_str, 
        VuArray<unsigned char>& data, 
        unsigned int& hash, unsigned short& type);

#endif
};

struct VuAssetDB {
    unsigned char _0x00[0x70];
    VuAssetPackFileReader basePackFileReader;
    VuAssetPackFileReader subPackFileReader;
};

struct VuAsset {
};

struct VuAssetFactory {
    unsigned char _0x00[0x68];
    VuAssetDB* mpAssetDB;
#ifdef _GHIDRA    
#else 
    bool isPackFileOpen();
    VuAsset* createAsset(std::string const& type_str, std::string const& name_str, int type);
    static VuAssetFactory* mpInterface;
#endif
};

struct VuOglesTexture {
#ifndef _GHIDRA
    static int load(VuBinaryDataReader& reader, int type);
#endif
};

// _ZN18VuBakedProjectData11deserializeER18VuBinaryDataReader
// VuBakedProjectData::deserialize(VuBinaryDataReader&)

// _ZN12VuJsonWriter12saveToStringERK15VuJsonContainerj
// VuJsonWriter::saveToString(VuJsonContainer const&, int)


