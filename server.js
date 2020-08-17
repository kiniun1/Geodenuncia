var app = require('./custom-express')()
var request = require('request')
var { check, validationResult } = require('express-validator')


app.post('/v1/denuncias', 
    [
        check("denuncia.titulo", "Titulo é obrigatório!").notEmpty(),
        check("denuncia.descricao", "Descrição é obrigatório!").notEmpty(),
        check("latitude", "Latitude é obrigatório!").notEmpty(),
        check("longitude", "Longitude é obrigatório!").notEmpty()
    ],
    function(req, res){

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
        
        var endereco = []
        request.post({
            "headers": { "content-type": "application/json" },
            "url": "http://www.mapquestapi.com/geocoding/v1/reverse?key=2CCyxKh9HxmhX0eBctMzNOcPlIuiqcnS",
            "body": JSON.stringify(locatio)
        }, (error, response, body) => 
        {
            if(error) 
            {
                console.log(error)
                res.send(error)
                return
            }else
            {
                endereco = [JSON.parse(response.body)]
                var aux = endereco[0].results[0].locations
                if(endereco[0].results[0].locations.length == '0')
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
                } else if(aux[0].adminArea5 == '' || aux[0].adminArea3 == '' || aux[0].adminArea1 == '')
                {
                    res.body = 
                    {
                        "error": 
                        {
                            "message": "Dados do endereço que são obrigatórios estão vazios para essa localidade.",
                            "code": "03",
                            "cidade": aux[0].adminArea5,
                            "estado": aux[0].adminArea3,
                            "país"  : aux[0].adminArea1
                        }
                    }
                    res.status(400).send(res.body)
                    console.log('Coordenadas não retornaram um endereço válido!\n\n')
                } else{
                    console.log('Coordenadas retornaram endereço válido, inserindo no banco de dados')
                    var teste2 = Object.assign({},{logradouro: aux[0].street, bairro: aux[0].adminArea6, 
                        cidade: aux[0].adminArea5, estado: aux[0].adminArea3, 
                        pais: aux[0].adminArea1, cep: aux[0].postalCode, latitude: aux[0].latLng.lat, longitude: aux[0].latLng.lng})
                    
                    req.body.endereco = Object.assign({},{endereco:{teste2}})

                    var data = Object.assign({},teste2,req.body.denunciante,req.body.denuncia)
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
                            console.log("Inserido!")
                            res.status(201).send(req.body)
                        }
                    })
                }
            }
        })
    }
)

app.listen(3000, () => { 
    console.log('Server rodando na porta 3000...')
})