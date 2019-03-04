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
const fs = require('fs');

function deletePicture (pictures) {
    try {
        if (pictures) {
            pictures.forEach((picture) => {
                if (fs.existsSync(picture.path)) {
                    fs.unlinkSync(picture.path);
                }
            }); 
        }
    } catch (err) {
        errorLogger.info('删除原始上传图片异常', err.stack);
    }
}

router.post('/Create', checkToken, (req, res, next) => {
    console.log(req.files);
    console.log(req.fields);
    var user_id = req.fields.userId;
    var title = req.fields.title;
    var category = req.fields.category;
    var content = req.fields.content;
    var files = req.files;

    var poem_id = 'poem-' + uuid.v1();
    var folderPath = path.join(__dirname, '../upload/poem/' + poem_id);
    var picturePath = [];

    try {
        if (!user_id) {
            throw new Error('userId 不能为空');
        }
        /*
        if (!title) {
            throw new Error('title 不能为空');
        }
        */
        if (!category) {
            throw new Error('category 不能为空');
        }
        if (!content) {
            throw new Error('content 不能为空');
        }

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
        }

        if (files.pictures) {
            if (!Array.isArray(files.pictures)) {
                files.pictures = [files.pictures]; //单文件上传时, 是对象, 多文件上传时, 是数组
            }
            files.pictures.forEach((picture) => {
                var pathArr = picture.path.split(path.sep);
                picturePath.push('poem/' + poem_id + '/' + pathArr[pathArr.length - 1]);
            });
        }
        console.log(picturePath);
    } catch (err) {
        deletePicture(files.pictures);
        return res.json({
            resultCode: 'TYF001',
            message: err.message
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            deletePicture(files.pictures);
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
                'select * from user where user_id = ?', 
                [user_id], 
                function (error, results, fields) {
                    if (error) {
                        deletePicture(files.pictures);
                        connection.release();
                        errorLogger.info('sql操作异常', error.stack);
                        return next(error);
                    }
                    if (results.length == 0) {
                        deletePicture(files.pictures);
                        connection.release();
                        res.json({
                            resultCode: 'WFY008',
                            message: '当前用户不存在'
                        });
                    } else {
                        connection.query(
                            "insert into poem values (?, ?, ? ,?, ?, ?, unix_timestamp(now()), unix_timestamp(now()))",
                            [user_id, poem_id, category, title, content, picturePath.join(',')],
                            function (error2, results2, fields2) {
                                if (error2) {
                                    connection.rollback();
                                    connection.release();
                                    deletePicture(files.pictures);
                                    errorLogger.info('sql操作异常', error2.stack);
                                    return next(error2);
                                }
                                try {
                                    if (files.pictures) {
                                        files.pictures.forEach((picture) => {
                                            var pathArr = picture.path.split(path.sep)
                                            fs.renameSync(picture.path, path.join(folderPath, pathArr[pathArr.length - 1]));
                                        });
                                    }
                                    connection.commit(function () {
                                        connection.release();
                                        res.json({
                                            resultCode: '0',
                                            message: '发布成功'
                                        });
                                    });  
                                } catch (error3) {
                                    connection.rollback();
                                    connection.release();
                                    deletePicture(files.pictures);
                                    errorLogger.info('文件操作异常', error3.stack);
                                    next(error3);
                                }
                            }
                        );
                    }
                }   
            );
        });
    });
});


