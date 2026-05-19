
const _ = require("lodash");
const RestModel = require("./RestModel"); 

class Subscription extends RestModel {

    constructor() {
        super("subscriptions");
    }

    softdelete() {
        return true;
    }
    
    includeShow(){
        const SubscriptionPackage = require("./SubscriptionPackage");
        const User = require("./User");
        return [
            { model: SubscriptionPackage.instance().getModel(), as: "SubscriptionPackage", required: false },
            { model: User.instance().getModel(), as: "User", required: false, attributes: ["id", "firstname", "lastname", "email", "mobile_no"] }
        ];
    }
    
    includeIndex(){
        const SubscriptionPackage = require("./SubscriptionPackage");
        return [
            { model: SubscriptionPackage.instance().getModel(), as: "SubscriptionPackage", required: false }
        ];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return ["user_id", "package_id", "amount", "start_date", "end_date", "status", "stripe_subscription_id", "stripe_customer_id", "stripe_payment_intent_id", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "user_id", "package_id", "amount", "start_date", "end_date", "status", "stripe_subscription_id", "stripe_customer_id", "stripe_payment_intent_id", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "user_id", "package_id", "amount", "start_date", "end_date", "status", "stripe_subscription_id", "stripe_customer_id", "stripe_payment_intent_id", "createdAt", "updatedAt", "deletedAt"];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
    }
    async singleQueryHook(query, request, id){
        query.include = this.includeShow();
    }
    async beforeCreateHook(request, params) {
   
    }
    async beforeEditHook(request, params, slug) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });
    }
    async beforeEditHook(request, params, slug) {
   
    }

}

module.exports = Subscription;
  