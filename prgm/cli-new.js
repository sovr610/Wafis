var pjson = require('../package.json');
var os = require('os');
const http = require('https');

const arg = require('arg');
const fs = require('fs');
const shell = require('shelljs');
const appData = require('appdata-path');
const cssFunc = require('./css');
const {
    exec
} = require('child_process');

const babelTemplate = {
    "plugins": [
        ["@babel/plugin-transform-react-jsx", {
            "pragma": "MiniFramework.createElement", // default pragma is React.createElement
            "throwIfNamespace": false // defaults to true
        }]
    ]
}

const cppSrc = `
#include "vpxenc.h"
#include <emscripten/bind.h>

using namespace emscripten;

int say_hello() {
  printf("Hello from your wasm module with libvpx %d\n", VPX_CODEC_ABI_VERSION);
  return 0;
}


EMSCRIPTEN_BINDINGS(my_module) {
  function("sayHello", &say_hello);
}
`

const cppWebassemblyHtml = `
<script type="module">
import wasmModule from "./my-module.js";

const instance = wasmModule({
  onRuntimeInitialized() {
    instance.sayHello();
  }
});
</script>
`

const buildScript = `
#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="\${OPTIMIZE}"
export CFLAGS="\${OPTIMIZE}"
export CPPFLAGS="\${OPTIMIZE}"

eval $@

echo "============================================="
echo "Compiling libvpx"
echo "============================================="
test -n "$SKIP_LIBVPX" || (
  rm -rf build-vpx || true
  mkdir build-vpx
  cd build-vpx
  emconfigure ../node_modules/libvpx/configure \
    --target=generic-gnu
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
  emcc \
    \${OPTIMIZE} \
    --bind \
    -s STRICT=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ASSERTIONS=0 \
    -s MALLOC=emmalloc \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -o ./my-module.js \
    -I ./node_modules/libvpx \
    my-module.cpp \
    build-vpx/libvpx.a

  # Create output folder
  mkdir -p dist 
  # Move artifacts
  mv my-module.{js,wasm} dist
)
echo "============================================="
echo "Compiling wasm bindings done"
echo "============================================="
`

const cssStyle = cssFunc.getCssTemp();
//const cssStyle = ' ';
const frameworkTemplate = `
interface FrameworkEl extends JSX.Element {
    tag: any;
  }
  
  const MiniFramework = {
    createElement: (
      tag: JSX.Element,
      props: any,
      ...children: any[]
    ): FrameworkEl => {
      const element = {
        tag,
        type: tag.type,
        key: tag.key,
        props: { ...props, children },
      };

      console.log('element: ', element);

      return element;
    },
  };
  
  const render = (frameworkEl: FrameworkEl, container: Element | null) => {
    if (["string", "number"].includes(typeof frameworkEl)) {
      container?.appendChild(document.createTextNode(frameworkEl?.toString()));
      return;
    }
  
    const actualDOMElement = document.createElement(frameworkEl.tag);
  
    // Apply Props to actual DOM Element
    Object.keys(frameworkEl?.props)
      .filter((key) => key !== "children")
      .forEach((property) => {
        if(frameworkEl.tag == 'div') {
            console.log('div: ', frameworkEl.prop);
        }
        actualDOMElement[property] = frameworkEl.props[property];
      });
  
    // Render children inside this element
    frameworkEl?.props?.children.forEach((child: FrameworkEl) => {
      render(child, actualDOMElement);
    });
    
    container?.appendChild(actualDOMElement); // Happens once, unless the DOM already exists and we just need to replace something on the child element.
  };
  
  const myMarkup = () => {
    return (
        <div data-x="data attribute test">

        </div>
    
    );
  };
  
  render(myMarkup() as FrameworkEl, document.querySelector("#app"));
`

const preApp = `
const myMarkup = () => {
    return (
        <meta name="description" content="">
        <meta name="og:locale" content="">
        <meta name="og:type" content="website">
        <meta name="description" content="wafis website template">
        <meta name="robots" content="follow, index">

        <meta name="twitter:title" content="">
        <meta name="twitter:description" content="">
        <meta name="twitter:image" content="">
        <meta name="twitter:site" content="@siteusername">
        <meta name="twitter:creator" content="@username">

        <meta name="og:image" content="">
        <meta name="og:site_name" content="">
        <link rel="canonical" href="">

        <link rel="icon" type="image/x-icon" href="favicon.ico">
    )};


`

