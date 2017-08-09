'use strict';

const restify = require('restify');
const mongoose = require('mongoose');

const restifyOAuth2 = require('restify-oauth2');



var uristring = process.env.MONGOLAB_URI ||
'mongodb://chatbotph:N3wb3g1nn1ngs@ds127983.mlab.com:27983/gotivation';

mongoose.Promise = global.Promise;
mongoose.connect(uristring, { config: { autoIndex: false } }, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});
if (process.env.NODE_ENV !== 'production') mongoose.set('debug', true);
// server
var server = restify.createServer();
var port = process.env.PORT || 8000;
server.listen(port, function () {
    console.log("restify server listening on " + port);
});
server.use(restify.jsonBodyParser());
server.use(restify.authorizationParser());
server.use(restify.queryParser());

module.exports.server = server;
var jobperminute = require('./src/controllers/job-perminute');

