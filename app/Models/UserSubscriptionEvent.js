const _ = require("lodash");
const RestModel = require("./RestModel");
const { v4: uuidv4 } = require("uuid");

class UserSubscriptionEvent extends RestModel {
    constructor() {
        super("user_subscription_events");
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
        return ["user_id", "subscriber_id", "status","data"];
    }

    showColumns() {
        return ["user_id", "subscriber_id", "status","data"];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return ["id", "createdAt"];
    }

    async beforeCreateHook(request, params) {
        params.createdAt = new Date();
    }
}

module.exports = UserSubscriptionEvent;
