const express = require('express');
const formidable = require('express-formidable');
const config = require('config-lite')(__dirname);
const path = require('path');
const log4js = require('log4js');
const accessLogger = require('./util/logUtil').accessLogger;
const errorLogger = require('./util/logUtil').errorLogger;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'upload')));

app.use(log4js.connectLogger(accessLogger, { level: 'info' })); //每次请求都会自动记录到日志里面

app.use(formidable({
	uploadDir: path.join(__dirname, 'upload'),
	multiples: true,
	keepExtensions: true 
}));

require('./routes/entrance')(app);

app.use((err, req, res, next) => {
	errorLogger.info(err, '\n' + req.url + '\n')
	res.json({
		resultCode: 'WFY000',
		message: '服务器异常, 检查日志'
	})
});

app.listen(config.port, config.hostname, function () {
	console.log(`server is running in ${config.hostname}: ${config.port}`)
});

