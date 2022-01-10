/*
    Quirks are Vendor-specific settings that don't (yet) fit into a generic capability
    due to them being something that only one vendor/model does.
    They are basic toggles/selects and may change at any time.

    Availability of quirks may also depend on the firmware version of the robot.
    It is not recommended using them in automations etc. They're just here for the Valetudo UI

    If there are multiple similar quirks of different vendors, they shall be merged into a capability so
    that we don't undermine the core idea of Valetudo being a generic abstraction.
    One could probably also consider this a staging area for new stuff
 */

class Quirk {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {Array<string>} options.options
     * @param {string} options.title
     * @param {string} options.description
     * @param {() => Promise<string>} options.getter
     * @param {(value: string) => Promise<void>} options.setter
     */
    constructor(options) {
        this.id = options.id;
        this.options = options.options;
        this.title = options.title;
        this.description = options.description;
        this.getter = options.getter;
        this.setter = options.setter;
    }

    /**
     *
     * @return {Promise<{options: Array<string>, description: string, id: string, title: string, value: string}>}
     */
    async serialize() {
        return {
            id: this.id,
            options: this.options,
            title: this.title,
            description: this.description,
            value: await this.getter()
        };
    }
}

module.exports = Quirk;
