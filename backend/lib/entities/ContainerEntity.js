const EVENT_TYPE = require("./AttributeSubscriber").EVENT_TYPE;
const Logger = require("../Logger");
const SerializableEntity = require("./SerializableEntity");

/**
 * @typedef {object} AttributeMatcher
 * @property {string} attributeClass
 * @property {string} [attributeType]
 * @property {string} [attributeSubType]
 */

/**
 * @typedef {object} AttributeSubscribersMeta
 * @property {AttributeMatcher} matcher
 * @property {Array<import("./AttributeSubscriber")>} subscribers
 */

class ContainerEntity extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {Array<import("./Attribute")>} [options.attributes]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.attributes = options.attributes ?? [];

        /** @type {Array<AttributeSubscribersMeta>} */
        this.subscribers = [];
    }

    /**
     * @private
     * @param {AttributeMatcher|any} matcher
     * @param {object} [options]
     * @param {boolean} [options.exact]
     * @return {Array<AttributeSubscribersMeta>}
     */
    getAttributeSubscribersMetas(matcher, options) {
        let exact = false;
        if (options !== undefined && options.exact !== undefined) {
            exact = options.exact;
        }
        return this.subscribers.filter((meta) => {
            if (meta.matcher.attributeClass !== matcher.attributeClass) {
                return false;
            }
            if (((!exact && meta.matcher.attributeType !== undefined) || exact) && meta.matcher.attributeType !== matcher.attributeType) {
                return false;
            }
            // noinspection RedundantIfStatementJS // screw the linter, readability first
            if (((!exact && meta.matcher.attributeSubType !== undefined) || exact) && meta.matcher.attributeSubType !== matcher.attributeSubType) {
                return false;
            }
            return true;
        });
    }

    /**
     * Create a new subscription for attribute changes matching the specified matcher.
     *
     * @public
     * @param {import("./AttributeSubscriber")} subscriber
     * @param {AttributeMatcher|any} matcher
     */
    subscribe(subscriber, matcher) {
        const metas = this.getAttributeSubscribersMetas(matcher, {exact: true});
        let meta = null;
        if (metas.length > 0) {
            meta = metas[0];
            if (metas.length > 1) {
                Logger.error("BUG! Found multiple attribute subscribers metas matching exactly. Please report this issue.", this.subscribers);
            }
        } else {
            meta = {
                matcher: matcher,
                subscribers: []
            };
            this.subscribers.push(meta);
        }
        if (!meta.subscribers.includes(subscriber)) {
            meta.subscribers.push(subscriber);
        }
    }

    /**
     * Remove previously added subscription for attribute changes matching the specified matcher.
     *
     * @public
     * @param {import("./AttributeSubscriber")} subscriber
     * @param {AttributeMatcher|any} matcher
     */
    unsubscribe(subscriber, matcher) {
        const metas = this.getAttributeSubscribersMetas(matcher, {exact: true});
        if (metas.length > 1) {
            Logger.error("BUG! Found multiple attribute subscribers metas matching exactly. Please report this issue.", this.subscribers);
        }
        this.unsubscribeFromListedMetas(subscriber, metas);
    }

    /**
     * Remove all subscriptions for specified subscriber.
     *
     * @public
     * @param {import("./AttributeSubscriber")} subscriber
     */
    unsubscribeAll(subscriber) {
        this.unsubscribeFromListedMetas(subscriber, this.subscribers);
    }

    /**
     * @private
     * @param {import("./AttributeSubscriber")} subscriber
     * @param {Array<AttributeSubscribersMeta|any>} metas
     */
    unsubscribeFromListedMetas(subscriber, metas) {
        const toDelete = [];

        for (const meta of metas) {
            meta.subscribers = meta.subscribers.filter(registeredSubscriber => {
                return registeredSubscriber !== subscriber;
            });

            if (meta.subscribers.length === 0) {
                toDelete.push(meta);
            }
        }

        this.subscribers = this.subscribers.filter(subscriber => {
            return !toDelete.includes(subscriber);
        });
    }

    /**
     * @private
     * @param {string} eventType
     * @param {import("./Attribute")|any} attribute
     * @param {import("./Attribute")|any} [previousAttribute]
     */
    notifySubscribers(eventType, attribute, previousAttribute) {
        const subsMetas = this.getAttributeSubscribersMetas({
            attributeClass: attribute.__class,
            attributeType: attribute.type,
            attributeSubType: attribute.subType
        });

        for (const meta of subsMetas) {
            for (const subscriber of meta.subscribers) {
                subscriber.onAttributeEvent(eventType, attribute, previousAttribute);
            }
        }
    }

    /**
     * @public
     *
     * @param {AttributeMatcher|any} options
     */
    hasMatchingAttribute(options) {
        return this.getMatchingAttributes(options).length > 0;
    }

    /**
     * @public
     *
     * @param {AttributeMatcher|any} options
     * @returns {Array<any|import("./Attribute")>}
     */
    getMatchingAttributes(options) {
        let needles = this.attributes.filter(e => {
            return e.constructor.name === options.attributeClass;
        });

        if (options.attributeType) {
            needles = needles.filter(e => {
                return e.type === options.attributeType;
            });

            if (options.attributeSubType) {
                return needles.filter(e => {
                    return e.subType === options.attributeSubType;
                });
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
     * @param {AttributeMatcher|any} options
     * @returns {void}
     */
    removeMatchingAttributes(options) {
        let needles = this.getMatchingAttributes(options);
        this.attributes = this.attributes.filter(e => {
            return !needles.includes(e);
        });

        for (const attr of needles) {
            this.notifySubscribers(EVENT_TYPE.DELETE, attr);
        }
    }

    /**
     * @public
     *
     * @param {AttributeMatcher|any} options
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
     * @param {Function} ctor
     * @returns {any|import("./Attribute")}
     */
    getFirstMatchingAttributeByConstructor(ctor) {
        return this.getFirstMatchingAttribute({attributeClass: ctor.name});
    }

    /**
     * @public
     *
     * @param {AttributeMatcher} options
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
     * @param {object} newAttribute
     */
    upsertFirstMatchingAttribute(newAttribute) {
        const index = this.getFirstMatchingAttributeIndex({
            attributeClass: newAttribute.__class,
            attributeType: newAttribute.type,
            attributeSubType: newAttribute.subType
        });

        if (index === -1) {
            this.attributes.push(newAttribute);
            this.notifySubscribers(EVENT_TYPE.ADD, newAttribute);
        } else {
            const previousAttribute = this.attributes[index];

            this.attributes[index] = newAttribute;
            this.notifySubscribers(EVENT_TYPE.CHANGE, newAttribute, previousAttribute);
        }
    }

    toJSON() {
        return {
            __class: this.__class,
            metaData: this.metaData,
            attributes: this.attributes
        };
    }
}

module.exports = ContainerEntity;
