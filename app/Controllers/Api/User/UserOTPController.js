const _ = require("lodash")

const { validateAll, extractFields } = require("../../../Helper/index.js");

const RestController = require("../../RestController.js");
const User = require("../../../Models/User.js");
const UserApiToken = require("../../../Models/UserApiToken.js");
const { API_TOKENS_ENUM, OTP_VERIFICATION_TYPE } = require("../../../config/enum.js");


class UserOTPController extends RestController {

    constructor() {
        super("UserOTP")
        this.resource = 'UserOTP';
        this.request; //request obj
        this.response; //response obj
        this.params = {}; // this is used for get parameters from url
    }

    async validation(action, id = 0) {
        let validator = [];
        let rules;
        let customMessages = {
            required: 'You forgot to give a :attribute',
            email: "Invalid Email",
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            same: ":attribute is not same as password"

        }

        switch (action) {
            case "store":
                rules = {
                    email: 'email',
                    mobile_no: 'required_without:email'
                }
                validator = await validateAll(this.request.body, rules)

                break;
            case "update":
                break;
        }
        return validator;
    }

    async beforeStoreLoadModel() {
        const params = this.request.body

        // Validating user by email
        if (params.email) {
            const user = await User.instance().getUserByEmail(params.email);
            if (_.isEmpty(user)) {
                this.__is_error = true;
                return this.sendError(
                    'This email is not associated with any user.',
                    {},
                    400
                );
            }
        }

        // Validating user by mobile number due to empty or invalid email
        if (params.mobile_no) {
            const user = await User.instance().getUserByMobileNo(params.mobile_no);
            if (_.isEmpty(user)) {
                this.__is_error = true;
                return this.sendError(
                    'This mobile no. is not associated with any user.',
                    {},
                    400
                );
            }
        }

    }

    async afterStoreLoadModel() {
        this.__collection = false;
        this.response_message = "OTP Send Successfully";
        return {}
    }


    async verifyOTPRegister({ request, response }) {
        this.request = request;
        this.response = response;

        let params = this.request.body

        /**
         * use email : email and 
         * mobile_no : required_without:email 
         * only when reqgister screen contain optional email or password and not mandatry both
         * 
         */
        const rules = {
            email: 'required_without:mobile_no|email',
            mobile_no: 'required_without:email',
            otp: "required",
            device_type: "required|in:web,android,ios",
            device_token: "required",
        }

        const validator = await validateAll(params, rules)
        const validation_error = await this.validateRequestParams(validator)

        if (this.__is_error)
            return validation_error;

        let user;
        let record;

        if (params.email) {
            record = await this.modal.verifyOTP(request, params)
        }

        if (!_.isEmpty(record)) {
            user = await User.instance().getUserByEmail(params.email);
        }
        else if (params.mobile_no) {
            record = await this.modal.verifyOTP(request, params, OTP_VERIFICATION_TYPE.MOBILE_NO)
        }

        if (_.isEmpty(record)) {
            return this.sendError(
                'Incorrect OTP',
                {},
                400
            )
        }

        if (_.isEmpty(user)) {
            user = await User.instance().getUserByMobileNo(params.mobile_no);
        }

        await User.instance().verifySocial(this.request, user.id)

        params.user_id = user.id;
        await UserApiToken.instance().createRecord(
            request,
            extractFields(
                params,
                UserApiToken.instance().getFields()
            )
        )
        await this.modal.deleteRecord(user.email, user.mobile_no)

        this.resource = 'User'
        this.__is_paginate = false;
        return this.sendResponse(
            200,
            'OTP verified',
            user
        )
    }


    async verifyOTPForgotPassword({ request, response }) {
        this.request = request;
        this.response = response;

        let params = this.request.body

        const rules = {
            email: 'email',
            mobile_no: 'required_without:email',
            otp: "required"
        }

        const validator = await validateAll(params, rules)
        const validation_error = await this.validateRequestParams(validator)

        if (this.__is_error)
            return validation_error;

        let user;
        let record;

        if (params.email) {
            record = await this.modal.verifyOTP(request, params)

        }

        if (!_.isEmpty(record)) {
            user = await User.instance().getUserByEmail(params.email);
        }
        else if (params.mobile_no) {
            record = await this.modal.verifyOTP(request, params, OTP_VERIFICATION_TYPE.MOBILE_NO)
        }

        if (_.isEmpty(record)) {
            return this.sendError(
                'Incorrect OTP',
                {},
                400
            )
        }

        if (_.isEmpty(user)) {
            user = await User.instance().getUserByMobileNo(params.mobile_no);
        }

        const payload = {}
        payload.user_id = user.id;
        payload.type = API_TOKENS_ENUM.RESET
        await UserApiToken.instance().createRecord(
            request,
            payload,
        )
        await this.modal.deleteRecord(user.email, user.mobile_no)

        this.resource = 'ForgotPasswordOTP'
        this.__is_paginate = false;
        return this.sendResponse(
            200,
            'OTP verified',
            {}
        )
    }




}


module.exports = UserOTPController;