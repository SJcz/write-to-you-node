module.exports = {
	port: 10005,
	hostname: '0.0.0.0',
	secret: 'write for you', //生成token的秘匙
	tokenTime: 60 * 60 * 24 * 180, //token 过期时间
	mysqlConfig: {
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'poem_for_you',
		connectionLimit: 20
	}
}



