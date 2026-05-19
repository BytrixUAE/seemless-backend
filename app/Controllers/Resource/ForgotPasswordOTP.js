class ForgotPasswordOTP {

    static async initResponse(data, request) {

        let api_token = Buffer.from(request.api_token).toString('base64')

        return {
            "api_token": api_token,
        }

    }
}

module.exports = ForgotPasswordOTP