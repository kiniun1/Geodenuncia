var restify = require('restify-clients');

function MapClient(){
    this._cliente = restify.createJsonClient({
        url:'http://www.mapquestapi.com'
    });
}

MapClient.prototype.revgeocoding = function(coordenadas, callback){
    this._cliente.post('/geocoding/v1/reverse?key=2CCyxKh9HxmhX0eBctMzNOcPlIuiqcnS', coordenadas, callback)
}


module.exports = function(){
    return MapClient;
}