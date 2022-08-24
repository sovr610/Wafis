//const inquirer = require('inquirer');

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

