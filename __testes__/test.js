

test('adicionar coordenadas ao memcached', () => {
    const app = require('./config/custom-express')()
    const memcachedClient = app.servicos.memcachedClient()

    var dados = 
    {
        "lat" : -9.648198,
        "lng" : -35.713458,
        "endereco": {
            "logradouro": "Avenida Dona Constança de Góes Monteiro",
            "bairro": "",
            "cidade": "Maceió",
            "estado": "Alagoas",
            "pais": "BR",
            "cep": "57036-371"
        }
    }
    var a = 0
    memcachedClient.set('coordenadas:' + dados.lat + ',' + dados.lng, dados, 60000, function(erro)
    {
        if(erro){
            console.log(erro)

        }else{
            a = 1
            expect(a).toBe(1);
        }
    })
});

test('consultar endereço no cache pelas coordenadas',  () => {
    const app = require('./config/custom-express')()
    const memcachedClient = app.servicos.memcachedClient()

    var dados = 
    {
        "lat" : -9.648198,
        "lng" : -35.713458,
        "endereco": {
            "logradouro": "Avenida Dona Constança de Góes Monteiro",
            "bairro": "",
            "cidade": "Maceió",
            "estado": "Alagoas",
            "pais": "BR",
            "cep": "57036-371"
        }
    }

    memcachedClient.get('coordenadas:' + dados.lat + ',' + dados.lng, (erro, retorno) => {
        if(erro){
            console.log(erro)
        }
        else{
            expect(retorno).toStrictEqual(dados)
        }
        
    })
})