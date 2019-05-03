const logger_opts = {
        logDirectory:'/mnt/data/valetudo',
        fileNamePattern:'<DATE>-valetudo.log',
        dateFormat:'YYYYMMDD',
        timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS',
        level: 'info'
    };

const log = require('simple-node-logger').createRollingFileLogger(logger_opts);

module.exports = log;
