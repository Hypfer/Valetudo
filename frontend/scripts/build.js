process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.GENERATE_SOURCEMAP = 'false';

const chalk = require('react-dev-utils/chalk');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const configFactory = require('../config/webpack.config');
const paths = require('../config/paths');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const FONT_SUBSETS_TO_KEEP = null; // ["latin"] for further size reduction

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
    process.exit(1);
}

const argv = process.argv.slice(2);
const writeStatsJson = argv.indexOf('--stats') !== -1;
const config = configFactory('production');

measureFileSizesBeforeBuild(paths.appBuild)
    .then(previousFileSizes => {
        console.log(chalk.cyan('Creating an optimized production build...'));

        fs.rmSync(paths.appBuild, { recursive: true, force: true });
        fs.mkdirSync(paths.appBuild, { recursive: true });

        copyPublicFolder();

        return build(previousFileSizes);
    })
    .then(
        ({ stats, previousFileSizes, warnings }) => {
            if (warnings.length) {
                console.log(chalk.yellow('Compiled with warnings.\n'));
                console.log(warnings.join('\n\n'));
            } else {
                console.log(chalk.green('Compiled successfully.\n'));
            }

            const removedFonts = removeUnwantedFontFiles();
            if (removedFonts.legacyWoff.count > 0) {
                console.log(chalk.green(
                    `Removed ${removedFonts.legacyWoff.count} legacy .woff fonts` +
                    ` (${Math.round(removedFonts.legacyWoff.bytes / 1024)} kB)`
                ));
            }
            if (removedFonts.nonShippedSubsets.count > 0) {
                console.log(chalk.green(
                    `Removed ${removedFonts.nonShippedSubsets.count} font files outside FONT_SUBSETS_TO_KEEP` +
                    ` (${Math.round(removedFonts.nonShippedSubsets.bytes / 1024)} kB)`
                ));
            }
            if (removedFonts.legacyWoff.count > 0 || removedFonts.nonShippedSubsets.count > 0) {
                console.log();
            }

            console.log('File sizes after gzip:\n');
            printFileSizesAfterBuild(
                stats,
                previousFileSizes,
                paths.appBuild,
                WARN_AFTER_BUNDLE_GZIP_SIZE,
                WARN_AFTER_CHUNK_GZIP_SIZE
            );
            console.log();
        },
        err => {
            console.log(chalk.red('Failed to compile.\n'));
            console.log((err.message || err) + '\n');
            process.exit(1);
        }
    );

function build(previousFileSizes) {
    const compiler = webpack(config);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            let messages;

            if (err) {
                if (!err.message) {
                    return reject(err);
                }
                messages = formatWebpackMessages({
                    errors: [err.message],
                    warnings: [],
                });
            } else {
                messages = formatWebpackMessages(
                    stats.toJson({ all: false, warnings: true, errors: true })
                );
            }

            if (messages.errors.length) {
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join('\n\n')));
            }

            const resolveArgs = {
                stats,
                previousFileSizes,
                warnings: messages.warnings,
            };

            if (writeStatsJson) {
                const statsJson = stats.toJson();
                fs.writeFileSync(paths.appBuild + '/bundle-stats.json', JSON.stringify(statsJson, null, 2));
                console.log(chalk.green(`Stats file generated at ${paths.appBuild}/bundle-stats.json`));
            }

            return resolve(resolveArgs);
        });
    });
}

function copyPublicFolder() {
    fs.cpSync(paths.appPublic, paths.appBuild, {
        recursive: true,
        dereference: true,
        filter: (source) => source !== paths.appHtml,
    });
}

function removeUnwantedFontFiles() {
    const KNOWN_SUBSETS = ["cyrillic-ext", "cyrillic", "vietnamese", "latin-ext", "greek", "latin"];
    const legacyWoff = {count: 0, bytes: 0};
    const nonShippedSubsets = {count: 0, bytes: 0};

    const keepPatterns = FONT_SUBSETS_TO_KEEP === null
        ? null
        : FONT_SUBSETS_TO_KEEP.map((subset) => {
            return new RegExp("-" + subset + "-\\d+-normal\\.");
        });

    (function walk(dir) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith(".woff")) {
                legacyWoff.bytes += fs.statSync(fullPath).size;
                fs.rmSync(fullPath);
                legacyWoff.count += 1;
            } else if (
                keepPatterns !== null &&
                entry.name.endsWith(".woff2") &&
                KNOWN_SUBSETS.some((subset) => {
                    return entry.name.includes("-" + subset + "-");
                }) &&
                !keepPatterns.some((pattern) => {
                    return pattern.test(entry.name);
                })
            ) {
                nonShippedSubsets.bytes += fs.statSync(fullPath).size;
                fs.rmSync(fullPath);
                nonShippedSubsets.count += 1;
            }
        }
    })(paths.appBuild);

    return {
        legacyWoff: legacyWoff,
        nonShippedSubsets: nonShippedSubsets,
    };
}
