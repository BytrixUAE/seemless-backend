'use strict';

const constants = require('../../config/constants');

const DEFAULT_SMS_SYSTEM = 'Twilio';

class Index {
    static instance() {
        const provider = constants.SMS_SYSTEM || DEFAULT_SMS_SYSTEM;
        const Sms = require('./' + provider);
        return new Sms();
    }
}
module.exports = Index;
