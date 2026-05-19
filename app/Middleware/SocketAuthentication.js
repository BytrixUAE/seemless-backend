const _ = require('lodash');
const UserModel = require('../Models/User');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

class SocketAuthentication {


    static async authenticate(socket, next) {
        //check authorization header
        let headers = socket.handshake.query;
        let authorization = headers.authorization;
        let jwt_data;

        console.log("Handshake : ", socket.handshake)

        if (_.isEmpty(authorization)) {
            let res = {
                code: 401,
                message: "Authorization header is required to access this request",
                data: {}
            }
            next(new Error(res))
            return
        }
        authorization = authorization.replace('Bearer ', '');

        //decode base64 token
        authorization = Buffer.from(authorization, 'base64').toString('ascii')


        //get user by authorization header
        let user = await UserModel.instance().getUserByApiToken(authorization);

        console.log("Middleware user : ", user)
        console.log('authorization', authorization);
        if (_.isEmpty(user)) {
            let res = {
                code: 401,
                message: "Invalid authorization header",
                data: {}
            }
            next(new Error(res))
            return
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
            next(new Error(res))
            return;
        }
        //check email is verified
        if (!user.is_email_verify && (constants.EMAIL_VERIFICATION == 1)) {
            let res = {
                code: 401,
                message: "Unverified email",
                data: {}
            }
            next(new Error(res))
            return;
        }
        //check mobile no is verified
        // let except_routes = ['/api/user/verify/code', '/api/user/resend/code']
        // if (!except_routes.includes(request.url())) {
        //     if (!user.is_mobile_verify && Env.get('OTP_VERIFICATION') == 1) {
        //         let res = {
        //             code: 401,
        //             message: Antl.formatMessage('messages.unverified_mobile'),
        //             data: {}
        //         }
        //         response.status(401).send(res);
        //         return;
        //     }
        // }

        //check account status is enable
        console.log(!user.is_activated);
        if (user.online_status == "0") {
            let res = {
                code: 403,
                message: "User is deactivated by admin",
                data: {}
            }
            next(new Error(res))
            return;
        }
        socket.user = user
        socket.authorization = authorization
        await next()


    }
}

module.exports = SocketAuthentication