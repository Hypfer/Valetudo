process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.GENERATE_SOURCEMAP = 'false';

require('../config/env');

const chalk = require('react-dev-utils/chalk');
const fs = require('fs-extra');
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

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
    process.exit(1);
}

const argv = process.argv.slice(2);
const writeStatsJson = argv.indexOf('--stats') !== -1;
const config = configFactory('production');

measureFileSizesBeforeBuild(paths.appBuild)
    .then(previousFileSizes => {
        console.log(chalk.cyan('Creating an optimized production build...'));

        fs.emptyDirSync(paths.appBuild);
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
                fs.writeJsonSync(paths.appBuild + '/bundle-stats.json', statsJson, { spaces: 2 });
                console.log(chalk.green(`Stats file generated at ${paths.appBuild}/bundle-stats.json`));
            }

            return resolve(resolveArgs);
        });
    });
}

function copyPublicFolder() {
    fs.copySync(paths.appPublic, paths.appBuild, {
        dereference: true,
        filter: file => file !== paths.appHtml,
    });
}
