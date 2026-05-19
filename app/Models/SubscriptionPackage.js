
const _ = require("lodash");
const { Op } = require("sequelize");
const RestModel = require("./RestModel"); 

class SubscriptionPackage extends RestModel {

    constructor() {
        super("subscription_packages");
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
        return ["name", "description", "price", "duration_days", "type", "stripe_price_id", "stripe_product_id", "apple_product_id", "google_product_id", "status", "daily_encounter_limit", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "name", "description", "price", "duration_days", "type", "stripe_price_id", "stripe_product_id", "apple_product_id", "google_product_id", "status", "daily_encounter_limit", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id"];
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

    async getRecordById(request, id) {
        let query = {
            where: {
                deletedAt: null,
                [Op.or]: [
                    { id: id },
                    { apple_product_id: id },
                    { google_product_id: id },
                ],
            },
            attributes: this.showColumns(),
        }
        if (_.isFunction(this.singleQueryHook)) {
            await this.singleQueryHook(query, request, id);
        }

        let record = await this.orm.findOne(query)
        if (!_.isEmpty(record)) {
            return record.toJSON();
        } else {
            return {};
        }
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

module.exports = SubscriptionPackage;
  