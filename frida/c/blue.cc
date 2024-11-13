
#include <string>
#include <vector>
#include <map>

extern "C" void _frida_log(const char* str);
extern "C" void _frida_hexdump(void* p, size_t len);

#define LOG_INFOS(fmt, ...) do{ \
    char buf[1024*8]; \
    snprintf(buf, sizeof(buf), "[%s:%d] " fmt, __FILE__, __LINE__, ##__VA_ARGS__); \
    _frida_log(buf); \
}while(0)

template<typename T>
struct VuArray {
    T* data;
    size_t size;
    size_t capacity;
};

struct VuJsonContainer {
    unsigned char _x00[0x20];
    VuJsonContainer();
    ~VuJsonContainer();
};

struct VuJsonBinaryReader {
    VuJsonBinaryReader();
    unsigned char _x00[0x30];
    bool loadFromMemory(VuJsonContainer&, void const*, int);
};

struct VuJsonWriter {
    unsigned char _x00[0x20];
    VuJsonWriter();
    void saveToString(VuJsonContainer const&, std::string&);
};

struct VuAssetFactory {
    static VuAssetFactory* mpInterface;
};

struct VuAssetFileInfo {
    unsigned char* mData;
    unsigned char _x04[0x14];
    unsigned char* ms0;
    unsigned char* ms1;
    unsigned char _x20[0x0c];
    unsigned int  size;
    unsigned char _x30[0x04];
    unsigned int  crc;
    unsigned char _x3c[0x04];

};

struct VuAssetPackFileReader {
    unsigned char _x00[0x20];
    std::map<std::string, VuAssetFileInfo> mFileMap;
    unsigned char _x28[0x50];
    bool read(char const*, 
        std::string const&, 
        std::string const&, 
        unsigned int&, 
        unsigned int&, 
        VuArray<unsigned char>&);
};

struct VuAssetDB {
    unsigned char _x00[0x54];
    VuAssetPackFileReader mPackFileReader;
};

struct VuAssetFactoryImpl : public VuAssetFactory {
    int getAssetDBCount();
    std::string& getAssetDBName(int);
    VuAssetDB& getAssetDB(std::string const&);
};

struct VuTextureData {
    unsigned char _x00[0xc];
    unsigned int mTotalLevel;
    VuArray<unsigned char> mData;
    unsigned char* getLevelData(int);
    unsigned int getLevelHeight(int);
    unsigned int getLevelWidth(int);
    unsigned int getLevelPitch(int);
    size_t getLevelSize(int);
};

struct VuOglesTexture {
    unsigned char _x00[0x1c];
    unsigned int mGlFormat;
    unsigned char _x20[0x20];
    VuTextureData mTextureData;
    ~VuOglesTexture();
};

struct VuBinaryDataReader {
    unsigned char* data;
    size_t size;
    size_t offset;
    VuBinaryDataReader() : data(NULL), size(0), offset(0) {}
};

struct VuTexture {
   static VuOglesTexture* loadFromMemory(VuBinaryDataReader&);
};


int listAllAssets()
{
    VuAssetFactory* factory = VuAssetFactory::mpInterface;
    LOG_INFOS("listAllAssets %p", factory);
    VuAssetFactoryImpl* impl = (VuAssetFactoryImpl*)factory;
    int count = impl->getAssetDBCount();
    LOG_INFOS("count: %d", count);
    for(int i=0; i<count; i++){
        std::string name = impl->getAssetDBName(i);
        LOG_INFOS("name: %s", name.c_str());
        VuAssetDB& db = impl->getAssetDB(name);
        LOG_INFOS("db: %p", &db);
        VuAssetPackFileReader& pack = db.mPackFileReader;
        LOG_INFOS("pack: %p", &pack);
        std::map<std::string, VuAssetFileInfo>& fileMap = pack.mFileMap;
        LOG_INFOS("fileMap: %p", &fileMap);
        LOG_INFOS("fileMap size: %zu", fileMap.size());
        for(std::map<std::string, VuAssetFileInfo>::iterator it = fileMap.begin(); it != fileMap.end(); ++it){
            std::string key = it->first;
            VuAssetFileInfo& value = it->second;
            LOG_INFOS("file: %s, value: %p", key.c_str(), &value);
            //_frida_hexdump(&value, sizeof(VuAssetFileInfo));
        }
    }
    return 0;
}

