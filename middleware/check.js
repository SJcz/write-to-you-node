const pool = require('../db/mysqldb').pool;
const errorLogger = require('../util/logUtil').errorLogger;
const jwt = require('jsonwebtoken');
const config = require('config-lite')(__dirname);

module.exports.checkToken = function (req, res, next) {
	var user_id = req.fields.userId;
	var token = req.fields.token;

    console.log(user_id, token);

    next();
    /*
	pool.getConnection((err, connection) => {
		if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            next(err);
        }

        connection.query(
        	'select * from user where user_id = ? and token = ?',
        	[user_id, token],
        	function (error, results, fields) {
               connection.release();
        		if (error) {
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                console.log(results);
                if (results.length == 0) {
                	res.json({
                		resultCode: "WFY009",
                		message: "用户验证失败"
                	})
                } else {
                    //解密token, 检查是否正确
                    jwt.verify(token, config.secret, function (error2, decoded) {
                        if (error2) {
                            errorLogger.info('用户验证失败, token过期或不正确', error2.stack);
                            return next(error2);
                        }
                        next();
                    });
                }
        	}
        );
	});
    */
}