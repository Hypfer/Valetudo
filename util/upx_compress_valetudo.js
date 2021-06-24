/* eslint-disable */
const fs = require("fs");
const UPX = require("upx")({
    ultraBrute: true
});

const binaries = {
    armv7: {
        base: "./build_dependencies/pkg/v3.1/built-v16.2.0-linuxstatic-armv7",
        built: "./build/armv7/valetudo",
        out: "./build/armv7/valetudo.upx"
    },
    armv7_lowmem: {
        base: "./build_dependencies/pkg/v3.1/built-v16.2.0-linuxstatic-armv7",
        built: "./build/armv7/valetudo_lowmem",
        out: "./build/armv7/valetudo_lowmem.upx"
    },
    aarch64: {
        base: "./build_dependencies/pkg/v3.1/built-v16.2.0-linuxstatic-arm64",
        built: "./build/aarch64/valetudo",
        out: "./build/aarch64/valetudo.upx"
    }
};

/**
 * There is absolutely no error handling in here. Great :)
 *
 * Note that this only works with patched base binaries which don't use hardcoded offsets
 * for payload and prelude
 */
console.log("Starting UPX compression");

Object.values(binaries).forEach(async b => {
    console.log("Compressing " + b.built);

    const baseSize = fs.readFileSync(b.base).length;
    const built = fs.readFileSync(b.built);

    const runtime = built.slice(0, baseSize);
    const payload = built.slice(baseSize);

    // UPX will reject files without the executable bit on linux. Also, default mode is 666
    fs.writeFileSync(b.out + "_runtime", runtime, {mode: 0o777});

    const upxResult = await UPX(b.out + "_runtime").start();

    console.log("Compressed " + b.built + " from " + upxResult.fileSize.before + " to " + upxResult.fileSize.after + ". Ratio: " + upxResult.ratio);

    const compressedRuntime = fs.readFileSync(b.out + "_runtime");
    fs.unlinkSync(b.out + "_runtime");

    const fullNewBinary = Buffer.concat([compressedRuntime, payload]);

    fs.writeFileSync(b.out, fullNewBinary, {mode: 0o777});

    console.log("Successfully wrote " + b.out);
});

