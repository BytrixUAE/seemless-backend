const _ = require('lodash')
const RestModel = require("./RestModel");



class ResetPassword extends RestModel {

    constructor() {
        super("reset_passwords")
    }


    async createRecord(email, token) {

        const record = await this.orm.create({
            email,
            token,
            createdAt: new Date()
        })

        return record.toJSON()

    }

    async deleteResetPassToken(email, resetPassToken) {

        await this.orm.update(
            {
                deletedAt: new Date(),
            },
            {
                where: {
                    email: email,
                    token: resetPassToken,
                }
            });
        return true

    }

    async getRecordByResetPasswordToken(token) {
        const record = await this.orm.findOne({
            where: {
                token: token,
                deletedAt: null
            }
        })

        return _.isEmpty(record) ? {} : record.toJSON()
    }

}


module.exports = ResetPassword;