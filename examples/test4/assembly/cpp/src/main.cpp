
#include "vpxenc.h"
#include <emscripten/bind.h>

using namespace emscripten;

int say_hello() {
  printf("Hello from your wasm module with libvpx %d
", VPX_CODEC_ABI_VERSION);
  return 0;
}


EMSCRIPTEN_BINDINGS(my_module) {
  function("sayHello", &say_hello);
}
