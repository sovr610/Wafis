//const inquirer = require('inquirer');



console.log('with installing wafis, webassembly is a big component!');
console.log('');
console.log('Want to have C++, rust, or both build tools installed for wafis (web-pack & emscripten)')
console.log('(1) -> C++ & emscripten');
console.log('(2) -> rust & webpack');
console.log('(3) -> both features');
console.log('(4) -> nah I just want assembly script (neither)');
process.stdin.setEncoding('utf8');
process.stdin.once('data', function(val){
    if(val.trim() == '1'){
        installEMCC();
    }

    if(val.trim() == '2'){
        installRust();
    }

    if(val.trim() == '3'){
        installEMCC();
        installRust();
    }

    console.log('done with the pre-install!');
}).resume()

