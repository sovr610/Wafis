
@echo off
setlocal

set OPTIMIZE=-Os
set LDFLAGS=%OPTIMIZE%
set CFLAGS=%OPTIMIZE%
set CPPFLAGS=%OPTIMIZE%

call %*

echo =============================================
echo Compiling libvpx
echo =============================================
if not defined SKIP_LIBVPX (
    if exist lib rmdir /s /q lib
    mkdir lib
    cd lib
    call emconfigure ../../../node_modules/libvpx/configure --target=generic-gnu
    call emmake make
    cd ..
)
echo =============================================
echo Compiling libvpx done
echo =============================================

echo =============================================
echo Compiling wasm bindings
echo =============================================
rem Compile C/C++ code
call emcc %OPTIMIZE% --bind -s STRICT=1 -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=0 -s MALLOC=emmalloc -s MODULARIZE=1 -s EXPORT_ES6=1 -o ./main.js -I ./node_modules/libvpx src/main.cpp lib/libvpx.a

rem Create output folder
if not exist dist mkdir dist
rem Move artifacts
move main.js dist
move main.wasm dist

echo =============================================
echo Compiling wasm bindings done
echo =============================================

:end
endlocal