const indexHTML = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Wafis template</title>
        <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
        <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css" />
        <link href="https://fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic" rel="stylesheet" type="text/css" />
        <link rel="stylesheet" href="./style.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">
    </head>
    <body id="page-top" style="background-image: url('https://sovr610.github.io/resources/img/2F5X8JT.jpg')">
    <header class="masthead bg-primary text-white text-center">
    <div class="container d-flex align-items-center flex-column">
        <!-- Masthead Avatar Image-->
        <!--<img class="masthead-avatar mb-5" src="assets/img/avataaars.svg" alt="..." />-->

        <img src="./assets/2F5X8JT.jpg" style="width: 400px; height:300px;">
        <!-- Masthead Heading-->
        <h1 class="masthead-heading text-uppercase mb-0">Wafis Web Framework</h1>
        <!-- Icon Divider-->
        <div class="divider-custom divider-light">
            <div class="divider-custom-line"></div>
            <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
            <div class="divider-custom-line"></div>
        </div>
        <!-- Masthead Subheading-->
        <p class="masthead-subheading font-weight-light mb-0">JSX Framework  with webassembly on top!</p>
    </div>
    </header>
    <section class="page-section portfolio" id="portfolio">
            <div class="container">
                <!-- Portfolio Section Heading-->
                <h2 class="page-section-heading text-center text-uppercase text-secondary mb-0">Info & Links</h2>
                <!-- Icon Divider-->
                <div class="divider-custom">
                    <div class="divider-custom-line"></div>
                    <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
                    <div class="divider-custom-line"></div>
                </div>
                <!-- Portfolio Grid Items-->
                <div class="row justify-content-center">
                    <!-- Portfolio Item 1-->
                    <div class="col-md-6 col-lg-4 mb-5">
                        <a href="https://www.npmjs.com/package/wafis-cli">
                            <div class="portfolio-item mx-auto" data-bs-toggle="modal" data-bs-target="#portfolioModal1">
                                <h4 class="text-center">npm page</h4>
                                <img class="img-fluid" src="https://sovr610.github.io/resources/img/npm-logo-01B8642EDD-seeklogo.com.png" alt="" />-->
                            </div>
                        </a>
                    </div>
                    <!-- Portfolio Item 2-->
                    <div class="col-md-6 col-lg-4 mb-5">
                        <a href="https://github.com/sovr610/Wafis">
                            <div class="portfolio-item mx-auto">
                                <h4 class="text-center">GitHub Repository</h4>
                                <img class="img-fluid" src="https://sovr610.github.io/resources/img/GitHub-logo.png" alt="" />-->
                            </div>
                        </a>
                    </div>
                    <!-- Portfolio Item 3-->
                    <div class="col-md-6 col-lg-4 mb-5">
                        <div class="">

                            <h5>Commands</h5>
                            <details class="text">
                                <summary>Create projects</summary>
                                <code>wafis new project --nname "project_name"</code>
                            </details>
                            <details class="text">
                                <summary>Add component</summary>
                                <code>wafis new component --name "comp_name"</code>
                            </details>
                            <details class="text">
                                <summary>Add Service</summary>
                                <code>wafis new service --name "serv_name"</code>
                            </details>
                            <details class="text">
                                <summary>Add Wasm module</summary>
                                <code>wafis new wasm --name "wasm_name" --type "cpp"</code>
                            </details>
                            <details class="text">
                                <summary>Build your project</summary>
                                <code>wafis build --verbose --release</code>
                            </details>
                            <!--<img class="img-fluid" src="" alt="..." />-->
                        </div>
                    </div>
                    <!-- Portfolio Item 4-->
                    <div class="col-md-6 col-lg-4 mb-5 mb-lg-0">
                        <div class="portfolio-item mx-auto" data-bs-toggle="modal" data-bs-target="#portfolioModal4">
                            <div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100">
                                <div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div>
                            </div>
                            <!--<img class="img-fluid" src="" alt="" />-->
                        </div>
                    </div>
                    <!-- Portfolio Item 5-->
                    <div class="col-md-6 col-lg-4 mb-5 mb-md-0">
                        <div class="portfolio-item mx-auto" data-bs-toggle="modal" data-bs-target="#portfolioModal5">
                            <div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100">
                                <div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div>
                            </div>
                            <!--<img class="img-fluid" src="" alt="" />-->
                        </div>
                    </div>
                    <!-- Portfolio Item 6-->
                    <div class="col-md-6 col-lg-4">
                        <div class="portfolio-item mx-auto" data-bs-toggle="modal" data-bs-target="#portfolioModal6">
                            <div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100">
                                <div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div>
                            </div>
                            <!--<img class="img-fluid" src="" alt="" />-->
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/js/bootstrap.min.js" integrity="sha384-ODmDIVzN+pFdexxHEHFBQH3/9/vQ9uori45z4JjnFsRydbmQbmL5t1tQ0culUzyK" crossorigin="anonymous"></script>
        <script src="./src/index.tsx"></script>
    </body>
