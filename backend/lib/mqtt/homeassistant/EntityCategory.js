/**
 * Retrieved from https://github.com/home-assistant/core/blob/7abf79d1f991d58051fea0afe56e714ce60d7fdb/homeassistant/const.py#L715-L717 on 2021-11-06.
 *
 * See also https://developers.home-assistant.io/docs/core/entity/#generic-properties
 *
 * @enum {string}
 */
const EntityCategory = Object.freeze({
    CONFIG: "config",
    DIAGNOSTIC: "diagnostic",
    SYSTEM: "system"
});

module.exports = EntityCategory;