extern "C" __attribute__((visibility("default"))) int init() {
    LOG_INFOS("init");
    LOG_INFOS("Hello from frida c");
    LOG_INFOS("init end");
    return 0;
}

extern "C" __attribute__((visibility("default"))) void parse_std_string(
    const std::string& str,
    void (*cb)(const char*)
) {
    cb(str.c_str());
}

extern "C" __attribute__((visibility("default"))) void parse_vu_array_unsigned_char(
    const VuArray<unsigned char>& arr,
    void (*cb)(const unsigned char*, size_t)
) {
    const unsigned char* p = arr.data;
    size_t len = arr.size;
    cb(p, len);
}

extern "C" __attribute__((visibility("default"))) void parse_binary_json(
    const unsigned char* p,
    size_t len
) {
    VuJsonBinaryReader reader;
    VuJsonContainer container;
    bool ret = reader.loadFromMemory(container, p, len);
    if(ret){
        std::string str;
        VuJsonWriter writer;
        writer.saveToString(container, str);
        LOG_INFOS("str: %s", str.c_str());
    }
}

int find_asset(
    const char* asset_name, 
    void (*cb)(unsigned char* pData, int size, void* user_data),
    void* user_data
) {

    std::string asset_name_str(asset_name);

    std::string type_name(asset_name_str.substr(0, asset_name_str.find('/')));
    std::string file_name(asset_name_str.substr(asset_name_str.find('/') + 1));
    std::string lang("");

    VuAssetFactory* vuAssetFactory = VuAssetFactory::mpInterface;
    if(vuAssetFactory == NULL) {
        LOG_INFOS("vuAssetFactory is nullptr");
        return -1;
    }

    VuAssetFactoryImpl* impl = (VuAssetFactoryImpl*)vuAssetFactory;

    std::string name = impl->getAssetDBName(0);
    VuAssetDB& db = impl->getAssetDB(name);

    VuArray<unsigned char> arr;
    arr.data = NULL;
    arr.size = 0;
    arr.capacity = 0;
    unsigned int hash;
    unsigned int type;
    bool success = db.mPackFileReader.read(
        type_name.c_str(), 
        file_name,
        lang,
        hash, type, arr);
    if (!success) {
        LOG_INFOS("read failed: %s, %s", type_name.c_str(), file_name.c_str());
        return -1;
    }
    LOG_INFOS("data: %p %zu bytes", arr.data, arr.size);
    cb(arr.data, arr.size, user_data);
    if(arr.data != NULL) {
        free(arr.data);
        arr.data = NULL;
    }
    return 0;
}

void _get_asset_binary_cb(unsigned char* pData, int size, void* user_data) {
    void (*cb)(unsigned char* pData, int size) = (void (*)(unsigned char* pData, int size))user_data;
    cb(pData, size);
}

extern "C" __attribute__((visibility("default")))
int get_asset_binary(
    const char* asset_name, 
    void (*cb)(unsigned char* pData, int size)
    ) {
    return find_asset(asset_name, _get_asset_binary_cb, (void*)cb);
}

