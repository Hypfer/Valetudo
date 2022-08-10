const ValetudoUpdaterError = require("../ValetudoUpdaterError");
const ValetudoUpdaterState = require("../../../entities/core/updater/ValetudoUpdaterState");

class ValetudoUpdaterStep {
    /**
     * @abstract
     * 
     * @returns {Promise<ValetudoUpdaterState>}
     * @throws {ValetudoUpdaterError}
     */
    async execute() {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.UNKNOWN,
            "Empty ValetudoUpdaterStep implementation"
        );
    }
}

module.exports = ValetudoUpdaterStep;
