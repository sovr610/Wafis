# wafis-cli
Wafis is a front-end web framework that works with react TSX style components with webassembly integrated into it. This is the command line interface tool to create projects, add components and more features that are listed below. 

# Important & News
This is in a pre-alpha stage of development! as of 8/20/22, this framework has a few features working, but most of the features are broken or not even implemented. 
  ### Features implemented
  - TSX components
  - building the typescript and components to the website
  - custom tag rendering with components.
  - assembly script functionality (not full implementation into build project command)
  ### Future features
  - C++ emscripten & dependency package system based on napa
  - rust & web-pack for rust wasm modules
  - services (api calls to a server)
  - ~~Better cli, want more like `wafis component create --name menu`~~ (done as of v0.0.8-alpha)
  - css encapsulation per component
  - main configuration file (features, build config, linting, etc.)
  - better tests (cypress)
  - data-attributes, and classes to custom tags
  - SCSS integration
  - directive like feature (similar to angular)

# Commands
 - `wafis new project` -> create a generic assemble project to build your website.
 - `wafis new component` -> add an individual component to be used in the website.
 - `wafis new service` -> add a service to call to a back-end server (usually for databases)
 - `wafis build` -> compiles wasm modules, compiles your comonents, and overall puts your project into a finalized website.
 - `wafis --help` -> general purpose command, at the moment it displays all the commands you can run.
 
 # components
 below is example code for you building your own component to be added to the website.
 <img width="434" alt="entity-framework-component" src="https://user-images.githubusercontent.com/5156960/185767967-dc6e15da-ebe0-483d-9497-a9424df1ef08.png">
 
 you need to set your element and the html in it, then add it to the render function. the first argument is the element, and the second argument is for which tag you  want to associate this element. You will need to add the tag to your `index.html` to be shown on the website.
 
 # Webassembly
 We are currently working on integrating C++, Rust and assembly script to the wafis framework. the order of getting the webassembly modules working are
  1. assemblyScript
  2. C++/Emscripten
  3. Rust/web-pack
  
 Currently assembly script is working, but as of 8/20/22 we are still working on integrating the functionality of assembly script, when building the project.
 For C++ we are using emscripten, we have a feature to automatically install enscripten for windows and linux in the command `wafis-install`. `napa` is a node library 
 that allows us to install any git repo as a dependency into your `node_modules` folder. The `napa` node module will be used to download and integrate C++ dependencies, 
 and with a dynamic script, it will be added to the wasm module when your C++ code is being built by emscripten.
 
