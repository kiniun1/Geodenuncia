var winston = require('winston')
var fs = require('fs')

if(!fs.existsSync('logs')){
    fs.mkdirSync('logs')
}

module.exports = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: 
    [
      
      // - Todos os logs de nivel `error` para o arquivo `error.log`
      // - Todos os logs de nivel `info` para o arquivo `combined.log`
      
      new winston.transports.File(
            { 
                filename: 'logs/error.log', 
                level: 'error',
                maxsize: 100000,
                maxFile: 10,
                timeStamp: true,
                colorize: false   
            }),
      new winston.transports.File(
            { 
                filename: 'logs/combined.log',
                maxsize: 100000,
                maxFile: 10,
                timeStamp: true,
                colorize: false  
            }),
    ],
  });

// Criação dos Logs, 3 diferentes niveis, com info, debug e error