</html>
`

const packageJsonTemplate = {
    "name": null,
    "version": "1.0.0",
    "description": "assemble project template",
    "scripts": {
        "install": "napa",
        "test": "node tests",
        "pack": "npx parcel ./index.html",
        "start": "npx serve .",
        "rust:build": "wasm-pack build rust/ --out-dir distDev/webassembly --debug",
        "rust:buildFinal": "wasm-pack build rust/ --out-dir dist/webassembly --release",
        "cpp:build": "emcc --bind -O3 src/cpp/main.cpp"
    },
    "engines": {
        "node": ">=16.0.0"
    },
    "napa": {
        "libvpx": "git+https://github.com/webmproject/libvpx"
    },
    "keywords": [
        "assemble",
        "webassembly"
    ],
    "author": "",
    "license": ""
}

function parseHtmlIndexReplace(key, addon) {
    var html = fs.readFileSync('./index.html', {
        encoding: 'utf-8',
        flag: 'r'
    });
    var newHtml = null;
    html.split(/\r?\n/).forEach((line, ind) => {
        if (line.includes(key)) {
            newHtml = newHtml + addon;
        } else {
            if (line != null) {
                newHtml = newHtml + line;
            }
        }
    });
}

function parseHtmlIndexAddAbove(key, addon) {
    var html = fs.readFileSync('./index.html', {
        encoding: 'utf-8',
        flag: 'r'
    });
    var newHtml = null;
    html.split(/\r?\n/).forEach((line, ind) => {
        if (line.includes(key)) {
            newHtml = newHtml + addon + line;
        } else {
            if (line != null) {
                newHtml = newHtml + line;
            }
        }
    });
}

export function wafis(args) {

    var argcc = args.slice(2);
    var hasNew = false;
    var hasComponent = false;
    var hasProject = false;
    var hasService = false;
    var hasWasm = false;
    var hasBuild = false;
    var hasInstall = false;


    for (let i = 0; i <= argcc.length; i++) {
        let itm = argcc[i];

        if (itm !== null && itm !== undefined) {
            if (itm == 'new') {
                hasNew = true;
            }

            if (itm == 'component') {
                hasComponent = true;
            }

            if (itm == 'project') {
                hasProject = true;
            }

            if (itm == 'service') {
                hasService = true;
            }

            if (itm == 'wasm') {
                hasWasm = true;
            }

            if (itm == 'build') {
                hasBuild = true;
            }

            if(itm == 'install') {
                hasInstall = true;
            }
        }
    }

    var argObj = {
        new: hasNew,
        project: hasProject,
        component: hasComponent,
        service: hasService,
        wasm: hasWasm,
        build: hasBuild,
        install: hasInstall
    }

    function parseArgs(rawArgs) {
        const args = arg({
            "--name": String,
            "--debug": Boolean,
            "--release": Boolean,
            "--dir": String,
            "--help": Boolean,
            "--version": Boolean,
            "--verbose": Boolean,
            "--type": String,
            "-t": "--type",
            "-h": "--help",
            "-db": "--debug",
            "-d": "--dir",
            "-n": "--name",
            "-r": "--release",
            "-v": "--version",
            "-vb": "--verbose"
        }, {
            argv: rawArgs.slice(2)
        });
        return {
            name: args['--name'] || null,
            debug: args['--debug'] || true,
            release: args['--release'] || false,
            dir: args['--dir'] || './',
            help: args['--help'] || false,
            version: args["--version"] || false,
            verbose: args["--verbose"] || false,
            type: args["--type"] || false,

        }
    }

    const argc = parseArgs(args);



    if (argObj.new == true) {
        if (argObj.project && (!argc.help)) {
            createProject(argc.name, argc.dir);

        }

        if (argObj.component && (!argc.help)) {
            createComponent(argc.name);
            console.log('\x1b[32m', argc.name + ' component created!')
            console.log('\x1b[37m')
        }

        if (argObj.service && (!argc.help)) {
            console.log('services are not implemented yet');
        }

        if (argObj.wasm && (!argc.help)) {
            console.log('adding wasm modules are not implemented yet');
        }

        if (argObj.new && argc.help && !argObj.build && !argObj.component && !argObj.project && !argObj.service && !argObj.wasm) {
            console.log('----------------------------------------------------------------')
            console.log('\x1b[31m', 'wafis new <commmand> [options...]', '\x1b[37m');
            console.log('  <command> -> project, component, service, wasm');
            console.log('');
            console.log('  OPTIONS: ');
            console.log('    -db/--debug: build project in debug mode');
            console.log('    -vb/--verbose: print out additional details during build');
            console.log('    -r/--release: build project in release mode');
            console.log('    -t/--type: add wasm type to either c++ or rust');
            console.log('----------------------------------------------------------------')
        }

        if ((argObj.new && argObj.project && argc.help) || (argObj.project && argc.help)) {
            console.log('----------------------------------------------------------------')
            console.log('\x1b[31m', 'wafis new project [options...]', '\x1b[37m');
            console.log('');
            console.log('');
            console.log('  OPTIONS: ');
            console.log('    -n/--name: name of the project');
            console.log('    -d/--dir: directory location for project folder, default \'./\'');
            console.log('');
            console.log('----------------------------------------------------------------')
        }

        if ((argObj.new && argObj.component && argc.help) || (argObj.component && argc.help)) {
            console.log('----------------------------------------------------------------')
            console.log('\x1b[31m', 'wafis new component [options...]', '\x1b[37m');
            console.log('');
            console.log('');
            console.log('  OPTIONS: ');
            console.log('    -n/--name: The name of the component');
            console.log('----------------------------------------------------------------')
        }

        if ((argObj.new && argObj.service && argc.help) || (argObj.service && argc.help)) {
            console.log('----------------------------------------------------------------')
            console.log('\x1b[31m', 'wafis new service [options...]', '\x1b[37m');
            console.log('');
            console.log('');
            console.log('  OPTIONS: ');
            console.log('    -n/--name: The name of the component');
            console.log('----------------------------------------------------------------')
        }

        if ((argObj.new && argObj.wasm && argc.help) || (argObj.wasm && argc.help)) {
            console.log('----------------------------------------------------------------')
            console.log('\x1b[31m', 'wafis new wasm [options...]', '\x1b[37m');
            console.log('');
            console.log('');
            console.log('  OPTIONS: ');
            console.log('    -n/--name: The name of the component');
            console.log('    -t/--type: have the wasm module based in \'cpp\' or \'rust\'');
            console.log('----------------------------------------------------------------')
        }

        if ((argObj.new && argObj.install && argc.help) || (argObj.install && argc.help)) {
            console.log('----------------------------------------------------------------')
            console.log('\x1b[31m', 'wafis install [options...]', '\x1b[37m');
            console.log('');
            console.log('');
            console.log('  OPTIONS: ');
            console.log('    -t/--type: have the wasm module based in \'cpp\', \'rust\' or \'both\'');
            console.log('----------------------------------------------------------------')
        }

        if (argc.help && !argObj.build && !argObj.component && !argObj.project && !argObj.service && !argObj.wasm) {
            console.log('\x1b[35m', 'new -> ', '\x1b[37m', 'used for creating a new project, component, service and/or wasm module');
            console.log('\x1b[35m', 'project -> ', '\x1b[37m', 'Creates a starting default wafis project. \'new\' is needed also to run this command');
            console.log('\x1b[35m', 'component -> ', '\x1b[37m', 'used for creating a new component in your wafis project. \'new\' is needed also to run this command');
            console.log('\x1b[35m', 'service -> ', '\x1b[37m', 'used for creating a new service for communicating to back-end servers. \'new\' is needed also to run this command');
            console.log('\x1b[35m', 'wasm -> ', '\x1b[37m', 'used for creating a new wasm module either in C++ or rust to add to your wafis project. \'new\' is needed also to run this command');
            console.log('\x1b[35m', 'build -> ', '\x1b[37m', 'used to build your project. This has various arguments, to set to debug or release');
            console.log('');
            console.log(' *For more info on each command run: ', '\x1b[31m', 'wafis <command> [ -h | --help ]');


            console.log('\x1b[37m')
        }
    } else {
        if (argObj.install) {
            if(argc.type == 'cpp'){
                install(false, true);
            }

            if(argc.type == 'rust'){
                install(true, false);
            }

            if(argc.type == 'both'){
                install(true, true);
            }
        } else {
            if (argc.version) {

                var osValue = process.platform;
                var osName = null;
                if (osValue == 'darwin') {
                    osName = "Mac OS";
                } else if (osValue == 'win32') {
                    osName = "Window OS";
                } else if (osValue == 'android') {
                    osName = "Android OS";
                } else if (osValue == 'linux') {
                    osName = "Linux OS";
                } else {
                    osName = "Unknown OS";
                }

                console.log('Wafis cli version: ' + pjson.version);
                console.log('Node: ' + process.version);
                console.log('OS: ' + osValue + ' (' + osName + ')');
                console.log('OS version: ' + os.release());
                console.log('OS arch: ' + os.arch());
            } else {
                if (argObj.build && !argc.help) {
                    if (argc.release == true) {
                        argc.debug = false;
                    }
                    buildProject(argc.debug, argc.verbose);
                }

                if (argObj.build && argc.help) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis build [options...]', '\x1b[37m');
                    console.log('');
                    console.log('  OPTIONS: ')
                    console.log('    -db/--debug: build project in debug mode');
                    console.log('    -vb/--verbose: print out additional details during build');
                    console.log('    -r/--release: build project in release mode');
                    console.log('----------------------------------------------------------------')
                }

                if (argObj.new && argc.help) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis new <commmand> [options...]', '\x1b[37m');
                    console.log('  <command> -> project, component, service, wasm');
                    console.log('');
                    console.log('  OPTIONS: ');
                    console.log('    -db/--debug: build project in debug mode');
                    console.log('    -vb/--verbose: print out additional details during build');
                    console.log('    -r/--release: build project in release mode');
                    console.log('----------------------------------------------------------------')
                }

                if ((argObj.new && argObj.project && argc.help) || (argObj.project && argc.help)) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis new project [options...]', '\x1b[37m');
                    console.log('');
                    console.log('');
                    console.log('  OPTIONS: ');
                    console.log('    -n/--name: name of the project');
                    console.log('    -d/--dir: directory location for project folder, default \'./\'');
                    console.log('');
                    console.log('----------------------------------------------------------------')
                }

                if ((argObj.new && argObj.component && argc.help) || (argObj.component && argc.help)) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis new component [options...]', '\x1b[37m');
                    console.log('');
                    console.log('');
                    console.log('  OPTIONS: ');
                    console.log('    -n/--name: The name of the component');
                    console.log('----------------------------------------------------------------')
                }

                if ((argObj.new && argObj.service && argc.help) || (argObj.service && argc.help)) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis new service [options...]', '\x1b[37m');
                    console.log('');
                    console.log('');
                    console.log('  OPTIONS: ');
                    console.log('    -n/--name: The name of the component');
                    console.log('----------------------------------------------------------------')
                }

                if ((argObj.new && argObj.wasm && argc.help) || (argObj.wasm && argc.help)) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis new wasm [options...]', '\x1b[37m');
                    console.log('');
                    console.log('');
                    console.log('  OPTIONS: ');
                    console.log('    -n/--name: The name of the component');
                    console.log('    -t/--type: have the wasm module based in \'cpp\' or \'rust\'');
                    console.log('----------------------------------------------------------------')
                }

                if ((argObj.new && argObj.install && argc.help) || (argObj.install && argc.help)) {
                    console.log('----------------------------------------------------------------')
                    console.log('\x1b[31m', 'wafis install [options...]', '\x1b[37m');
                    console.log('');
                    console.log('');
                    console.log('  OPTIONS: ');
                    console.log('    -t/--type: have the wasm module based in \'cpp\', \'rust\' or \'both\'');
                    console.log('----------------------------------------------------------------')
                }

                if (argc.help && !argObj.build && !argObj.component && !argObj.project && !argObj.service && !argObj.wasm) {
                    console.log('\x1b[35m', 'new -> ', '\x1b[37m', 'used for creating a new project, component, service and/or wasm module');
                    console.log('\x1b[35m', 'project -> ', '\x1b[37m', 'Creates a starting default wafis project. \'new\' is needed also to run this command');
                    console.log('\x1b[35m', 'component -> ', '\x1b[37m', 'used for creating a new component in your wafis project. \'new\' is needed also to run this command');
                    console.log('\x1b[35m', 'service -> ', '\x1b[37m', 'used for creating a new service for communicating to back-end servers. \'new\' is needed also to run this command');
                    console.log('\x1b[35m', 'wasm -> ', '\x1b[37m', 'used for creating a new wasm module either in C++ or rust to add to your wafis project. \'new\' is needed also to run this command');
                    console.log('\x1b[35m', 'build -> ', '\x1b[37m', 'used to build your project. This has various arguments, to set to debug or release');
                    console.log('');
                    console.log(' *For more info on each command run: ', '\x1b[31m', 'wafis <command> [ -h | --help ]');


                    console.log('\x1b[37m')
                }
            }
        }
    }
}

export function assemble(args) {
    console.log('wafis-create-project -> create an assemble project');
    console.log('    -n/--name -> the name of the project');
    console.log('    -d/--dir -> where to create the project, directory wise. if not set it will set in current directory');
    console.log('');
    console.log('wafis-add-component -> create a tsx conponent for the assemble project');
    console.log('    -n/--name -> name of the component');
    console.log('');
    console.log('wafis-build -> build the assemble project');
    console.log('    -d/--debug -> build project in debug mode');
    console.log('    -r/--release -> build project in release mode');
}

function install(rust, cpp) {
    function installEMCC() {
        var osValue = process.platform;
        if (osValue == 'win32') {
            console.log('WARNING: this is not as stable, but should still work.');
            let tmp = appData();
            let currentDir = process.cwd();

            shell.cd(tmp);
            shell.exec('git clone https://github.com/emscripten-core/emsdk.git');
            shell.cd('emsdk');
            shell.exec('start emsdk install latest');
            shell.exec('start emsdk activate latest');
            shell.exec('emsdk_env.bat');
            shell.cd(currentDir);

        }

        if (osValue == 'linux') {
            let tmp = shell.tempdir();
            let currentDir = process.cwd();

            if (!shell.which('python3')) {
                shell.exec('sudo apt-get install python3');
            }

            if (!shell.which('git')) {
                shell.exec('sudo apt-get install git');
            }

            if (!shell.which('cmake')) {
                shell.exec('sudo apt-get install cmake');
            }

            shell.cd(tmp);
            shell.exec('git clone https://github.com/emscripten-core/emsdk.git');
            shell.cd('emsdk');
            shell.exec('./emsdk install latest');
            shell.exec('./emsdk activate latest');
            shell.exec('source ./emsdk_env.sh');

            shell.cd(currentDir)
        }
    }

    function installRust() {
        //https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe
        var osValue = process.platform;
        if (osValue == 'win32') {
            console.log('Right now you will need to install rust and web-pack manually for windows, we are working on this!');
            console.log('rust: https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe');
            console.log('web-pack: https://github.com/rustwasm/wasm-pack/releases/download/v0.10.3/wasm-pack-init.exe')
            return;

            let url = "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe";
            //shell.exec('Invoke-WebRequest -URI "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile ".\\rust-install.exe" ')
            exec('Start-BitsTransfer -Source "' + url + '" -Destination rust-install.exe', {
                'shell': 'powershell.exe'
            }, (error, stdout, stderr) => {
                console.log(stdout);
            })
        }

        if (osValue == "linux") {
            if (!shell.which('curl')) {
                shell.exec('sudo apt-get curl');
            }

            shell.exec('curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh');
            shell.exec('curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh');
        }
    }

    if (cpp == true) {
        installEMCC();
    }

    if (rust == true) {
        installRust();
    }

}

function createProject(name, dirarg) {

    if (!shell.which('tsc')) {
        shell.exec('npm i -g typescript');
    }

    var dir = null;
    if (dirarg == undefined) {
        dir = "./";
    } else {
        dir = dirarg;
    }
    fs.mkdirSync(dir + name);
    fs.writeFileSync(dir + name + '/package.json', JSON.stringify(packageJsonTemplate));
    shell.cd(dir);
    shell.cd(name);
    fs.writeFileSync('./style.css', cssStyle);
    shell.exec('npm i --save-dev --silent assemblyscript');
    shell.exec('npx asinit . -y');
    shell.exec('npm i --save-dev --silent @babel/core parcel napa typescript babel-plugin-closure-elimination');
    shell.exec('npm i --silent @babel/plugin-transform-react-jsx');
    shell.exec('tsc --init');
    setTimeout(() => {
        fs.unlinkSync('index.html');
        fs.writeFileSync("index.html", indexHTML);
        fs.writeFileSync('.babelrc', JSON.stringify(babelTemplate));

        fs.mkdirSync('src');
        fs.mkdirSync('./src/components');
        fs.mkdirSync('./assets');



        fs.writeFileSync('./src/index.tsx', frameworkTemplate);
        fs.writeFileSync('./src/components/index.json', JSON.stringify({
            component: []
        }));
        fs.writeFileSync('./assembly/index.js', 'import { add } from "./debug.js";');
        fs.mkdirSync('./assembly/cpp');
        fs.mkdirSync('./assembly/rust');
        fs.mkdirSync('./assembly/cpp/src');
        fs.mkdirSync('./assembly/cpp/dist');
        fs.mkdirSync('./assembly/rust/src');
        fs.mkdirSync('./assembly/rust/dist');

        //import { add } from "./build/debug.js";
        //document.body.innerText = add(1, 2);

        var initHtml = fs.readFileSync('./index.html', {
            encoding: 'utf-8'
        });
        var newerHtml = null;
        initHtml.split(/\r?\n/).forEach((line, ind) => {

            if (!line.includes('import { add } from "./build/debug.js";') && !line.includes('document.body.innerText = add(1, 2);') && !line.includes('import { add } from "./build/release.js";')) {
                if (line != null) {
                    newerHtml = newerHtml + line + '\n';
                }
            } else {
                if (line != null) {
                    newerHtml = newerHtml + line;
                }
            }
        });

        if (newerHtml != null) {
            fs.unlinkSync('./index.html');
            fs.writeFileSync('./index.html', newerHtml);
        }
        newerHtml = null;


        const file = fs.createWriteStream("./assets/2F5X8JT.jpg");
        const request = http.get("https://sovr610.github.io/resources/img/2F5X8JT.jpg", function (response) {
            response.pipe(file);

            // after download completed close filestream
            file.on("finish", () => {
                file.close();
                console.log('\x1b[32m', 'wafis Project created!')
                console.log('\x1b[37m')
            });
        });

    }, 2000);

}

function buildProject(debug, verbose) {
    if (debug) {

        shell.exec('npm run asbuild:debug');

    } else {
        shell.exec('npm run asbuild:release');
    }
    let index = fs.readFileSync('./src/components/index.json', {
        encoding: 'utf-8',
        flag: 'r'
    });
    let json = JSON.parse(index);
    let html = fs.readFileSync('./index.html', {
        encoding: 'utf-8',
        flag: 'r'
    });
    var newHtml = null;

    json.component.forEach((ele) => {
        html.split(/\r?\n/).forEach((line, ind) => {
            if (line.includes('</body>')) {
                if (!html.includes('<script src="./src/components/' + ele.name + '/' + ele.name + '.component.tsx"></script>')) {
                    newHtml = newHtml + '<script src="./src/components/' + ele.name + '/' + ele.name + '.component.tsx"></script>' + '\n' + line;
                } else {
                    if (line != null) {
                        newHtml = newHtml + line + '\n';
                    }
                }
            } else {

                if (line != null) {
                    newHtml = newHtml + line + '\n';
                }

            }
        });
    })

    if (verbose) {
        newHtml.split(/\r?\n/).forEach((line, ind) => {
            console.log('newLine:', line);
        });
    }

    if (newHtml != null && newHtml != undefined) {
        fs.unlinkSync('./index.html');
        fs.writeFileSync('./index.html', newHtml);
    }
    newHtml = null;

    try {
        shell.mkdir('./dist');
    } catch (e) {

    }
    //shell.exec('npx parcel build index.html');
    shell.cp('./assembly/index.js', './dist/assemblyScript.js');
    if (debug) {
        shell.cp('./build/debug.js', './dist/debug.js');
        shell.cp('./build/debug.wasm', './dist/debug.wasm');
    } else {
        shell.cp('./build/release.js', './dist/release.js');
        shell.cp('./build/release.wasm', './dist/release.wasm');
    }

    try {
        html = fs.readFileSync('./dist/index.html', {
            encoding: 'utf-8',
            flag: 'r'
        });

        html.split(/\r?\n/).forEach((line, ind) => {
            if (line.includes('</head>')) {
                if (debug) {
                    if (!html.includes('<script src="./debug.js"></script>')) {
                        newHtml = newHtml + '<script src="./debug.js"></script>' + '\n' + line;
                    } else {
                        if (line != null) {
                            newHtml = newHtml + line + '\n';
                        }
                    }
                } else {
                    if (!html.includes('<script src="./release.js"></script>')) {
                        newHtml = newHtml + '<script src="./release.js"></script>' + '\n' + line;
                    } else {
                        if (line != null) {
                            newHtml = newHtml + line + '\n';
                        }
                    }
                }
            } else {
                if (line.includes('</body>')) {
                    if (!line.includes('<script src="./assemblyScript.js"></script>')) {
                        if (line != null) {
                            newHtml = newHtml + '<script src="./assemblyScript.js"></script>' + '\n' + line;
                        }
                    }
                }
            }
        });

        if (newHtml != null && newHtml != undefined) {
            fs.unlinkSync('./index.html');
            fs.writeFileSync('./index.html', newHtml);
        }
    } catch (e) {

    }

    //shell.exec('npx parcel serve ./dist/index.html');
    shell.exec('npx parcel ./index.html');
}

function createComponent(name) {
    //console.log('current dir', process.cwd())
    shell.cd('./src/components');
    shell.mkdir(name);
    fs.writeFileSync('./' + name + '/' + name + '.component.tsx', `
    const ` + name + `Component = () =>{
        return(<div>component</div>)
    }

    render(` + name + `Component() as FrameworkEl, document.querySelector("` + name + `"))

    `);
    var comIndexData = fs.readFileSync('index.json', {
        encoding: 'utf-8'
    });

    var obj = JSON.parse(comIndexData);

    obj.component.push({
        name: name
    });
    fs.unlinkSync('index.json');
    fs.writeFileSync('index.json', JSON.stringify(obj));


}

export function addService(args) {
    function parseArgs(rawArgs) {
        const args = arg({
            "--help": Boolean,
            "--name": Boolean,
            "-h": "--help",
            "-n": "--name"
        }, {
            argv: rawArgs.slice(2)
        });
        return {
            help: args['--help'] || false,
            init: args['--name'] || false
        }
    }
}

export function addWasm(args) {
    function parseArgs(rawArgs) {
        const args = arg({
            "--help": Boolean,
            "--name": Boolean,
            "-h": "--help",
            "-n": "--name"
        }, {
            argv: rawArgs.slice(2)
        });
        return {
            help: args['--help'] || false,
            init: args['--name'] || false
        }
    }
}