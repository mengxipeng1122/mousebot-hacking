
#include <string>
#include <vector>

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

extern "C" __attribute__((visibility("default"))) int test() {
    LOG_INFOS("test");
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
