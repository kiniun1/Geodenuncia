var memcached = require('memcached')

module.exports = function(){
    return createMencachedClient
}
function createMencachedClient(){
    var cliente = new memcached('localhost:11211', {
    retries: 10,
    retry: 10000,
    remove: true
    })
    return cliente
}

// Cliente e a instancia para o uso de servidor de cache nesse caso o Mencached