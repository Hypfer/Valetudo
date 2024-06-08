/**
 * @param {number} ms
 * @return {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {
    sleep: sleep
};
