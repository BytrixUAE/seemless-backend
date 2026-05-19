const _ = require("lodash");
const RestModel = require("./RestModel"); 

class AppUpdate extends RestModel {

    constructor() {
        super("app_updates");
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
        return ["android_version","ios_version", "force_update", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "android_version","ios_version", "force_update", "createdAt"];
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
   
    }

    async createRecord(request, params) {
        await this.updateOrCreate({deletedAt: null},params);
        return this.getLastRecord();
    }

    async getLastRecord(){
        const result = await this.getModel().findOne({
            order: [['createdAt', 'DESC']],
        });
        return result ? result.toJSON() : null;
    }

}

module.exports = AppUpdate;
  