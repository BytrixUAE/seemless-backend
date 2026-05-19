
const _ = require("lodash");
const RestModel = require("./RestModel");
const { Op } = require("../Database"); 
const User = require("./User");
class supportTicket extends RestModel {

    constructor() {
        super("support_tickets");
    }

    softdelete() {
        return true;
    }
    
    includeShow(){
        return [
            {
                model: User.instance().getModel(),
                as: 'User',
                attributes: ['id', 'name', 'email', 'mobile_no', 'image_url', 'is_blocked'],
                required: false,
            },
        ];
    }
    
    includeIndex(){
        return [
            {
                model: User.instance().getModel(),
                as: 'User',
                attributes: ['id', 'name', 'email', 'mobile_no', 'image_url', 'is_blocked'],
                required: false,
            },
        ];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return ["user_id", "first_name", "last_name", "term", "message", "admin_notes", "status", "resolved_at", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "user_id", "first_name", "last_name", "term", "message", "admin_notes", "status", "resolved_at", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "user_id"];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
        if(request.query.status){
            query.where.status = request.query.status;
        }
        if(request.query.search){
            query.where.message = {
                [Op.like]: `%${request.query.search}%`
            };
        }
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

module.exports = supportTicket;
  