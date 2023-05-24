var decode = require('jws').decode;
var verify = require('jws').verify;
var sign = require('jws').sign;
var parse = require('querystring').parse;

exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        body: 'Hello, World!'
    };
};