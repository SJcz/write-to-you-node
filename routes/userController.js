const express = require('express');
const router = express.Router();
const https = require('https');
const qs = require('querystring');
const jwt = require('jsonwebtoken');
const config = require('config-lite')(__dirname);
const pool = require('../db/mysqldb').pool;
const errorLogger = require('../util/logUtil').errorLogger;
const apiLogger = require('../util/logUtil').apiLogger;
const uuid = require('uuid');
const checkToken = require('../middleware/check').checkToken;
const commonUtil = require('../util/commonUtil');
const path = require('path');
const fs = require('fs');

router.get('/GetMobileVerficationCode', (req, res, next) => {
	// to do
    res.end('api is waiting developing...')
});

router.post('/Login', (req, res, next) => {
    var mobile_number = req.fields.mobileNumber;

    if (!mobile_number || !commonUtil.checkMobileNumber(mobile_number)) {
        return res.json({
            resultCode: 'TYF001',
            message: 'mobileNumber 格式不对'
        });
    }

    var token = jwt.sign({msg: 'xxx'}, config.secret, {
        expiresIn:  config.tokenTime 
    });

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            'SELECT * FROM user where mobile_number = ?', 
            [mobile_number], 
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                if (results.length == 0) {
                    var user_name = commonUtil.generateRandomName();
                    var user_id = 'user-' + uuid.v1();
                    var create_date = parseInt(new Date().getTime()/1000);
                    connection.query(
                        'insert into user values (?, ?, ?, ?, ?, null, ?, unix_timestamp(now()))',
                        [mobile_number, user_name, user_id, 'm', token, create_date],
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            res.json({
                                resultCode: '0',
                                message: '登陆成功',
                                user: {
                                    mobile_number: mobile_number,
                                    user_name: user_name,
                                    user_id: user_id,
                                    sex: 'm',
                                    //token: token,
                                    avater: null,
                                    create_date: create_date
                                }
                            });
                        }
                    );
                } else {
                    connection.query(
                        "update user set token = ?, last_login_date = unix_timestamp(now()) where mobile_number = ?",
                        [token, mobile_number],
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                 return next(error2);
                            }
                            
                            res.json({
                                resultCode: '0',
                                message: '登陆成功',
                                user: {
                                    mobile_number: mobile_number,
                                    user_name: results[0]['user_name'],
                                    user_id: results[0]['user_id'],
                                    sex: 'm',
                                    token: token,
                                    avater: results[0]['avater'],
                                    create_date: results[0]['create_date'],
                                }
                            });
                        }
                    );
                }
            }
        );
    });
});

function deletePicture (pictures) {
    try {
        if (pictures) {
            if (fs.existsSync(pictures.path)) {
                fs.unlinkSync(pictures.path);
            }
        }
    } catch (err) {
        errorLogger.info('删除原始上传图片异常', err.stack);
    }
}

router.post('/ChangeUserInfo', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var user_name = req.fields.userName;
    var sex = req.fields.sex; 

    if (!user_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'userId 不能为空'
        });
    }

    if (!user_name) {
        return res.json({
            resultCode: 'TYF001',
            message: 'userName 不能为空'
        });
    }

    if (!sex) {
        return res.json({
            resultCode: 'TYF001',
            message: 'sex 不能为空'
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            'update user set user_name = ?, sex = ? where user_id = ?', 
            [user_name, sex, user_id], 
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                connection.query(
                    'select * from user where user_id = ?',
                    [user_id],
                    function (error2, results2, fields2) {
                        connection.release();
                        if (error2) {
                            errorLogger.info('sql操作异常', error2.stack);
                            return next(error2);
                        }
                        res.json({
                            resultCode: '0',
                            message: '修改成功',
                            user: {
                                mobile_number: results2[0]['mobile_number'],
                                user_name: results2[0]['user_name'],
                                user_id: results2[0]['user_id'],
                                sex: results2[0]['sex'],
                                avater: results2[0]['avater'],
                                create_date: results2[0]['create_date'],
                            }
                        });
                    }
                ); 
            }
        );
    });
});


router.post('/ChangeUserAvater', checkToken, (req, res, next) => {
    apiLogger.info(JSON.stringify(req.fields));
    apiLogger.info(JSON.stringify(req.files));
    apiLogger.info(req.get('content-type'));
    console.log(req.fields);
    console.log(req.files);
    console.log(req.get('content-type'));

    var user_id = req.fields.userId;
    var files = req.files;

    var folderPath = path.join(__dirname, '../upload/user/' + user_id);
    var picturePath = '';

    try {
        if (!user_id) {
            throw new Error('userId 不能为空');
        }

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
        }

        if (files.pictures) {
            var pathArr = files.pictures.path.split(path.sep)
            picturePath = 'user/' + user_id + '/' + pathArr[pathArr.length - 1];
        }
        console.log(picturePath);
    } catch (err) {
        deletePicture(files.pictures);
        return res.json({
            resultCode: 'TYF001',
            message: err.message
        });
    }


    pool.getConnection((err, connection) => {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.beginTransaction(function (transacErr) {
            if (transacErr) {
                deletePicture(files.pictures);
                connection.release();
                errorLogger.info('mysql开启事务失败', transacErr.stack);
                return next(transacErr);
            }
            connection.query(
                'update user set avater = ? where user_id = ?',
                [picturePath, user_id],
                function (error2, results2, fields2) {
                    if (error2) {
                        connection.rollback();
                        connection.release();
                        errorLogger.info('sql操作异常', error2.stack);
                        return next(error2);
                    }
                    try {
                        if (files.pictures) {
                            var pathArr = files.pictures.path.split(path.sep);
                            fs.renameSync(files.pictures.path, path.join(folderPath, pathArr[pathArr.length - 1]));
                        }
                        if (results2.changedRows == 0) {
                            connection.release();
                            return res.json({
                                resultCode: 'WYF008',
                                message: '用户不存在',
                            });
                        }

                        connection.commit();
                        connection.query(
                            'select * from user where user_id = ?',
                            [user_id],
                            function (error4, results4, fields4) {
                                connection.release();
                                if (error4) {
                                    errorLogger.info('sql操作异常', error4.stack);
                                    return next(error4);
                                }
                                res.json({
                                    resultCode: '0',
                                    message: '修改成功',
                                    user: {
                                        mobile_number: results4[0]['mobile_number'],
                                        user_name: results4[0]['user_name'],
                                        user_id: results4[0]['user_id'],
                                        sex: results4[0]['sex'],
                                        avater: results4[0]['avater'],
                                        create_date: results4[0]['create_date'],
                                    }
                                });
                            }
                        ); 
                    } catch (error3) {
                        connection.rollback();
                        connection.release();
                        deletePicture(files.pictures);
                        errorLogger.info('文件操作异常', error3.stack);
                        next(error3);
                    }
                }
            );
        });
    });
});

function sendPostRequest (uri, content, host) {
	var options = {  
        hostname: host,
        port: 443,  
        path: uri,  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept':'application/json;charset=utf-8;' 
        }  
    };
    var req = https.request(options, function (res) {  
        res.setEncoding('utf8');  
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);  
        });  
    }); 
    req.write(content);  
  
    req.end();   
}




module.exports = router;