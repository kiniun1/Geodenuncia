function DataDao(connection){
    this._connection = connection
}

DataDao.prototype.salva = function(dados, callback){
    this._connection.query('INSERT INTO data SET ?', dados, callback)
}


module.exports = function(){
    return DataDao
}