router.post('/Update', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var title = req.fields.title;
    var poem_id = req.fields.poemId;
    var content = req.fields.content;
    var files = req.files;

    var folderPath = path.join(__dirname, '../upload/poem/' + poem_id);
    var picturePath = [];

    try {
        if (!user_id) {
            throw new Error('userId 不能为空');
        }
        /*
        if (!title) {
            throw new Error('title 不能为空');
        }
        */
        if (!poem_id) {
            throw new Error('poemId 不能为空');
        }
        if (!content) {
            throw new Error('content 不能为空');
        }

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
        }

        if (files.pictures) {
            if (!Array.isArray(files.pictures)) {
                files.pictures = [files.pictures]; //单文件上传时, 是对象, 多文件上传时, 是数组
            }
            files.pictures.forEach((picture) => {
                var pathArr = picture.path.split(path.sep)
                picturePath.push('poem/' + poem_id + '/' + pathArr[pathArr.length - 1]);
            });
        }
        console.log(picturePath);
    } catch (err) {
        deletePicture(files.pictures);
        return res.json({
            resultCode: 'TYF001',
            message: err.message
        });
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            deletePicture(files.pictures);
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
                'select * from poem where user_id = ? and poem_id = ?', 
                [user_id, poem_id], 
                function (error, results, fields) {
                    if (error) {
                        deletePicture(files.pictures);
                        connection.release();
                        errorLogger.info('sql操作异常', error.stack);
                        return next(error);
                    }
                    if (results.length == 0) {
                        deletePicture(files.pictures);
                        connection.release();
                        res.json({
                            resultCode: 'WFY007',
                            message: '权限不足'
                        });
                    } else {
                        connection.query(
                            "update poem set title = ?, content = ?, picture_path = ?, last_update_date = unix_timestamp(now()) where poem_id = ?",
                            [title, content, picturePath.join(','), poem_id],
                            function (error2, results2, fields2) {
                                if (error2) {
                                    connection.rollback();
                                    connection.release();
                                    deletePicture(files.pictures);
                                    errorLogger.info('sql操作异常', error2.stack);
                                    return next(error2);
                                }
                                try {
                                    if (files.pictures) {
                                        files.pictures.forEach((picture) => {
                                            var pathArr = picture.path.split(path.sep)
                                            fs.renameSync(picture.path, path.join(folderPath, pathArr[pathArr.length - 1]));
                                        });
                                    }
                                    connection.commit();
                                    connection.release();
                                    res.json({
                                        resultCode: '0',
                                        message: '修改成功'
                                    });
                                } catch (error3) {
                                    connection.rollback();
                                    connection.release();
                                    deletePicture(files.pictures);
                                    errorLogger.info('文件操作异常', error3.stack);
                                    next(error3);
                                }
                            }
                        );
                    }
                }   
            );
        });
    });
});


/*
router.post('/Delete', checkToken, (req, res, next) => {
    var user_id = req.fields.userId;
    var poem_id = req.fields.poemId;

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

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            'select * from poem where user_id = ? and poem_id = ?', 
            [user_id, poem_id], 
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
                        "delete from poem where poem_id = ?",
                        [poem_id],
                        function (error2, results2, fields2) {
                            connection.release();
                            if (error2) {
                                errorLogger.info('sql操作异常', error2.stack);
                                return next(error2);
                            }
                            res.json({
                                resultCode: '0',
                                message: '删除成功'
                            })
                        }
                    );
                }
            }
        );
    });
});
*/


// 根据点赞数/更新时间排序 star_num/last_update_date
router.post('/ListRecommendPoem', (req, res, next) => {
    var order_by = req.fields.orderBy;
    var category = req.fields.category;
    var user_id = req.fields.userId;

    if (order_by == 'last_update_date') {
        order_by = 'last_update_date desc, star_num desc';
    } else {
        order_by = 'star_num desc, last_update_date desc';
    }

    if (!category) {
        category = 'shqs';
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            ' select n.*, IFNULL(c.num,0) comment_num from (' + 
            ' select b.*, IFNULL(s.num, 0) star_num from ( ' +
            ' select user.*, poem.poem_id, poem.user_id poem_user_id, poem.category, poem.title, poem.content, poem.picture_path, ' +
            ' poem.last_update_date, poem.create_date poem_create_date from poem, user where poem.user_id = user.user_id ' +
            ' and poem.category = "' + category + '") b LEFT JOIN ' +
            ' (select star.poem_id, count(*) num from star group by star.poem_id) s on b.poem_id = s.poem_id ' + 
            ' ) n left join (select comment.poem_id, count(*) num from comment group by comment.poem_id) c on n.poem_id = c.poem_id ' +
            ' order by ' + order_by,
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                var returnResult = [];
                results.forEach((item) => {
                    var obj = {user: {}, poem: {}};
                    obj.user = {
                        mobile_number: item['mobile_number'],
                        user_name: item['user_name'],
                        user_id: item['user_id'],
                        sex: item['sex'],
                        avater: item['avater'],
                        create_date: item['create_date'],
                        last_login_date: item['last_login_date']
                    }
                    obj.poem = {
                        poem_id: item['poem_id'],
                        user_id: item['poem_user_id'],
                        content: item['content'],
                        category: item['category'],
                        picture_path: item['picture_path'] ? item['picture_path'].split(',') : [],
                        create_date: item['poem_create_date'],
                        last_update_date: item['last_update_date'],
                        star_num: item['star_num'],
                        comment_num: item['comment_num'],
                        is_star: false
                    }
                    returnResult.push(obj);
                });
                connection.query(
                    'select * from star where user_id = ?',
                    [user_id],
                    function (error2, results2, fields2) {
                        connection.release();
                        if (error) {
                            errorLogger.info('sql操作异常', error2.stack);
                            return next(error2);
                        }
                        for (var i = 0; i < results2.length; i++) {
                            for (var j = 0; j < returnResult.length; j++) {
                                if (results2[i]['poem_id'] == returnResult[j]['poem']['poem_id']) {
                                    returnResult[j]['poem'].is_star = true;
                                }
                            }
                        }
                        res.json({
                            resultCode: '0',
                            message: '查询成功',
                            data: returnResult
                        });
                    }

                );
            }
        );
    });
});


