const UINT8_MASK = 0b00000000000000000000000011111111;

/**
 * Dreame stores all three configurables of their mop docks in a single PIID as one int
 * This int consists of three ints like so (represented here as an 32 bit int because js bitwise operations use those):
 *
 * XXXXXXXXWWWWWWWWPPPPPPPPOOOOOOOO
 *
 * where
 * - X is nothing
 * - W is the water grade (wetness of the mop pads)
 * - P is the pad cleaning frequency (apparently in m² plus 0 for "after each segment")
 * - O is the operation mode (mop, vacuum & mop, vacuum)
 *
 */

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
