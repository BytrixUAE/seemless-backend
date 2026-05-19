'use strict';

const constants = require("../../config/constants")

class Twilio {
    constructor() {
        this.account_id = constants.ACCOUNT_SID;
        this.auth_token = constants.AUTH_TOKEN;
        this.client = require('twilio')(this.account_id, this.auth_token);
    }

    async sendOTP(mobile_no, otp) {
        // mobile_no = mobile_no.replace('-', '');
        // mobile_no = mobile_no.replace('+', '');


        // let param = {
        //     To: '+' + mobile_no,
        //     Channel: 'sms'
        // }

        console.log("SEND OTP : ", otp, mobile_no)

        let config = {
            body: "Your OTP code is : " + otp,
            from: "923118401239",
            to: mobile_no
        }

        return await this.client.messages.create(config)
    }

}
module.exports = Twilio;
