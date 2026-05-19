'use strict'


const _ = require('lodash');
const UserModel = require('../Models/User');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants');


module.exports = async (request, response, next) => {
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
    let user = await UserModel.instance().getUserByApiToken(authorization);

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
    //check email is verified
    if (!user.is_email_verify && (constants.EMAIL_VERIFICATION == 1)) {
        let res = {
            code: 401,
            message: "Verify your email.",
            data: {}
        }
        response.status(401).send(res);
        return;
    }
    //check mobile no is verified
    if (!user.is_mobile_verify && (constants.SMS_VERIFICATION == 1)) {
        let res = {
            code: 401,
            message: 'Verify your mobile no',
            data: {}
        }
        response.status(401).send(res);
        return;
    }

    //check account status is enable
    if (!user.is_activated) {
        let res = {
            code: 401,
            message: "You have been de-activated by Admin. Kindly contact the administrator",
            data: {}
        }
        response.status(401).send(res);
        return;
    }

    if (user.is_blocked) {
        let res = {
            code: 401,
            message: "You have been blocked by Admin. Kindly contact the administrator.",
            data: {}
        }
        response.status(401).send(res);
        return;
    }

    request.user = user
    request.authorization = authorization
    await next()
}

