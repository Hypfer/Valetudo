
class DreameUtils {
    /**
     * 
     * @param {number} input
     * @return {{padCleaningFrequency: number, operationMode: number, waterGrade: number}}
     */
    static DESERIALIZE_MOP_DOCK_SETTINGS(input) {
        const padded = input.toString(2).padStart(24, "0");

        return {
            waterGrade: parseInt(padded.substring(0,8),2),
            padCleaningFrequency: parseInt(padded.substring(8,16),2),
            operationMode: parseInt(padded.substring(16,24),2),
        };
    }

    /**
     * 
     * @param {number} waterGrade
     * @param {number} padCleaningFrequency
     * @param {number} operationMode
     * @return {number}
     */
    static SERIALIZE_MOP_DOCK_SETTINGS(waterGrade, padCleaningFrequency, operationMode) {
        const waterGradeInt8Str = waterGrade.toString(2).padStart(8, "0");
        const padCleaningFrequencyInt8Str = padCleaningFrequency.toString(2).padStart(8, "0");
        const operationModeInt8Str = operationMode.toString(2).padStart(8, "0");


        return parseInt(
            `${waterGradeInt8Str}${padCleaningFrequencyInt8Str}${operationModeInt8Str}`,
            2
        );
    }
}

module.exports = DreameUtils;
