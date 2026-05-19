'use strict'
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants');
const AdminModel = require('../Models/Admin');

class AdminApiAuthentication {

    static async authenticate(request, response, next) {
        //check authorization header
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
        let user = await AdminModel.instance().getAdminByApiToken(authorization);

        console.log("Middleware user : ", user)
        console.log('authorization', authorization);
        if (_.isEmpty(user)) {
            let res = {
                code: 401,
                message: "Invalid authorization header",
                data: {}
            }
            response.status(401).send(res);
            return;
        }
        console.log('authorization', authorization);
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


module.exports = AdminApiAuthentication

