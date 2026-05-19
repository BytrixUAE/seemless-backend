const _ = require("lodash");
const { validateAll } = require("../Helper/index.js");
const { PLATFORMS, SUBSCRIPTION_PACKAGE_TYPE_ENUM } = require("../config/enum");
const RestController = require("./RestController.js");
const SubscriptionPackage = require("../Models/SubscriptionPackage");
const Subscriber = require("../Models/Subscriber");

class SubscriberController extends RestController {
    constructor() {
        super("Subscriber");
        this.resource = "Subscriber";
        this.request; //request obj
        this.response; //response obj
        this.params = {}; // this is used for get parameters from url
    }

    async validation(action, id = 0) {
        let validator = [];

        let rules = {
            subscriber_id: "required",
            amount: "required",
            type: "required|in:" + Object.values(SUBSCRIPTION_PACKAGE_TYPE_ENUM).join(","),
            platform: "required|in:" + Object.values(PLATFORMS).join(","),
            transaction_reference: "required"
        };

        switch (action) {
            case "store":
                if (this.request?.body?.platform != null) {
                    this.request.body.platform = String(this.request.body.platform).toLowerCase();
                }
                if (this.request?.body?.type != null) {
                    this.request.body.type = String(this.request.body.type).toLowerCase();
                }
                validator = await validateAll(this.request.body, rules);
                break;
            case "update":
                // validator = await validateAll(this.request.body, rules);
                break;
        }
        return validator;
    }

    async beforeIndexLoadModel() {
        this.__is_paginate = false;
    }

    async beforeStoreLoadModel() {
        /* check ios subscription */
        if (this.request?.body?.platform == PLATFORMS.IOS && this.request?.body?.data) {
            let res = await this.modal.verifyAppleReceipt(this.request?.body?.data, !!this.request?.body?.is_sandbox);
            if (!res) {
                this.__is_error = true;
                return this.sendError("Receipt Data is not verified", {}, 400)
            }
            let where = {
                type: this.request?.body?.type,
                deletedAt: null,
                status: 1
            }
            where[this.request?.body?.platform == PLATFORMS.IOS ? 'apple_product_id' : 'google_product_id'] = this.request?.body?.subscriber_id;
            const subscriptionPackage = await SubscriptionPackage.instance().getModel().findOne({
                where
            });
            
            if(!subscriptionPackage) {
                this.__is_error = true;
                return this.sendError("Package not found", {}, 400)
            }

            this.request.body.package_id = subscriptionPackage?.id;            
        } else if (this.request?.body?.platform == PLATFORMS.ANDROID && this.request?.body?.subscriber_id) {
            const where = {
                type: this.request?.body?.type,
                deletedAt: null,
                status: 1,
                google_product_id: this.request?.body?.subscriber_id,
            };
            const subscriptionPackage = await SubscriptionPackage.instance().getModel().findOne({ where });
            if (!subscriptionPackage) {
                this.__is_error = true;
                return this.sendError("Package not found", {}, 400);
            }
            this.request.body.package_id = subscriptionPackage?.id;
            this.request.body.status = Subscriber.STATUS_ACTIVE;

            // Optional: verify purchase token with Play Developer API when `data` is the purchase token
            // const res = await this.modal.verifyAndroidPurchase(this.request?.body?.data);
        }
    }

    async getSubscription({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            this.__is_paginate = false;
            this.__collection = false;

            let result = await this.modal.getSubscription(request.user.id);
            // console.log("result:",result);
            return this.sendResponse(200, "Record found successfully!", {
                subscription_status: result,
            });
        } catch (e) {
            console.log(e.message);
            return this.sendError("Something went wrong", {}, 500);
        }
    }

    async getActiveSubscription({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            this.__is_paginate = false;
            this.__collection = true;

            let result = await this.modal.getActiveSubscriber(request.user.id);

            if (!result) return this.sendResponse(200, "Record not found !", null);

            //result = result ? result.toJSON() : result;
            return this.sendResponse(200, "Record found successfully!", result);
        } catch (e) {
            console.log(e.message);
            return this.sendError("Something went wrong", {}, 500);
        }
    }

    async getAllSubscriptions({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            this.__is_paginate = false;

            let result = await this.modal.getAllSubscriptions(request.user.id);

            if (!result?.length) return this.sendResponse(400, "Record not found !", []);

            return this.sendResponse(200, "Record found successfully!", result);
        } catch (e) {
            console.log(e.message);
            return this.sendError("Something went wrong", {}, 500);
        }
    }

    async iosSubscriptionWebHook({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            let result = await this.modal.handleAppleSubscriptionWebHook(request);
            return this.sendResponse(200, "successfully!", result);
        } catch (e) {
            console.log(e);
            return this.sendError(e.message, {}, 500);
        }
    }

    async androidSubscriptionWebHook({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            await this.modal.handleAndroidSubscriptionWebHook(request);
            return this.sendResponse(200, "successfully!", {});
        } catch (e) {
            console.log(e);
        }
    }

    async restoreAppleSubscription({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            this.__collection = false;
            this.__is_paginate = false;
            if (request.body?.platform != null) {
                request.body.platform = String(request.body.platform).toLowerCase();
            }
            if (request.body?.type != null) {
                request.body.type = String(request.body.type).toLowerCase();
            }
            // Same shape as POST /subscription/create when a row must be created (iOS or Android)
            const rules = {
                transaction_reference: "required",
                subscriber_id: "required",
                amount: "required",
                type: "required|in:" + Object.values(SUBSCRIPTION_PACKAGE_TYPE_ENUM).join(","),
                platform: "required|in:" + Object.values(PLATFORMS).join(","),
            };
            const validator = await validateAll(request.body, rules);
            const validation_error = this.validateRequestParams(validator);
            if (this.__is_error) return validation_error;

            const res = await this.modal.restoreAppleSubscription(request);
            const message = res ? "restored successfully!" : "the subscription is not associated with the user";
            return this.sendResponse(200, message, res);
        } catch (e) {
            console.log(e);
            return this.sendError(e.message || "Something went wrong", {}, 500);
        }
    }
}

module.exports = SubscriberController;
