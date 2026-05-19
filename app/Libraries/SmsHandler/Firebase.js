var admin = require("firebase-admin");
const constants = require("../../config/constants");

class Firebase {
    constructor() {
        if (!constants.SERVICE_ACCOUNT) {
            throw new Error('Firebase SERVICE_ACCOUNT is not configured in environment variables.');
        }
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(constants.SERVICE_ACCOUNT)
            });
        }
    }


    async sendOTP(registrationToken, otp) {

        var payload = {
            notification: {
                title: "Game App - OTP Verification",
                body: "Your otp code is : " + otp,
            }
        };

        var options = {
            priority: "high",
            timeToLive: 60 * 60 * 24
        };

        return await admin.messaging().sendToDevice(registrationToken, payload, options)
            .then(function (response) {
                console.log("Successfully sent message:", response);
            })
            .catch(function (error) {
                console.log("Error sending message:", error);
            });
    }
}

module.exports = Firebase;
