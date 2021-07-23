#!/usr/bin/env node

/**
 * This enables the use of the nodejs runtime packaged with the valetudo binary for other small
 * js applications on the robot.
 *
 * If we detect that
 *      a) We're packaged
 *      b1) There's a .js file as the first argument
 *          OR
 *      b2) --repl is provided
 *
 * we undo all pkg patching and then
 *      b1) just eval whatever there is.
 *          OR
 *      b2) enter REPL
 */
if (
    !(
        (typeof process.argv[1] === "string" && process.argv[1].toLowerCase().includes("snapshot")) &&
        (
            (typeof process.argv[2] === "string" && process.argv[2].toLowerCase().endsWith(".js")) ||
            (process.argv[2] === "--repl")
        )

    )
) {
    const Logger = require("./lib/Logger");
    const process = require("process");
    const Valetudo = require("./lib/Valetudo");

    var valetudo = new Valetudo();

    process.on("unhandledRejection", error => {
        Logger.error("unhandledRejection", error);
    });

    // eslint-disable-next-line no-inner-declarations
    async function shutdown() {
        try {
            await valetudo.shutdown();
            // need to exit here because otherwise the process would stay open
            process.exit(0);
        } catch (err) {
            Logger.error("Error occured: ", err.name, " - ", err.message);
            Logger.error(err.stack);
            process.exit(1);
        }
    }

    // Signal termination handler - used if the process is killed
    // (e.g. kill command, service valetudo stop, reboot (via upstart),...)
    process.on("SIGTERM", shutdown);

    // Signal interrupt handler -
    // e.g. if the process is aborted by Ctrl + C (during dev)
    process.on("SIGINT", shutdown);

    process.on("exit", function (code) {
        Logger.info("exiting with code " + code + "...");
        if (code !== 0) {
            Logger.error("Stacktrace that lead to the process exiting:", new Error().stack);
        }
    });
} else {
    if ((process.argv[2] === "--repl")) {
        const repl = require("repl");

        repl.start({
            useGlobal: true
        });
    } else {
        const fs = require("fs");
        const module = require("module");

        let script;

        try {
            script = fs.readFileSync(process.argv[2]);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to load " + process.argv[2] + " for execution.", e);
            process.exit(-1);
        }

        // undo pkgs require patching
        // eslint-disable-next-line no-global-assign
        require = module.prototype.require;


        eval(script.toString());
    }

}




