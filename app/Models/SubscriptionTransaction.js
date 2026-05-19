
const _ = require("lodash");
const RestModel = require("./RestModel"); 

class SubscriptionTransaction extends RestModel {

    constructor() {
        super("subscription_transactions");
    }

    softdelete() {
        return true;
    }
    
    includeShow(){
        const Subscription = require("./Subscription");
        const User = require("./User");
        return [
            { model: Subscription.instance().getModel(), as: "Subscription", required: false },
            { model: User.instance().getModel(), as: "User", required: false, attributes: ["id", "firstname", "lastname", "email", "mobile_no"] }
        ];
    }
    
    includeIndex(){
        const Subscription = require("./Subscription");
        return [
            { model: Subscription.instance().getModel(), as: "Subscription", required: false }
        ];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return ["subscription_id", "user_id", "amount", "currency", "payment_type", "billing_reason", "status", "stripe_invoice_id", "stripe_payment_intent_id", "stripe_charge_id", "period_start", "period_end", "payment_date", "metadata", "failure_reason", "refund_amount", "refund_date", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "subscription_id", "user_id", "amount", "currency", "payment_type", "billing_reason", "status", "stripe_invoice_id", "stripe_payment_intent_id", "stripe_charge_id", "period_start", "period_end", "payment_date", "metadata", "failure_reason", "refund_amount", "refund_date", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "subscription_id", "user_id"];
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

module.exports = SubscriptionTransaction;
  