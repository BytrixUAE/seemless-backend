
const _ = require('lodash');
const UserModel = require('../Models/User');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants');
const { API_TOKENS_ENUM } = require('../config/enum');

class OTPTokenAuthentication {

    static async authenticate(request, response, next) {
        let headers = request.headers;
        let authorization = headers.authorization;
        let jwt_data;

        if (_.isEmpty(authorization)) {
            let res = {
                code: 401,
                message: "Authorization header is required to access this request",
                data: {}
            }
            response.status(401).send(res);
            return;
        }
        authorization = authorization.replace('Bearer ', '');

        //decode base64 token
        authorization = Buffer.from(authorization, 'base64').toString('ascii')


        //get user by authorization header
        let user = await UserModel.instance().getUserByApiToken(authorization, API_TOKENS_ENUM.RESET);

        console.log("Middleware user : ", user)
        if (_.isEmpty(user)) {
            let res = {
                code: 401,
                message: "Invalid authorization header",
                data: {}
            }
            response.status(401).send(res);
            return;
        }
        //verify jwt
        try {
            jwt_data = await jwt.verify(authorization, constants.JWT_SECRET)
        } catch (err) {
            let res = {
                code: 401,
                message: "Invalid authorization header",
                data: {}
            }
            response.status(401).send(res);
            return;
        }

        request.user = user
        request.authorization = authorization
        await next()
    }
}

module.exports = OTPTokenAuthentication