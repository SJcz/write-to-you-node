const log4js  = require('log4js');
const path = require('path');

log4js.configure({
	appenders: {
		access_appender: {  //访问日志
			type: 'dateFile', 
			filename: path.join(__dirname, '../log/access'),
			pattern: "-yyyy-MM-dd.log",
			encoding : 'utf-8',
			daysTokeep: 180,
			keepFileExt: false,
			alwaysIncludePattern: true
		},
		error_appender: { //错误日志
			type: 'dateFile',  //类型是日期文件文件
			filename: path.join(__dirname, '../log/error'),
			pattern: "-yyyy-MM-dd.log",
			encoding : 'utf-8',
			daysTokeep: 180,
			keepFileExt: false,
			alwaysIncludePattern: true
		},
		api_appender: { // api 详细日志
			type: 'dateFile', 
			filename: path.join(__dirname, '../log/api'),
			pattern: "-yyyy-MM-dd.log",
			encoding : 'utf-8',
			daysTokeep: 180,
			keepFileExt: false,
			alwaysIncludePattern: true
		},
		out_appender: { //控制台输出
        	type: 'stdout'
		}
 	},
  	categories: {
  		default: { //必须定义一个默认的category
    		appenders: ['out_appender'], level: 'info' 
 		},
    	access_logger: { 
    		appenders: ['access_appender'], level: 'info' 
    	},
    	error_logger: { 
    		appenders: ['error_appender', 'out_appender'], level: 'info' 
    	},
    	api_logger: {
    		appenders: ['api_appender'], level: 'info' 
    	}
  	}
});

var accessLogger = log4js.getLogger('access_logger');
var errorLogger = log4js.getLogger('error_logger');
var apiLogger = log4js.getLogger('api_logger');

module.exports.accessLogger = accessLogger;
module.exports.errorLogger = errorLogger;
module.exports.apiLogger = apiLogger;
