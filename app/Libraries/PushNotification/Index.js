'use strict';

const constants = require("../../config/constants");

class Index {
    static instance() {
        let Instance = require("./" + constants.NOTIFICATION_DRIVER);
        return new Instance();
    }
}
module.exports = Index
