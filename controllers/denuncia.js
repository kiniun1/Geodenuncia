var { check, validationResult } = require('express-validator') // Para checar o request se não está vazio dados obrigatórios

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
            res.body = JSON.parse('{"error": {"message": "Request inválido.", "code": "01"}}') // Erro 01 se algo estiver faltando, dados obrigatórios
            console.log(JSON.parse('{"error": {"message": "Request inválido.", "code": "01"}}'))
            console.log(erros) 
            return res.status(400).send(res.body)
        } 
        
        console.log('buscando endereço...')

        var locatio =               // Uma variavel já no formato que API MapQuest pede,
        {                           // somente pegando do body da requisição a latitude e a longitude
            "location": 
            {
                "latLng": 
                {
                    "lat": req.body.latitude,
                    "lng": req.body.longitude
                }
            }
        }
        const memcachedClient = app.servicos.memcachedClient() // instanciando um client do memcached
        memcachedClient.get('coordenadas:' + req.body.latitude + ',' + req.body.longitude, (erro, retorno) => // Método para buscar no cache se existe o endereço ja salvo
        {                                                                                                     // e para achar no cache, somente precisa das 2 coordenadas
            if(erro || !retorno)    // Em caso de erro ou não tiver nada no cache segue para usar a API do MapQuest
            {
                console.log('Chave não encontrada no cache! Consultando o MapQuest...')
                var clienteMap = new app.servicos.clienteMap();         // Instancia do client do MapQuest
                clienteMap.revgeocoding(locatio, (error, reque, respo, retor)=>     // Executando o método 
                {
                    if(error)
                    {
                        console.log(error)
                        res.status(400).send(error)
                    }else
                    {
                        
                        var endereco = retor["results"][0]["locations"] // salvando nessa variavel pois o retorno da API tem muitos dados, deixando somente os dados do endereço

                        if(endereco == "")      // Erro 02 se por caso o retorno da API for vazio, ou seja não foi encontrado um endereço, retorna um erro para o cliente
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
                        }else if(endereco[0].adminArea5 == '' || endereco[0].adminArea3 == '' || endereco[0].adminArea1 == '')  // Erro 03 Dados de endereço obrigatórios nao presentes na resposta da API Geocoding
                        {
                            res.body = 
                            {
                                "error": 
                                {
                                    "message": "Dados do endereço que são obrigatórios estão vazios para essa localidade.",
                                    "code": "03",
                                    "cidade": endereco[0].adminArea5,       // mandando no body da resposta quais dos 3 dados obrigatórios estão faltando
                                    "estado": endereco[0].adminArea3,
                                    "país"  : endereco[0].adminArea1
                                }
                            }
                            res.status(400).send(res.body)
                            console.log('Coordenadas não retornaram um endereço válido!\n\n')
                            return
                        } else
                        {
                            console.log('Coordenadas retornaram endereço válido, inserindo no banco de dados')      // Nenhum erro chamado, agora inserir no banco de dados


                            let teste2 = Object.assign({},{logradouro: endereco[0].street, bairro: endereco[0].adminArea6,      // Uma variavel teste2 auxiliar para guardar somente em um objeto todos os dados,
                                cidade: endereco[0].adminArea5, estado: endereco[0].adminArea3, pais: endereco[0].adminArea1,   // para inserir em uma unica tabela no banco de dados
                                cep: endereco[0].postalCode})
                            let cache = Object.assign({latitude : req.body.latitude, longitude : req.body.longitude}, {endereco:teste2})    // Essa variavel somente para mandar para o memcached em um formato que contem 
                                                                                                                                            // Que contém as coordenadas e o endereço, usando as coordenadas para buscar no servidor cache se existe um endereço ja consultado
                            var memcachedClient = app.servicos.memcachedClient()

                            memcachedClient.set('coordenadas:' + cache.latitude + ',' + cache.longitude, cache, 60000, function(erro)   // Inserindo no cache
                            {
                                if (erro){
                                    console.log(erro)
                                }else{
                                    console.log('nova chave adicionada ao cache: coordenadas:' + cache.latitude + ',' + cache.longitude)    // Como fica para consultar essas chaves
                                }
                                
                            })

                            req.body.endereco = Object.assign({},teste2)

                            let data = Object.assign({latitude: req.body.latitude, longitude: req.body.longitude},teste2,req.body.denunciante,req.body.denuncia)  // Todos os dados sem estar dentro de outra chave, todos a nivel 0 do Objeto

                            var connection = app.persistencia.connectionFactory()   
                            var dataDao = new app.persistencia.DataDao(connection)

                            dataDao.salva(data, function(erro, resultado)       // Salvando no banco de dados 
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
            }else // Caso exista no cache as coordenadas parte daqui o código
            {
                console.log('Chave encontrada no cache!')

                let cache = Object.assign({},{logradouro: retorno.endereco.logradouro, bairro: retorno.endereco.bairro,     // Salvando numa variavel os valores do retorno da consulta ao cache
                    cidade: retorno.endereco.cidade, estado: retorno.endereco.estado, pais: retorno.endereco.pais, 
                    cep: retorno.endereco.cep})
                let dados = Object.assign({latitude: req.body.latitude, longitude: req.body.longitude}, cache, req.body.denuncia, req.body.denunciante)     // E guardando todos os dados ao nivel 0 de um objeto para inserir no banco


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