router.post('/ListPoemByUserId', (req, res, next) => {
    var user_id = req.fields.userId;
    var category = req.fields.category;

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

    pool.getConnection(function(err, connection) {
        if (err) {
            errorLogger.info('得到数据库连接失败', err.stack);
            return next(err);
        }

        connection.query(
            ' select n.*, IFNULL(c.num,0) comment_num from (' + 
            ' select b.*, IFNULL(s.num, 0) star_num from ( ' +
            ' select user.*, poem.poem_id, poem.user_id poem_user_id, poem.category, poem.title, poem.content, poem.picture_path, ' +
            ' poem.last_update_date, poem.create_date poem_create_date from poem, user where poem.user_id = user.user_id ' +
            ' and user.user_id = ? and poem.category = ? ' + 
            ' ) b LEFT JOIN ' +
            ' (select star.poem_id, count(*) num from star group by star.poem_id) s on b.poem_id = s.poem_id ' + 
            ' ) n left join (select comment.poem_id, count(*) num from comment group by comment.poem_id) c on n.poem_id = c.poem_id ' +
            ' order by last_update_date desc, star_num desc',
            [user_id, category],
            function (error, results, fields) {
                if (error) {
                    connection.release();
                    errorLogger.info('sql操作异常', error.stack);
                    return next(error);
                }
                var returnResult = [];
                results.forEach((item) => {
                    var obj = {user: {}, poem: {}};
                    obj.user = {
                        mobile_number: item['mobile_number'],
                        user_name: item['user_name'],
                        user_id: item['user_id'],
                        sex: item['sex'],
                        avater: item['avater'],
                        create_date: item['create_date'],
                        last_login_date: item['last_login_date']
                    }
                    obj.poem = {
                        poem_id: item['poem_id'],
                        user_id: item['poem_user_id'],
                        content: item['content'],
                        category: item['category'],
                        picture_path: item['picture_path'] ? item['picture_path'].split(',') : [],
                        create_date: item['poem_create_date'],
                        last_update_date: item['last_update_date'],
                        star_num: item['star_num'],
                        comment_num: item['comment_num'],
                        is_star: false
                    }
                    returnResult.push(obj);
                });
                connection.query(
                    'select * from star where user_id = ?',
                    [user_id],
                    function (error2, results2, fields2) {
                        connection.release();
                        if (error) {
                            errorLogger.info('sql操作异常', error2.stack);
                            return next(error2);
                        }
                        for (var i = 0; i < results2.length; i++) {
                            for (var j = 0; j < returnResult.length; j++) {
                                if (results2[i]['poem_id'] == returnResult[j]['poem']['poem_id']) {
                                    returnResult[j]['poem'].is_star = true;
                                }
                            }
                        }
                        res.json({
                            resultCode: '0',
                            message: '查询成功',
                            data: returnResult
                        });
                    }

                );
            }
        );
    });
});


router.post('/GetOneSentencePerDay', checkToken, (req, res, next) => {
    var request = https.request('https://v1.hitokoto.cn/?c=b', (response) => {
        var html = '';
        response.on('data', function (data) {
            html += data;
        });
        response.on('end', function () {
            var result = JSON.parse(html);
            res.json({
                resultCode: '0',
                message: '请求成功',
                data: result['hitokoto']
            });    
        });
    });
    request.on('error', function () {
        res.json({
            resultCode: 'WFY010',
            message: 'https请求失败',
            data: '我多想再梦见你'
        });
    });
    request.end();

});

module.exports = router;