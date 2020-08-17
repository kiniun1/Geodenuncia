var mysql = require('mysql');

function createDBConnection(){
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'levi2404',
        database: 'payfast'
    });
}

module.exports = function() {
    return createDBConnection;
}