const { baseUrl } = require("../../Helper");
const constants = require("../../config/constants");
const Transporter = require("./Transporter");


class EmailHandler extends Transporter {

    constructor() {
        super();
    }

    async forgotPassword(email, token) {

        const link = baseUrl() + 'web/reset-password/' + token

        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'Reset Password Link!',
            html: `<a href="${link}">${link}</a>`
        }

        const mail = await this.sendMail(mailOptions);

        return true


    }

    async sendOTL(email, token) {
        const link = baseUrl() + 'api/one-time-login/' + token
        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'One Time Login Credentials!',
            html: `<a href="${link}">${link}</a>`
        }
        const mail = await this.sendMail(mailOptions);
        return true

    }

    async sendOTP(email, otp, expireMinutes = 5) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; background-color: #ffffff; font-family: Georgia, 'Times New Roman', serif; color: #000000; font-size: 16px; line-height: 1.6;">
  <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: bold;">OTP Verification</h1>
  <p style="margin: 0 0 16px 0;">Your verification code is: <strong>${otp}</strong></p>
  <p style="margin: 0 0 16px 0;">This code will expire in ${expireMinutes} minute${expireMinutes !== 1 ? 's' : ''}.</p>
  <p style="margin: 0;">Please do not share this code with anyone.</p>
</body>
</html>`;
        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'OTP Verification',
            html
        }

        const mail = await this.sendMail(mailOptions);
        return true
    }

    async sendInviteLink(email, url, username) {
        let mailOptions = {
            from: constants.MAIL_FROM,
            to: email,
            subject: 'Invite link',
            html: `<p>${username} is inviting you to download Kansensus. Sign up now, explore this amazing app, and start earning points!.<br />${url}</p>`
        }

        const mail = await this.sendMail(mailOptions);
        return true


    }




}


module.exports = new EmailHandler()