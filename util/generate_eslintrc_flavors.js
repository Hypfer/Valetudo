const fs = require("fs");

const backendEslintRc = JSON.parse(fs.readFileSync("./backend/.eslintrc.json").toString());
const frontendEslintRc = JSON.parse(fs.readFileSync("./frontend/.eslintrc.json").toString());

backendEslintRc.rules = backendEslintRc.rules ?? {};
frontendEslintRc.rules = frontendEslintRc.rules ?? {};

/*
    This file serves two purposes

    1)
    To avoid constantly seeing red squiggly lines for things that one is currently working on,
    all of these useful but not useful in this context rules have been moved to the .automated_overrides.eslintrc.json
    and will only be used for the package.json scripts lint and lint_fix instead of IDE annotations

    2)
    Some eslint rules are known to produce a lot of false positive noise. They however also occasionally surface
    some issues that other rules don't and help as nudges to revisit old code.

    Thus, it makes sense to run them from time to time but definitely not daily
    These rules also extend the automated ones
 */

const automatedOverrides = JSON.parse(fs.readFileSync("./.automated_overrides.eslintrc.json").toString());

const backendAutomatedEslintRc = JSON.parse(JSON.stringify(backendEslintRc));
const frontendAutomatedEslintRc = JSON.parse(JSON.stringify(frontendEslintRc));

Object.keys(automatedOverrides.rules).forEach(ruleName => {
    backendAutomatedEslintRc.rules[ruleName] = automatedOverrides.rules[ruleName];
    frontendAutomatedEslintRc.rules[ruleName] = automatedOverrides.rules[ruleName];
});

fs.writeFileSync("./backend/.automated.eslintrc.json", JSON.stringify(backendAutomatedEslintRc, null, 2));
fs.writeFileSync("./frontend/.automated.eslintrc.json", JSON.stringify(frontendAutomatedEslintRc, null, 2));





const pedanticOverrides = JSON.parse(fs.readFileSync("./.pedantic_overrides.eslintrc.json").toString());

const backendPedanticEslintRc = JSON.parse(JSON.stringify(backendAutomatedEslintRc));
const frontendPedanticEslintRc = JSON.parse(JSON.stringify(frontendAutomatedEslintRc));

Object.keys(pedanticOverrides.rules).forEach(ruleName => {
    backendPedanticEslintRc.rules[ruleName] = pedanticOverrides.rules[ruleName];
    frontendPedanticEslintRc.rules[ruleName] = pedanticOverrides.rules[ruleName];
});

fs.writeFileSync("./backend/.pedantic.eslintrc.json", JSON.stringify(backendPedanticEslintRc, null, 2));
fs.writeFileSync("./frontend/.pedantic.eslintrc.json", JSON.stringify(frontendPedanticEslintRc, null, 2));




