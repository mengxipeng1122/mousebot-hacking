
#pragma once



#ifdef _GHIDRA
struct VuArray {
    void* data;
    size_t size;
    size_t capacity;
};
#else
template<typename T>
struct VuArray {
    T* data;
    size_t size;
    size_t capacity;
};
#endif

struct VuJsonContainer {
    unsigned char _x00[0x20];
#ifndef _GHIDRA
    VuJsonContainer();
    ~VuJsonContainer();
#endif
};

struct VuJsonBinaryReader {
    unsigned char _x00[0x30];
#ifndef _GHIDRA
    VuJsonBinaryReader();
    bool loadFromMemory(VuJsonContainer&, void const*, int);
#endif
};

struct VuJsonWriter {
    unsigned char _x00[0x20];
#ifndef _GHIDRA
    VuJsonWriter();
    void saveToString(VuJsonContainer const&, std::string&);
#endif
};

struct VuAssetFactory {
#ifndef _GHIDRA
    static VuAssetFactory* mpInterface;
#endif
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
#ifdef _GHIDRA
    struct {unsigned char _x00[0x8];} mFileMap;
#else 
    std::map<std::string, VuAssetFileInfo> mFileMap;
#endif
    unsigned char _x28[0x50];
#ifndef _GHIDRA
    bool read(char const*, 
        std::string const&, 
        std::string const&, 
        unsigned int&, 
        unsigned int&, 
        VuArray<unsigned char>&);
#endif
};

struct VuAssetDB {
    unsigned char _x00[0x54];
    VuAssetPackFileReader mPackFileReader;
};

#ifdef _GHIDRA
struct VuAssetFactoryImpl {
    struct VuAssetFactory base;
};
#else
struct VuAssetFactoryImpl : public VuAssetFactory {
    int getAssetDBCount();
    std::string& getAssetDBName(int);
    VuAssetDB& getAssetDB(std::string const&);
};
#endif

struct VuTextureData {
    unsigned char _x00[0xc];
    unsigned int mTotalLevel;
#ifdef _GHIDRA
    struct {unsigned char _x00[0x0c];} mData;
#else
    VuArray<unsigned char> mData;
    unsigned char* getLevelData(int);
    unsigned int getLevelHeight(int);
    unsigned int getLevelWidth(int);
    unsigned int getLevelPitch(int);
    size_t getLevelSize(int);
#endif
};

struct VuOglesTexture {
    unsigned char _x00[0x1c];
    unsigned int mGlFormat;
    unsigned char _x20[0x20];
    VuTextureData mTextureData;
#ifndef _GHIDRA
    ~VuOglesTexture();
#endif
};

struct VuBinaryDataReader {
    unsigned char* data;
    size_t size;
    size_t offset;
#ifndef _GHIDRA
    VuBinaryDataReader() : data(NULL), size(0), offset(0) {}
#endif
};

struct VuTexture {
#ifndef _GHIDRA
   static VuOglesTexture* loadFromMemory(VuBinaryDataReader&);
#endif
};

struct VuVector3{
    float x, y, z;
};

struct VuVector4{
    float x, y, z, w;
};

struct VuMatrix{
    float v[16];
};

struct VuAabbNode{
    unsigned char _x00[0x08];
};

struct VuAabb {
    VuVector4 mMin;
    VuVector4 mMax;
};

struct VuGfxSceneInfo {
    unsigned char _x00[0x30];
};

#ifdef _GHIDRA  
struct VuGfxStaticSceneInfo {
    VuGfxSceneInfo base;
#else 
struct VuGfxStaticSceneInfo : public VuGfxSceneInfo {
#endif
    unsigned char _x00[0x30];
};

struct VuGfxSceneMeshPart {
    unsigned char _x00[0x50];
};

struct VuGfxSceneMesh {
    unsigned char _x00[0x0c];
#ifdef _GHIDRA
    unsigned char mName[0x18];
#else
    std::string mName; 
#endif
#ifdef _GHIDRA
    unsigned char mMeshParts[0x08];
#else
    std::list<VuGfxSceneMeshPart*> mMeshParts;
#endif
    VuAabb mAabb;
};

struct VuGfxSortMesh{

};

struct VuVertexBuffer {
    unsigned char _x00[0x0c];
    unsigned int size;
    unsigned int gl_buffer_id;
    unsigned int gl_format;
    unsigned char* pBuffer;
};
struct VuIndexBuffer {
    unsigned char _x00[0x0c];
    unsigned int size;
    unsigned int gl_buffer_id;
    unsigned int gl_format;
    unsigned char* pBuffer;
};

struct VuGfxSceneChunk {
    unsigned char _x00[0x10];
    VuVertexBuffer* mpVertexBuffer;
    VuIndexBuffer* mpIndexBuffer;
    VuGfxSortMesh* mpSortMesh;
};

struct VuShaderProgram {
    unsigned char _x00[0x40];
};

struct VuGfxSortMaterial {
    unsigned char _x00[0x760];
};


struct VuGfxSceneShader {
    unsigned char _x00[0x14];
    VuShaderProgram* mpShaderProgram;
    bool _flags[0x8];
    unsigned char _x20[0x4];
    VuGfxSortMaterial* mpSortMaterial[3];
    unsigned char _x30[0x1c];
};

struct VuGfxScene {
    unsigned char *vtable;
    unsigned char _x04[0x08];
#ifdef _GHIDRA
    unsigned char mShader[0x0c];
    unsigned char mMeshes[0x0c];
    unsigned char mChunks[0x0c];
#else
    std::vector<VuGfxSceneShader*> mShader;
    std::vector<VuGfxSceneMesh*> mMeshes;
    std::vector<VuGfxSceneChunk*> mChunks;
#endif
    unsigned char _x30[0x14];
    //~VuGfxScene();
};

struct VuGfxSceneMeshNode {
    unsigned char _x00[0x40];
};


struct VuGfxSceneMeshInfo {

    unsigned char _x00[0x24];
};

struct VuGfxSceneMeshInstance{
    unsigned char _x00[0x10];
    VuGfxSceneMeshInfo* mpMeshInfo;
};

struct VuGfxSceneNode {
    unsigned char _x00[0x0c];
#ifdef _GHIDRA
    unsigned char _x0c[0x18];
#else
    std::string mName;
#endif
    VuMatrix mTransform;
    VuGfxSceneMeshInstance* mpMeshInstance;
#ifdef _GHIDRA
    unsigned char mChildren[0x8];
#else 
    std::list<VuGfxSceneNode*> mChildren;
#endif
    unsigned char _x70[0x20];
};

#ifdef _GHIDRA
struct VuGfxStaticScene {
    VuGfxScene base;
    unsigned char mNodes[0x08];
#else 
struct VuGfxStaticScene : public VuGfxScene {
    std::list<VuGfxSceneNode*> mNodes;
#endif
    VuGfxStaticSceneInfo mStaticSceneInfo;
    //~VuGfxStaticScene();
};

struct VuStaticModelAsset {
    unsigned char _x00[0x54];
    VuGfxStaticScene* mScene;
#ifdef _GHIDRA
#else
    bool load(VuBinaryDataReader&);
    void unload();
    ~VuStaticModelAsset();
#endif
};

VuStaticModelAsset* CreateVuStaticModelAsset();
