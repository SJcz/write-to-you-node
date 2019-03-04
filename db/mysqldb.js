const mysql = require('mysql');
const config = require('config-lite')(__dirname);

var pool  = mysql.createPool({
  connectionLimit : config.mysqlConfig.connectionLimit,
  host            : config.mysqlConfig.host,
  user            : config.mysqlConfig.user,
  password        : config.mysqlConfig.password,
  database        : config.mysqlConfig.database,
});

pool.on('acquire', function (connection) {
  console.log('连接 %d 产生了', connection.threadId);
});

pool.on('release', function (connection) {
  console.log('连接 %d 收回了', connection.threadId);
});

pool.on('connection', function (connection) {
  connection.query('SET SESSION auto_increment_increment=1')
});

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot');
});

module.exports.pool = pool;