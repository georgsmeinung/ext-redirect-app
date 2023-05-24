var decode = require('jws').decode;
var verify = require('jws').verify;
var sign = require('jws').sign;
var parse = require('querystring').parse;
const secret = "this-is-a-very-secret-token";

function processFormData(request, contentType, callback) {
    const FORM_URLENCODED = 'application/x-www-form-urlencoded';
    if(contentType === FORM_URLENCODED) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(parse(body));
        });
    }
    else {
        callback(null);
    }
}

exports.handler = async (event, context) => {
    redirect_uri = event.queryStringParameters.redirect_uri;
    state = event.queryStringParameters.state;
    session_token = event.queryStringParameters.session_token;
    
    const decoded = decode(session_token);
    const verified = verify(session_token, 'HS256', secret);

    if(!verified) {
        return {
            "statusCode": 400,
            "body": "<html><body><h3>400 Bad Request</h3><p>Incoming session token cannot be verified.</p></body></html>"
        }
    }

    if(event.httpMethod === 'POST') {
        processFormData(event.body, event.headers.content-type, result => {
            console.log(result);
            const issuedAt = Math.floor(Date.now() / 1000);
            const payload =  {
                ...decoded.payload,
                state,
                iat: issuedAt,
                exp: issuedAt + (60 * 5), // five minutes
            }
            
            const responseToken = sign({
                header: {
                    alg: 'HS256',
                    typ: 'JWT',
                },
                encoding: 'utf-8',
                payload,
                secret,
            });
            
            return {
                "statusCode": 302,
                "headers": {
                    "Location": `${redirect_uri}?state=${state}&session_token=${responseToken}`
                }
            }
        });
    } else {
        return {
            "statusCode": 501,
            "body": "<html><body><h3>501 Not Implemented</h3><p>The server does not recognize the request method.</p></body></html>"
        }
    }

    return {
        statusCode: 200,
        body: 'Hello, World!'
    };
};