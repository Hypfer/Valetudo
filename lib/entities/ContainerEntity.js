const SerializableEntity = require("./SerializableEntity");

class ContainerEntity extends SerializableEntity {
    /**
     *
     * @param options {object}
     * @param [options.attributes] {Array<import("./Attribute")>}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.attributes = options.attributes || [];
    }

    /**
     * @public
     *
     * @param options {object}
     * @param options.attributeClass {string}
     * @param [options.attributeType] {string}
     * @param [options.attributeSubType] {string}
     */
    hasMatchingAttribute(options) {
        return this.getMatchingAttributes(options).length > 0;
    }

    /**
     * @public
     *
     * @param options {object}
     * @param options.attributeClass {string}
     * @param [options.attributeType] {string}
     * @param [options.attributeSubType] {string}
     *
     * @returns {Array<any|import("./Attribute")>}
     */
    getMatchingAttributes(options) {
        let needles = this.attributes.filter(e => e.constructor.name === options.attributeClass);

        if (options.attributeType) {
            needles = needles.filter(e => e.type === options.attributeType);

            if (options.attributeSubType) {
                return needles.filter(e => e.subType === options.attributeSubType);
            } else {
                return needles;
            }
        } else {
            return needles;
        }
    }

    /**
     * @public
     *
     * @param options {object}
     * @param options.attributeClass {string}
     * @param [options.attributeType] {string}
     * @param [options.attributeSubType] {string}
     *
     * @returns {void}
     */
    removeMatchingAttributes(options) {
        let needles = this.getMatchingAttributes(options);

        this.attributes = this.attributes.filter(e => !needles.includes(e));
    }

    /**
     * @public
     *
     * @param options {object}
     * @param options.attributeClass {string}
     * @param [options.attributeType] {string}
     * @param [options.attributeSubType] {string}
     *
     * @returns {any|import("./Attribute")}
     */
    getFirstMatchingAttribute(options) {
        const index = this.getFirstMatchingAttributeIndex(options);

        if (index !== -1) {
            return this.attributes[index];
        } else {
            return null;
        }
    }

    /**
     * @public
     *
     * @param ctor {function}
     * @returns {any|import("./Attribute")}
     */
    getFirstMatchingAttributeByConstructor(ctor) {
        return this.getFirstMatchingAttribute({attributeClass: ctor.name});
    }

    /**
     * @public
     *
     * @param options {object}
     * @param options.attributeClass {string}
     * @param [options.attributeType] {string}
     * @param [options.attributeSubType] {string}
     *
     * @returns {number}
     */
    getFirstMatchingAttributeIndex(options) {
        return this.attributes.findIndex(e => {
            let matches = e.constructor.name === options.attributeClass;

            if (options.attributeType && matches) {
                matches = e.type === options.attributeType;
            }

            if (options.attributeSubType && matches) {
                matches = e.subType === options.attributeSubType;
            }

            return matches;
        });
    }

    /**
     * @param newAttribute
     */
    upsertFirstMatchingAttribute(newAttribute) {
        const index = this.getFirstMatchingAttributeIndex({
            attributeClass: newAttribute.__class,
            attributeType: newAttribute.type,
            attributeSubType: newAttribute.subType
        });

        if (index === -1) {
            this.attributes.push(newAttribute);
        } else {
            this.attributes[index] = newAttribute;
        }
    }
}

module.exports = ContainerEntity;