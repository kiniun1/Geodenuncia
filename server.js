var app = require('./config/custom-express')()

app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404;
    next(error)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error:{
            message: error.message
        }
    })
})


app.listen(3000, () => { 
    console.log('Server rodando na porta 3000...')
})