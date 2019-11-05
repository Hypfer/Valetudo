const Slimbot = require('slimbot');
const Request = require('request-promise');

/**
 * @param options {object}
 * @param options.sendconsumables {boolean}
 * @param options.sendconsumablesevery {boolean}
 * @param options.telegramtoken {string}
 * @constructor
 */
const Telegrambot = function (options) {
    const self = this;
    this.slimbot = null;
    this.running = 0;
    this.events = options.events;
    this.vacuum = options.vacuum;
    this.initiate (options);

    this.events.on("miio.bin_full", (statusData) => {
        // if (!this.slimbot) return;
        // console.log(statusData);
        // this.slimbot.sendMessage(message.chat.id, 'Empty bin');
    });
    this.events.on("miio.status", (statusData) => {
        // if (!this.slimbot) return;
        // console.log(statusData);
        // this.slimbot.sendMessage(message.chat.id, statusData);
    });
    this.events.on("miio.home", (statusData) => {
        // if (!this.slimbot) return;
        // console.log(statusData);
        // this.slimbot.sendMessage(message.chat.id, 'going back to dock');
    })
}

Telegrambot.prototype.initiate = function(options) {
    const self = this;
    if (this.slimbot) this.slimbot.stopPolling();
    this.slimbot = null;
    this.botname = "";
    this.running = 0;
    if (!options.telegramtoken) return;
    Request({ uri: 'https://api.telegram.org/bot' + options.telegramtoken + '/getMe' }).then(resp => {
        var result = JSON.parse(resp);
        this.botname = result.result.username;
        this.running = 1;
    }).catch(error => {
        throw error;
    });
    this.sendconsumables = options.sendconsumables;
    this.sendconsumablesevery = options.sendconsumablesevery;

    if (this.running==1) return;
    this.slimbot = new Slimbot(options.telegramtoken);
    this.slimbot.on('message', message => {
        if (message.text == "/help" || message.text == "/start")
            this.slimbot.sendMessage(message.chat.id, 
                '/start & /help This Help the roborock\n'+
                '/clean start the roborock\n' +
                '/stop stops the roborock\n' +
                '/home send roborock back to Dock\n' +
                '/status give you the current status of roborock\n' +
                '/consumablesstatus give you the current status of consumables\n');
        else if (message.text == "/clean"){
            this.vacuum.startCleaning(function (err, data) {
                if (err) {
                    console.log(err);
                }else {
                    self.slimbot.sendMessage(message.chat.id, 'start cleaning');
                }
            });
        } else if (message.text == "/stop"){
            this.vacuum.stopCleaning(function (err, data) {
                if (err) {
                    console.log(err);
                }else {
                    self.slimbot.sendMessage(message.chat.id, 'stop cleaning');
                }
            });
        } else if (message.text == "/home"){
            this.vacuum.driveHome(function (err, data) {
                if (err) {
                    console.log(err);
                }else {
                    self.slimbot.sendMessage(message.chat.id, 'going home');
                }
            });
        } else if (message.text == "/status"){
            this.vacuum.getCurrentStatus(function(res){
                console.log(res);
                //self.slimbot.sendMessage(message.chat.id, res.human_state);
            });
        }else if (message.text == "/consumablesstatus"){
            self.vacuum.getCleanSummary(function (err, data2) {
                if (err) {
                    console.log(err);
                }else {
                    self.slimbot.sendMessage(message.chat.id, data2);
                }
            });
        }
    });
    
    // Call API
    
    this.slimbot.startPolling();
}
Telegrambot.prototype.get_status = function(){
    if (this.running == 0)
        return "Telegram token empty";
    else if (this.running == 1)
        return "Telegram connected as " + this.botname;
    return this.running;
}

module.exports = Telegrambot;