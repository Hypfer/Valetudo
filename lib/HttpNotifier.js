const http = require('http');
const urllib = require('url');

/**
 *
 * @param options {object}
 * @param options.configuration {Configuration}
 * @param options.events {EventEmitter}
 * @constructor
 */
const HttpNotifier = function(options) {
    this.configuration = options.configuration;

    let notificationConfig = this.configuration.get('http-status-notifications');

    this.notificationURL = notificationConfig.url;
    this.events = options.events;

    this.events.on("miio.status", (statusData) => {
        console.log(`Posting status to ${this.notificationURL}`);
        this.postStatus(statusData);
    });
};

HttpNotifier.prototype.postStatus = function(statusData) {
    const components = new urllib.URL(this.notificationURL);

    const options = {
        method: 'POST',
        host: components.hostname,
        port: components.port,
        path: components.pathname,
        protocol: components.protocol,
        headers: {'Content-Type': 'application/json'}
    };

    const req = http.request(options, (res) => {});
    
    try {
        const stringified = JSON.stringify(statusData);
        req.write(stringified);
    } catch (e) {
    } finally {
        req.end();
    }
};

module.exports = HttpNotifier;
