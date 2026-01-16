process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.GENERATE_SOURCEMAP = 'false';

const chalk = require('react-dev-utils/chalk');
const fs = require('fs-extra');
const webpack = require('webpack');
const configFactory = require('../config/webpack.config');
const paths = require('../config/paths');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
    process.exit(1);
}

const tick = chalk.green('√');
const config = configFactory('development');

console.log(`${tick} Load Webpack configuration`);

fs.emptyDirSync(paths.appBuild);
console.log(`${tick} Clear destination folder`);

copyPublicFolder();

const compiler = webpack(config);

let isFinished = false;

compiler.hooks.invalid.tap('Invalidate', () => {
    isFinished = false;
    if (process.stdout.isTTY) {
        process.stdout.write('\n');
    }
});

new webpack.ProgressPlugin((percentage, message) => {
    if (isFinished) {
        return;
    }

    if (process.stdout.isTTY) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        const percent = Math.floor(percentage * 100);
        process.stdout.write(`${chalk.cyan('Building...')} ${percent}% ${message}`);
    }
}).apply(compiler);

compiler.watch(
    {
        aggregateTimeout: 200,
        poll: undefined,
    },
    (err, stats) => {
        isFinished = true;

        if (process.stdout.isTTY) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }

        let messages;
        if (err) {
            if (!err.message) {
                return console.error(err);
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

        const isSuccessful = !messages.errors.length && !messages.warnings.length;

        if (isSuccessful) {
            console.log(`${tick} Build done`);
        }

        if (messages.errors.length) {
            if (messages.errors.length > 1) {
                messages.errors.length = 1;
            }
            console.log(chalk.red('Failed to compile.\n'));
            console.log(messages.errors.join('\n\n'));
            return;
        }

        if (messages.warnings.length) {
            console.log(chalk.yellow('Compiled with warnings.\n'));
            console.log(messages.warnings.join('\n\n'));
        }
    }
);

function copyPublicFolder() {
    fs.copySync(paths.appPublic, paths.appBuild, {
        dereference: true,
        filter: file => file !== paths.appHtml,
    });
}
