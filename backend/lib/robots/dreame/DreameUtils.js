const UINT8_MASK = 0b00000000000000000000000011111111;

class DreameUtils {
    /**
     * 
     * @param {number} input
     * @return {{padCleaningFrequency: number, operationMode: number, waterGrade: number}}
     */
    static DESERIALIZE_MOP_DOCK_SETTINGS(input) {
        return {
            operationMode: input >>> 0 & UINT8_MASK,
            padCleaningFrequency: input >>> 8 & UINT8_MASK,
            waterGrade: input >>> 16 & UINT8_MASK
        };
    }

    /**
     * 
     * @param {{padCleaningFrequency: number, operationMode: number, waterGrade: number}} settings
     * @return {number}
     */
    static SERIALIZE_MOP_DOCK_SETTINGS(settings) {
        let result = 0 >>> 0;

        result |= (settings.waterGrade & UINT8_MASK);
        result <<= 8;

        result |= (settings.padCleaningFrequency & UINT8_MASK);
        result <<= 8;

        result |= (settings.operationMode & UINT8_MASK);

        return result;
    }
}

module.exports = DreameUtils;
