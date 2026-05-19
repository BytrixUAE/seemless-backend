
const _ = require("lodash");
const RestModel = require("./RestModel"); 

class Hobby extends RestModel {

    constructor() {
        super("hobbies");
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
        return ["title", "icon_url", "description", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "title", "icon_url", "description", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "title", "icon_url", "description", "createdAt", "updatedAt", "deletedAt"];
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

module.exports = Hobby;
  