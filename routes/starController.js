const express = require('express');
const router = express.Router();
const https = require('https');
const qs = require('querystring');
const jwt = require('jsonwebtoken');
const config = require('config-lite')(__dirname);
const pool = require('../db/mysqldb').pool;
const errorLogger = require('../util/logUtil').errorLogger;
const uuid = require('uuid');
const checkToken = require('../middleware/check').checkToken;
const commonUtil = require('../util/commonUtil');

router.post('/AddOrCancel', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var category = req.fields.category;
    var poem_id = req.fields.poemId;
    var comment_id = req.fields.commentId;


    if (!user_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'userId 不能为空'
        });
    }

    if (!category) {
        return res.json({
            resultCode: 'TYF001',
            message: 'category 不能为空'
        });
    }

    if (!poem_id && !comment_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'poemId 和 commentId 不能同时为空'
        });
    }

    console.log('开始从连接池获取连接...');
    pool.getConnection(function(err, connection) {
        console.log('连接池获取连接成功');
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        var selectSql = "";
        var insertSql ="";
        var deleteSql = "";
        var selectBindvar = [];
        var insertBindvar = [];
        var deleteBindvar = []
        if (category == "poem") {
            selectSql = 'select * from star where user_id = ? and category = ? and poem_id = ?';
            insertSql = 'insert into star values (?, ?, ?, null, null, unix_timestamp(now()))';
            deleteSql = 'delete from star where user_id = ? and category = ? and poem_id = ?';
            selectBindvar = insertBindvar = deleteBindvar = [user_id, 'poem', poem_id];
        } else if (category == 'comment') {
            selectSql = 'select * from star where user_id = ? and category = ? and comment_id = ?';
            insertSql = 'insert into star values (?, ?, null, null, ?, unix_timestamp(now()))';
            deleteSql = 'delete from star where user_id = ? and category = ? and comment_id = ?';
            selectBindvar = insertBindvar = deleteBindvar = [user_id, 'comment', comment_id];
        }
        connection.query(
            selectSql,
            selectBindvar, 
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                if (results.length == 0) {
                    connection.query(
                        insertSql,
                        insertBindvar,
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            res.json({
                                resultCode: '0',
                                message: '点赞成功'
                            });
                        }
                    );
                } else {
                    connection.query(
                        deleteSql,
                        deleteBindvar,
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            res.json({
                                resultCode: '0',
                                message: '取消点赞成功'
                            })
                        }
                    );
                }
            }
        );
    });
});

module.exports = router;