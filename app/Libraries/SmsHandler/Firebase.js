var admin = require("firebase-admin");



class Firebase {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(constants.SERVICE_ACCOUNT)
        });

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
