
#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CPPFLAGS="${OPTIMIZE}"

eval $@

echo "============================================="
echo "Compiling libvpx"
echo "============================================="
test -n "$SKIP_LIBVPX" || (
  rm -rf lib || true
  mkdir lib
  cd lib
  emconfigure ../../node_modules/libvpx/configure     --target=generic-gnu
  emmake make
)
echo "============================================="
echo "Compiling libvpx done"
echo "============================================="

echo "============================================="
echo "Compiling wasm bindings"
echo "============================================="
(
  # Compile C/C++ code
  emcc     ${OPTIMIZE}     --bind     -s STRICT=1     -s ALLOW_MEMORY_GROWTH=1     -s ASSERTIONS=0     -s MALLOC=emmalloc     -s MODULARIZE=1     -s EXPORT_ES6=1     -o ./cpp.js     -I ./node_modules/libvpx     src/main.cpp     lib/libvpx.a

  # Create output folder
  mkdir -p dist 
  # Move artifacts
  mv main.{js,wasm} dist
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="
