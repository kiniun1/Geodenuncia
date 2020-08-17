var app = require('./config/custom-express')()


app.listen(3000, () => { 
    console.log('Server rodando na porta 3000...')
})