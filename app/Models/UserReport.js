
const _ = require("lodash");
const RestModel = require("./RestModel"); 
const { Op } = require("../Database");
const { INSTANCE_TYPES } = require("../config/enum");
const User = require("../Models/User");
const Attachment = require("../Models/Attachment");

class UserReport extends RestModel {

    constructor() {
        super("user_reports");
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
            {
                model: User.instance().getModel(),
                as: 'ReportedUser',
                attributes: ['id', 'name', 'email', 'mobile_no', 'image_url', 'is_blocked'],
                required: false,
            },
            {
                model: Attachment.instance().getModel(),
                as: 'UserReportAttachments',
                attributes: ['id', 'url', 'type'],
                required: false,
            }
        ];
    }
    
    includeIndex(){
        return [
            {
                model: Attachment.instance().getModel(),
                as: 'UserReportAttachments',
                attributes: ['id', 'url', 'type'],
                required: false,
            },
            {
                model: User.instance().getModel(),
                as: 'User',
                attributes: ['id', 'name', 'email', 'mobile_no', 'is_blocked'],
                required: false,
            },
            {
                model: User.instance().getModel(),
                as: 'ReportedUser',
                attributes: ['id', 'name', 'email', 'mobile_no', 'is_blocked'],
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
        return ["user_id", "reported_user_id", "reason", "notes", "admin_notes", "status", "createdAt", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "user_id", "reported_user_id", "reason", "notes", "admin_notes", "status", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "user_id", "reported_user_id"];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
        if(request.query.user_id){
            query.where.user_id = request.query.user_id;
        }
        if(request.query.reported_user_id){
            query.where.reported_user_id = request.query.reported_user_id;
        }
        if(request.query.status){
            query.where.status = request.query.status;
        }
        if(request.query.search){
            query.where = {
                ...query.where,
                [Op.or]: [
                    { reason: { [Op.like]: `%${request.query.search}%` } },
                    { notes: { [Op.like]: `%${request.query.search}%` } }
                ]
            };
        }
    }
    async singleQueryHook(query, request, id){
        query.include = this.includeShow();
    }
    async beforeCreateHook(request, params) {
   
    }
    async afterCreateHook(record, request, params) {
        if(request.body.attachments && request.body.attachments.length > 0){
            for(const attachment of request.body.attachments){
                await Attachment.instance().createRecord(request, {
                    url: attachment.url,
                    type: attachment.type,
                    instance_type: INSTANCE_TYPES.USER_REPORT,
                    instance_id: record.id,
                    user_id: request.user.id,
                });
            }
        }
    }

    async beforeEditHook(request, params, slug) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });
    }
    async beforeEditHook(request, params, slug) {
   
    }

    async afterEditHook(record, request, params) {
        if(request.body.attachments && request.body.attachments.length > 0){
            await Attachment.instance().deleteRecordByCondition(request, {
                instance_type: INSTANCE_TYPES.USER_REPORT,
                instance_id: record.id,
            });

            for(const attachment of request.body.attachments){
                await Attachment.instance().createRecord(request, {
                    url: attachment.url,
                    type: attachment.type,
                    instance_type: INSTANCE_TYPES.USER_REPORT,
                    instance_id: record.id,
                    user_id: request.user.id,
                });
            }
        }
    }
}

module.exports = UserReport;
  