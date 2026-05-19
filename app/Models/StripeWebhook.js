
const _ = require("lodash");
const RestModel = require("./RestModel"); 

class StripeWebhook extends RestModel {

    constructor() {
        super("stripe_webhooks");
    }

    softdelete() {
        return true;
    }
    
    includeShow(){
        return [];
    }
    
    includeIndex(){
        return [];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return ["event_id", "event_type", "object_type", "object_id", "livemode", "api_version", "request_id", "payload", "processed", "processing_error", "subscription_id", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "event_id", "event_type", "object_type", "object_id", "livemode", "api_version", "request_id", "payload", "processed", "processing_error", "subscription_id", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "event_id", "event_type", "object_type", "object_id", "livemode", "api_version", "request_id", "payload", "processed", "processing_error", "subscription_id", "createdAt", "updatedAt", "deletedAt"];
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

module.exports = StripeWebhook;
  