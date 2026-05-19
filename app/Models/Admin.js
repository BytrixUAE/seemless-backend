const moment = require("moment");
const { v4: uuidv4 } = require('uuid');
const _ = require("lodash")

const User = require("./User");
const UserApiToken = require("./UserApiToken");
const { extractFields, generateHash } = require("../Helper");
const ResetPassword = require("./ResetPassword");
const emailHandler = require("../Libraries/EmailHandler/EmailHandler");
const { ROLES, } = require("../config/enum");

class Admin extends User {

    constructor() {
        super();
    }


    getFields() {
        return [
            'name', 'email', 'password', 'firstname', 'lastname',
        ];
    }

    showColumns() {
        return [
            'id', 'user_type', 'name', 'firstname', 'lastname', 'email', 'image_url',
            "is_email_verify", "email_verifyAt", "is_activated",
        ];
    }

    exceptUpdateField() {
        return [
            'email', 'password', "is_email_verify", "email_verifyAt", "is_activated",
        ]
    }

    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {

    }

    async beforeCreateHook(request, params) {
        params.user_type = ROLES.ADMIN;
        params.name = "admin";
        params.password = generateHash(params.password)
        params.is_email_verify = true;
        params.email_verifyAt = new Date();
        params.createdAt = new Date();
    }

    async afterCreateHook(record, request, params) {
        const userApiToken = UserApiToken.instance();
        await userApiToken.createRecord(request, extractFields(record, userApiToken.getFields()))
    }

    async beforeEditHook(request, params, slug) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });

        if (request?.image_url) {
            params.image_url = request.image_url;
        }

    }


    async forgotPassword(record) {
        let resetPasswordToken = encodeURI(record.id + '|' + moment().valueOf());
        resetPasswordToken = Buffer.from(resetPasswordToken).toString('base64')
        await ResetPassword.instance().createRecord(record.email, resetPasswordToken)

        //send reset password email
        await emailHandler.forgotPassword(record.email, resetPasswordToken);
        return true;
    }


    async getAdminByEmail(email) {
        let query = await this.orm.findOne({
            where: {
                email: email,
                user_type: ROLES.ADMIN,
                deletedAt: null
            }
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }

    async getAdminByApiToken(api_token) {
        let query = await this.orm.findOne({
            where: {
                user_type: ROLES.ADMIN,
                deletedAt: null,
            },
            include: {
                model: UserApiToken.instance().getModel(),
                where: {
                    api_token: api_token,
                    deletedAt: null
                },
                order: [['createdAt', 'DESC']]
            },

        })

        return _.isEmpty(query) ? {} : _.isEmpty(query.toJSON()?.user_api_tokens) ? {} : query.toJSON();
    }


    /**
     * Hook for execute command after delete
     * @param {adonis request object} request
     * @param {payload object} params
     * @param {string} slug
     */
    async afterDeleteHook(request, params, slug) {

    }
}

module.exports = Admin