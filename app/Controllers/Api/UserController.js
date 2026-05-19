'use strict'

const Controller = require("../Controller");
const User = require("../../Models/User");
const _ = require('lodash');
const moment = require('moment');
const UserApiToken = require("../../Models/UserApiToken");
const { validateAll } = require("../../Helper");

class UserController extends Controller {
    // async verifyEmail({ session, response, params }) {
    //     let email = decodeURIComponent(params.email);
    //     email = email.replace('|', '/');
    //     email = Encryption.decrypt(email);
    //     let user = await User.getUserByEmail(email);
    //     if (!_.isEmpty(user)) {
    //         await User.updateUser(
    //             { email: user.email },
    //             { is_email_verify: '1', email_verify_at: new Date() }
    //         );
    //         session.flash({ success: 'Your account has been verified successfully.' })
    //     } else {
    //         session.flash({ error: 'Invalid request' })
    //     }
    //     return response.redirect('/')
    // }

    async resetPassword({ request, response }) {
        const { resetPasswordToken } = request.params;
        const obj = {
            error: "",
            success: "",
        }

        let getResetPassReq = await User.instance().getResetPassReq(resetPasswordToken);
        //check reset password link
        if (_.isEmpty(getResetPassReq)) {
            request.flash("error", "Invalid Password Reset Link")
            response.redirect('/');
            return;
        }

        let expiry_link_date = moment(getResetPassReq.reset_passwords.createdAt).add(1, 'hours');
        //check expiry
        if (moment().unix() > moment(expiry_link_date).unix()) {
            request.flash("error", "Reset Password Link has been expired!.")
            response.redirect('/');
            return;
        }
        //delete all api token
        await UserApiToken.instance().deleteRecord(getResetPassReq.id);

        getResetPassReq.currentRequestToken = resetPasswordToken
        return response.render('reset-password', getResetPassReq);
    }

    async resetPasswordSubmit({ request, response }) {
        const rules = {
            newPassword: 'required|min:8|max:30',
            confirmPassword: 'required|same:newPassword'
        }
        const validation = await validateAll(request.body, rules);

        if (validation.fails()) {
            request.flash('error', this.setValidatorMessagesResponse(validation))
            return response.sendStatus(400);
        }

        try {
            const user = await User.instance().getResetPassReq(request.body.resetPassToken);
            if (_.isEmpty(user)) {
                request.flash('error', 'Invalid Reset Password Token');
                response.redirect('/');
                return
            }
            else {
                await User.instance().updateResetPassword(user, request.body);
                request.flash('success', 'Password has been updated successfully.')
                return response.sendStatus(200)
            }
        }
        catch (err) {
            console.log(err)
            return response.status(400).send("Internal server error.Failed to update password!");
        }

    }



}
module.exports = UserController
