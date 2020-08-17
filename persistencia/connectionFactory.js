var mysql = require('mysql');

function createDBConnection(){
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'denuncia_api'
    });
}

module.exports = function() {
    return createDBConnection;
}

// para criar a conexão com o banco de dados MYSQL