void _get_asset_json_cb(unsigned char* pData, int size, void* user_data) {
    LOG_INFOS("data: %p %zu bytes", pData, size);

    // read json binary size 
    size_t json_binary_size = *(size_t*)&pData[0];
    if(json_binary_size > size || json_binary_size == 0){
        LOG_INFOS("json_binary_size is invalid: %zu", json_binary_size);
        return;
    }

    if(memcmp(&pData[4], "VUJB", 4) != 0){
        LOG_INFOS("json_binary is not valid");
        return; 
    }

    const unsigned char* json_binary = &pData[4];
    LOG_INFOS("json_binary: %p %zu bytes", json_binary, json_binary_size);

    VuJsonBinaryReader reader;
    VuJsonContainer container;
    bool read_json_ok = reader.loadFromMemory(container, json_binary, json_binary_size);
    if(!read_json_ok){
        LOG_INFOS("read json failed");
        return ;
    }

    std::string str;
    VuJsonWriter writer;
    writer.saveToString(container, str);
    void (*cb)(const char*) = (void (*)(const char*))user_data;
    cb(str.c_str());
}

extern "C" __attribute__((visibility("default")))
int get_asset_json(
    const char* asset_name, 
    void (*cb)(const char*)
    ) {
    return find_asset(asset_name, _get_asset_json_cb, (void*)cb);
}

void _get_asset_texture_info_cb(unsigned char* pData, int size, void* user_data) {
    LOG_INFOS("data: %p %zu bytes", pData, size);

    VuBinaryDataReader reader;
    reader.data = pData;
    reader.size = size;
    reader.offset = 0;

    VuOglesTexture* texture = VuTexture::loadFromMemory(reader);
    _frida_hexdump((void*)texture, sizeof(VuOglesTexture));

    void (*cb)(int size, int level, int width, int height, int pitch, int gl_format) 
        = (void (*)(int size, int level, int width, int height, int pitch, int gl_format))user_data;
    VuTextureData& data = texture->mTextureData;
    LOG_INFOS("Total level: %d", data.mTotalLevel);
    for(int i=0; i<data.mTotalLevel; i++){
        unsigned int width = data.getLevelWidth(i);
        unsigned int height = data.getLevelHeight(i);
        unsigned int pitch = data.getLevelPitch(i);
        size_t size = data.getLevelSize(i);
        LOG_INFOS("level %d: %zu %d %d %d %zu", i, width, height, pitch, size);
        cb(size, i, width, height, pitch, texture->mGlFormat);
    }
}

extern "C" __attribute__((visibility("default")))
int get_asset_texture_info(
    const char* asset_name, 
    void (*cb)(int size, int level, int width, int height, int pitch, int gl_format)
    ) {
    return find_asset(asset_name, _get_asset_texture_info_cb, (void*)cb);
}

struct _get_asset_texture_binary_cb_data {
    int level;
    void (*cb)(unsigned char* pData, int size);
};

void _get_asset_texture_binary_cb(unsigned char* pData, int size, void* user_data) {
    LOG_INFOS("data: %p %zu bytes", pData, size);
    _get_asset_texture_binary_cb_data* cb_data = (_get_asset_texture_binary_cb_data*)user_data;
    int level = cb_data->level;
    void (*cb)(unsigned char* pData, int size) = cb_data->cb;

    VuBinaryDataReader reader;
    reader.data = pData;
    reader.size = size;
    reader.offset = 0;

    VuOglesTexture* texture = VuTexture::loadFromMemory(reader);
    // _frida_hexdump((void*)texture, sizeof(VuOglesTexture));

    VuTextureData& data = texture->mTextureData;
    LOG_INFOS("Total level: %d", data.mTotalLevel);
    if(level >= data.mTotalLevel){
        LOG_INFOS("level is out of range: %d", level);
        return;
    }
    size_t texture_size = data.getLevelSize(level);
    unsigned char* pTextureData = data.getLevelData(level);
    LOG_INFOS("level %d:  %zu", level,  texture_size);
    cb(pTextureData, texture_size);
}

extern "C" __attribute__((visibility("default")))
int get_asset_texture_binary (
    const char* asset_name,
    int level,
    void (*cb)(unsigned char* pData, int size)
    ) {
    _get_asset_texture_binary_cb_data data;
    data.level = level;
    data.cb = cb;
    return find_asset(asset_name, _get_asset_texture_binary_cb, (void*)&data);
}

