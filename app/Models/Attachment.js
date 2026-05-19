
const _ = require("lodash");
const RestModel = require("./RestModel"); 
const { Op } = require("../Database");

class Attachment extends RestModel {

    constructor() {
        super("attachments");
    }

    softdelete() {
        return false;
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
        return ["url", "user_id", "type", "duration", "thumbnail", "blur_image", "instance_type", "instance_id", "status", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "url", "user_id", "type", "duration", "thumbnail", "blur_image", "instance_type", "instance_id", "status", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "url", "user_id", "type", "duration", "thumbnail", "blur_image", "instance_type", "instance_id", "status", "createdAt", "updatedAt", "deletedAt"];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
        if (request?.query?.user_id){
            query.where = {
                ...query.where,
                user_id: request?.query?.user_id
            }
        }
        if (request?.query?.type && request?.query?.type.length > 0){
            query.where = {
                ...query.where,
                type: {
                    [Op.in]: request?.query?.type
                }
            }
        }
        if (request?.query?.instance_type){
            query.where = {
                ...query.where,
                instance_type: request?.query?.instance_type
            }
        }
        if (request?.query?.instance_id){
            query.where = {
                ...query.where,
                instance_id: request?.query?.instance_id
            }
        }
    }
    async singleQueryHook(query, request, id){
        query.include = this.includeShow();
    }
    async beforeCreateHook(request, params) {
        params.user_id = request.user.id;
        params.instance_id = params.instance_id ?  params.instance_id : request.user.id;
        // params.instance_type = request.params.instance_type || INSTANCE_TYPE.USER;
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

module.exports = Attachment;
  