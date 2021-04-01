/**
 * @enum {number}
 */
const QOS = Object.freeze({
    AT_MOST_ONCE: 0,
    AT_LEAST_ONCE: 1,
    EXACTLY_ONCE: 2,
});

module.exports = {
    QOS: QOS,
};
