module.exports = function (app) {

	app.use('/Test', (req, res, next) => {
		res.end("server is running");
	});

	app.use('/User', require('./userController'));
	app.use('/Poem', require('./poemController'));
	app.use('/Comment', require('./commentController'));
	app.use('/Star', require('./starController'));
}