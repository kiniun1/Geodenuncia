var consign = require('consign')
const morgan = require('morgan')
const express = require('express')
const bodyParser = require('body-parser') 
var logger = require('../servicos/logger.js')

module.exports = function(){
    var app = express()
    
    app.use(morgan("common", {
        stream: {
            write: function(mensagem){
                logger.log('info',mensagem)
            }
        }
    }))

    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())

    consign()
     .include('controllers')
     .then('persistencia')
     .then('servicos')
     .into(app)

    return app
}