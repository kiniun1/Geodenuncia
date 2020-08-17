var winston = require('winston')
var fs = require('fs')

if(!fs.existsSync('logs')){
    fs.mkdirSync('logs')
}

module.exports = winston.createLogger
({
    transports : 
    [
        new winston.transports.File
        ({
            level: "info",
            filename: "logs/denunciaInfo.log",
            maxFile: 10,
            timeStamp: true,
            colorize: false
        }),
        new winston.transports.File
        ({
            level: "debug",
            filename: "logs/denunciaDebug.log",
            maxFile: 10,
            timeStamp: true,
            colorize: false
        }),
        new winston.transports.File
        ({
            level: "error",
            filename: "logs/denunciaError.log",
            maxFile: 10,
            timeStamp: true,
            colorize: false
        })
    ]
})