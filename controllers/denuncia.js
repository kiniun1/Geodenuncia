var { check, validationResult } = require('express-validator')

module.exports = function(app)
{
    app.post('/v1/denuncias', 
    [
        check("denuncia.titulo", "Titulo é obrigatório!").notEmpty(),
        check("denuncia.descricao", "Descrição é obrigatório!").notEmpty(),
        check("latitude", "Latitude é obrigatório!").notEmpty(),
        check("longitude", "Longitude é obrigatório!").notEmpty()
    ],
    function(req, res)
    {

        const erros = validationResult(req)
        if (!erros.isEmpty()) {
            res.body = JSON.parse('{"error": {"message": "Request inválido.", "code": "01"}}')
            console.log(JSON.parse('{"error": {"message": "Request inválido.", "code": "01"}}'))
            console.log(erros) 
            return res.status(400).send(res.body)
        } 
        
        console.log('buscando endereço...')

        var locatio = 
        {
            "location": 
            {
                "latLng": 
                {
                    "lat": req.body.latitude,
                    "lng": req.body.longitude
                }
            }
        }
        const memcachedClient = app.servicos.memcachedClient()
        memcachedClient.get('coordenadas:' + req.body.latitude + ',' + req.body.longitude, (erro, retorno) => 
        {
            if(erro || !retorno)
            {
                console.log('Chave não encontrada no cache! Consultando o MapQuest...')
                var clienteMap = new app.servicos.clienteMap();
                clienteMap.revgeocoding(locatio, (errin, reque, respo, retor)=>
                {
                    if(errin)
                    {
                        console.log(errin)
                        res.status(400).send(errin)
                    }else
                    {
                        console.log(retor)
                        
                        var endereco = retor["results"][0]["locations"]

                        if(endereco == "")
                        {
                            res.body = {
                                "error": {
                                "message": "Endereço não encontrado para essa localidade.",
                                "code": "02"
                                }
                            }
                            res.status(400).send(res.body)
                            console.log('Lugar não encontrado!')
                            return
                        }else if(endereco[0].adminArea5 == '' || endereco[0].adminArea3 == '' || endereco[0].adminArea1 == '')
                        {
                            res.body = 
                            {
                                "error": 
                                {
                                    "message": "Dados do endereço que são obrigatórios estão vazios para essa localidade.",
                                    "code": "03",
                                    "cidade": endereco[0].adminArea5,
                                    "estado": endereco[0].adminArea3,
                                    "país"  : endereco[0].adminArea1
                                }
                            }
                            res.status(400).send(res.body)
                            console.log('Coordenadas não retornaram um endereço válido!\n\n')
                            return
                        } else
                        {
                            console.log('Coordenadas retornaram endereço válido, inserindo no banco de dados')


                            let teste2 = Object.assign({},{logradouro: endereco[0].street, bairro: endereco[0].adminArea6, 
                                cidade: endereco[0].adminArea5, estado: endereco[0].adminArea3, pais: endereco[0].adminArea1, 
                                cep: endereco[0].postalCode})
                            let cache = Object.assign({latitude : req.body.latitude, longitude : req.body.longitude}, {endereco:teste2})

                            var memcachedClient = app.servicos.memcachedClient()

                            memcachedClient.set('coordenadas:' + cache.latitude + ',' + cache.longitude, cache, 60000, function(erro)
                            {
                                if (erro){
                                    console.log(erro)
                                }else{
                                    console.log('nova chave adicionada ao cache: coordenadas:' + cache.latitude + ',' + cache.longitude)
                                }
                                
                            })

                            req.body.endereco = Object.assign({},teste2)
                            let data = Object.assign({latitude: req.body.latitude, longitude: req.body.longitude},teste2,req.body.denunciante,req.body.denuncia)
                            console.log(data)
                            var connection = app.persistencia.connectionFactory()
                            var dataDao = new app.persistencia.DataDao(connection)

                            dataDao.salva(data, function(erro, resultado)
                            {
                                if(erro)
                                {
                                    console.log('Erro ao inserir no banco: ' + erro, '\n')
                                    res.status(500).send(erro)
                                } else
                                {
                                    req.body.id = resultado.insertId
                                    console.log("Inserido!\n\n")
                                    res.status(201).send(req.body)
                                }
                            })
                            return
                        }
                    }
                })
            }else
            {
                console.log('Chave encontrada no cache!')

                let cache = Object.assign({},{logradouro: retorno.endereco.logradouro, bairro: retorno.endereco.bairro, 
                    cidade: retorno.endereco.cidade, estado: retorno.endereco.estado, pais: retorno.endereco.pais, 
                    cep: retorno.endereco.cep})
                let dados = Object.assign({latitude: req.body.latitude, longitude: req.body.longitude}, cache, req.body.denuncia, req.body.denunciante)


                var connection = app.persistencia.connectionFactory()
                var dataDao = new app.persistencia.DataDao(connection)

                dataDao.salva(dados, function(erro, resultado)
                {
                    if(erro)
                    {
                        console.log('Erro ao inserir no banco: ' + erro, '\n')
                        res.status(500).send(erro)
                    } else
                    {
                        req.body.id = resultado.insertId
                        console.log("Inserido!\n\n")
                        res.status(201).send(req.body)
                    }
                })
            }
        })
    }
    )
}