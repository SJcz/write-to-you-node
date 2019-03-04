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
const path = require('path');

router.post('/Create', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var poem_id = req.fields.poemId;
    var content = req.fields.content;

    if (!user_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'userId 不能为空'
        });
    }

    if (!poem_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'poemId 不能为空'
        });
    }

    if (!content) {
        return res.json({
            resultCode: 'TYF001',
            message: 'content 不能为空'
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            'select * from user where user_id = ?', 
            [user_id], 
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                if (results.length == 0) {
                    connection.release();
                    res.json({
                        resultCode: 'WFY008',
                        message: '当前用户不存在'
                    })
                } else {
                    var comment_id = 'comment-' + uuid.v1();
                    connection.query(
                        "insert into comment values (?, ?, ? ,?, unix_timestamp(now()), unix_timestamp(now()))",
                        [results[0]['user_id'], comment_id, poem_id, content],
                        function (error2, results2, fields2) {
                            if (error2) {
                                connection.release();
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            connection.query(
                                ' select u.*, c.user_id comment_user_id, c.comment_id, c.poem_id, ' + 
                                ' c.content, c.create_date comment_create_date, c.last_update_date ' +
                                ' from user u, comment c where u.user_id = c.user_id' +
                                ' and u.user_id = ? and c.comment_id = ?',
                                [user_id, comment_id],
                                function (error3, results3, fields) {
                                    connection.release();
                                    if (error3) {
                                        errorLogger.info('sql操作异常', error3.stack);
                                        return next(error3);
                                    }
                                    res.json({
                                        resultCode: '0',
                                        message: '发布评论成功',
                                        user: {
                                            mobile_number: results3[0]['mobile_number'],
                                            user_name: results3[0]['user_name'],
                                            user_id: results3[0]['user_id'],
                                            sex: results3[0]['sex'],
                                            avater: results3[0]['avater'],
                                            create_date: results3[0]['create_date'],
                                        },
                                        comment: {  
                                            user_id: results3[0]['comment_user_id'],
                                            poem_id: results3[0]['poem_id'],
                                            content: results3[0]['content'],
                                            create_date: results3[0]['comment_create_date'],
                                            last_update_date: results3[0]['last_update_date']
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            }
        );
    });
});

router.post('/Update', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var comment_id = req.fields.commentId;
    var content = req.fields.content;

    if (!user_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'userId 不能为空'
        });
    }

    if (!comment_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'commentId 不能为空'
        });
    }

    if (!content) {
        return res.json({
            resultCode: 'TYF001',
            message: 'content 不能为空'
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            'select * from comment where user_id = ? and comment_id = ?', 
            [user_id, comment_id], 
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                if (results.length == 0) {
                    connection.release();
                    res.json({
                        resultCode: 'WFY007',
                        message: '权限不足'
                    })
                } else {
                    connection.query(
                        "update comment set content = ?, last_update_date = unix_timestamp(now()) where comment_id = ?",
                        [content, comment_id],
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            res.json({
                                resultCode: '0',
                                message: '更新评论成功'
                            })
                        }
                    );
                }
            }
        );
    });
});

router.post('/Delete', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var comment_id = req.fields.commentId;

    if (!user_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'userId 不能为空'
        });
    }

    if (!comment_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'commentId 不能为空'
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            'select * from comment where user_id = ? and comment_id = ?', 
            [user_id, comment_id], 
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                if (results.length == 0) {
                    connection.release();
                    res.json({
                        resultCode: 'WFY007',
                        message: '权限不足'
                    })
                } else {
                    connection.query(
                        "delete from comment where comment_id = ?",
                        [comment_id],
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            res.json({
                                resultCode: '0',
                                message: '删除评论成功'
                            })
                        }
                    );
                }
            }
        );
    });
});

router.post('/ListCommentByPoemId', (req, res, next) => {
    var poem_id = req.fields.poemId;

    if (!poem_id) {
        return res.json({
            resultCode: 'TYF001',
            message: 'poemId 不能为空'
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            ' select k.*, IFNULL(s.num, 0) star_num from ' +
            ' (select u.*, c.user_id comment_user_id, c.comment_id, c.poem_id, c.content, ' +
            ' c.create_date comment_create_date, c.last_update_date from comment c, poem, user u where c.poem_id = poem.poem_id and c.user_id = u.user_id ' + 
            ' and poem.poem_id = ? ) k ' +
            ' left join (select star.comment_id, count(*) num from star group by star.comment_id) s on k.comment_id = s.comment_id order by k.comment_create_date desc', 
            [poem_id], 
            function (error, results, fields) {
                connection.release();
                if (error) {
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                var returnResult = [];
                results.forEach((item) => {
                    var obj = {user: {}, comment: {}};
                    obj.user = {
                        mobile_number: item['mobile_number'],
                        user_name: item['user_name'],
                        user_id: item['user_id'],
                        sex: item['sex'],
                        avater: item['avater'],
                        create_date: item['create_date'],
                        last_login_date: item['last_login_date']
                    }
                    obj.comment = {
                        user_id: item['comment_user_id'],
                        comment_id: item['comment_id'],
                        poem_id: item['poem_id'],
                        content: item['content'],
                        create_date: item['comment_create_date'],
                        last_update_date: item['last_update_date'],
                        star_num: item['star_num']
                        //is_star: false
                    }
                    returnResult.push(obj);
                });
                res.json({
                    resultCode: '0',
                    message: '查询成功',
                    data: returnResult
                });
            }
        );
    });
});



module.exports = router;