void _get_asset_compiled_shader_cb(unsigned char* pData, int size, void* user_data) {
    void (*cb)(const char*, const char*) = (void (*)(const char*, const char*))user_data;
    LOG_INFOS("data: %p %zu bytes", pData, size);
    const char* vertex_shader = (const char*)pData;
    int vertex_shader_size = strlen(vertex_shader);
    const char* fragment_shader = (const char*)pData + vertex_shader_size + 1;
    cb(vertex_shader, fragment_shader);
}

extern "C" __attribute__((visibility("default")))
int get_asset_compiled_shader(
    const char* asset_name, 
    void (*cb)(const char*, const char*)
    ) {
    return find_asset(asset_name, _get_asset_compiled_shader_cb, (void*)cb);
}


extern "C" __attribute__((visibility("default")))
int get_asset_list (
    void (*cb)(const char* name)
){
    VuAssetFactory* factory = VuAssetFactory::mpInterface;
    VuAssetFactoryImpl* impl = (VuAssetFactoryImpl*)factory;
    int count = impl->getAssetDBCount();
    for(int i=0; i<count; i++){
        std::string name = impl->getAssetDBName(i);
        VuAssetDB& db = impl->getAssetDB(name);
        VuAssetPackFileReader& pack = db.mPackFileReader;
        std::map<std::string, VuAssetFileInfo>& fileMap = pack.mFileMap;
        for(std::map<std::string, VuAssetFileInfo>::iterator it = fileMap.begin(); it != fileMap.end(); ++it){
            std::string key = it->first;
            cb(key.c_str());
            VuAssetFileInfo& value = it->second;
            _frida_hexdump(&value, sizeof(VuAssetFileInfo));
            LOG_INFOS("mData: %p", value.mData);
            LOG_INFOS("ms0: %p", value.ms0);
            LOG_INFOS("ms1: %p", value.ms1);
            LOG_INFOS("size: %u", value.size);
            LOG_INFOS("crc: %u", value.crc);
            // _frida_hexdump(value.ms0, 0x20);
            // _frida_hexdump(value.ms1, 0x20);
            // _frida_hexdump(value.mData, 0x20);
        }
    }
    return 0;
}

extern "C" __attribute__((visibility("default")))
int read_asset_data(
    void (*cb)(const char* )
) {


    std::string type_name("Assets");
    std::string file_name("AssetData");
    std::string lang("");

    VuAssetFactory* vuAssetFactory = VuAssetFactory::mpInterface;
    if(vuAssetFactory == NULL) {
        LOG_INFOS("vuAssetFactory is nullptr");
        return -1;
    }

    VuAssetFactoryImpl* impl = (VuAssetFactoryImpl*)vuAssetFactory;

    std::string name = impl->getAssetDBName(0);
    VuAssetDB& db = impl->getAssetDB(name);

    VuArray<unsigned char> arr;
    arr.data = NULL;
    arr.size = 0;
    arr.capacity = 0;
    unsigned int hash;
    unsigned int type;
    bool success = db.mPackFileReader.read(
        type_name.c_str(), 
        file_name,
        lang,
        hash, type, arr);
    if (!success) {
        LOG_INFOS("read failed: %s, %s", type_name.c_str(), file_name.c_str());
        return -1;
    }
    LOG_INFOS("data: %p %zu bytes", arr.data, arr.size);
    _frida_hexdump(arr.data, 0x20);
    VuJsonBinaryReader reader;
    VuJsonContainer container;
    bool ret = reader.loadFromMemory(container, arr.data, arr.size);
    if(ret){
        std::string str;
        VuJsonWriter writer;
        writer.saveToString(container, str);
        cb(str.c_str());
    }
    if(arr.data != NULL) {
        free(arr.data);
        arr.data = NULL;
    }
    return 0;
}
