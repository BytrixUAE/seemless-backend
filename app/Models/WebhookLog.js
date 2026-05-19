const _ = require("lodash");
const RestModel = require("./RestModel");
const { v4: uuidv4 } = require("uuid");

class WebhookLog extends RestModel {
    constructor() {
        super("webhook_logs");
    }

    softdelete() {
        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return ["data", "platform"];
    }

    showColumns() {
        return ["data", "platform"];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return ["id", "createdAt"];
    }

    async beforeCreateHook(request, params) {
    }
}

module.exports = WebhookLog;
