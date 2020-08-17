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

//Arquivo que contém a rota e criando um cliente pelo restify-clients
// para rodar um método revgeocoding pra achar o endereço com o parametro coordenadas que irei passar no denuncia.js