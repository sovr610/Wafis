//const inquirer = require('inquirer');
const fs = require('fs');
const shell = require('shelljs');
const appData = require('appdata-path');
const sudo = require('sudo-prompt');

function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        shell.exec(cmd, {silent: true}, (code, stdout, stderr) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr));
            }
        });
    });
}

function execAsAdmin(command) {
    return new Promise((resolve, reject) => {
        sudo.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);  // This will reject the promise in case of an error
            } else {
                resolve({ stdout, stderr });  // Resolve with an object containing stdout and stderr
            }
        });
    });
}

async function installEMCC() {
    var osValue = process.platform;
    shell.exec('npm install -g napa');
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
        shell.exec('setx emccPath "' + tmp + '\\emsdk\\upstream\\emscripten"');
        //shell.exec(`runas /user:administrator install-make.bat`);

        shell.exec('curl https://github.com/msys2/msys2-installer/releases/download/2024-01-13/msys2-x86_64-20240113.exe --output MSYS2.exe')
        
        let result = await execAsAdmin('start MSYS2.exe');
        console.log('STDOUT:', result.stdout);
        console.log('STDERR:', result.stderr);

        result = await execAsAdmin('install-make.bat');
        console.log('STDOUT:', result.stdout);
        console.log('STDERR:', result.stderr);
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

async function installRust() {
    var osValue = process.platform;
    if (osValue == 'win32') {
        try {
            // Download and install Rust
            console.log('Downloading Rust installer...');
            await execShellCommand('curl https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe --output rustup-init.exe');
            console.log('Running Rust installer...');
            await execShellCommand('start rustup-init.exe');

            // Download and install wasm-pack
            console.log('Downloading wasm-pack installer...');
            await execShellCommand('curl https://github.com/rustwasm/wasm-pack/releases/download/v0.12.1/wasm-pack-init.exe --output wasm-pack-init.exe');
            console.log('Running wasm-pack installer...');
            await execShellCommand('start wasm-pack-init.exe');
        } catch (error) {
            console.error('Error during installation:', error);
        }

        console.log('Installation process on Windows complete.');
        return;
    }

    if (osValue == "linux") {
        try {
            if (!shell.which('curl')) {
                console.log('Curl is not installed. Installing now...');
                await execShellCommand('sudo apt-get install -y curl');
            }

            console.log('Installing Rust...');
            await execShellCommand('curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh');
            console.log('Installing wasm-pack...');
            await execShellCommand('curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh');
        } catch (error) {
            console.error('Error during installation:', error);
        }

        console.log('Installation process on Linux complete.');
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
process.stdin.once('data', async function(val){

    try{
        if(val.trim() == '1'){
            await installEMCC();
        }

        if(val.trim() == '2'){
            await installRust();
        }

        if(val.trim() == '3'){
            await installEMCC();
            await installRust();
        }
    } catch (error) {
        console.error('Error during installation:', error);
    } finally {
        process.exit(); // This will exit the Node.js process
    }

    
}).resume()

