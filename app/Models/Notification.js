const RestModel = require("./RestModel");
const _ = require("lodash")
const { v4: uuidv4 } = require('uuid');
const PushNotification = require('../Libraries/PushNotification/Index');
const User = require("./User");
const UserApiToken = require("./UserApiToken");
const {Op} = require("sequelize");

class Notification extends RestModel {
    constructor() {
        super("notifications")
    }

    softdelete() {
        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return [
            'user_id','type', 'title', 'message', 'badge', 'mutable_content', 'content_available', 'image_url', 'payload', 'is_read'
        ];
    }


    showColumns() {
        return [
            'id','user_id', 'type', 'title', 'message', 'badge', 'mutable_content', 'content_available', 'image_url', 'payload', 'is_read','createdAt'
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [];
    }

    async indexQueryHook(query, request, slug = {}) {
        query.where = {
            ...query.where,
            user_id: request.user.id,
        };
    }
    async beforeCreateHook(request, params){
        params.is_read = false;
        if (params.payload){
            params.payload = JSON.stringify(params.payload)
        }
    }
    async afterCreateHook(record, request, params) {
        try {
            const userData = await User.instance().getUserByID(record.user_id);
            if (!userData?.push_notification) return;

            const user = await User.instance().getModel().findOne({
                include: [
                    {
                        model: UserApiToken.instance().getModel(),
                        attributes:['device_type','device_token'],
                        required: true,
                        where:{
                            deletedAt: null,
                            device_token:{
                                [Op.not]: null
                            }
                        },
                        order: [['createdAt', 'DESC']]
                    }
                ],
                where:{
                    push_notification: 1,
                    id: record.user_id,
                    deletedAt: null
                },
                raw: true
            });
            let payload = typeof record.payload === 'string' ? JSON.parse(record.payload) : (record.payload || {});
            // FCM data payload must only contain string values
            const dataPayload = {};
            for (const [k, v] of Object.entries(payload)) {
                dataPayload[k] = v == null ? '' : (typeof v === 'string' ? v : JSON.stringify(v));
            }
            if (dataPayload.ref_id === undefined) dataPayload.ref_id = '';
            if (user?.['user_api_tokens.device_token']){
                let push = await PushNotification.instance().sendPushNotification(
                    user['user_api_tokens.device_token'],
                    { title: record.title, body: record.message },
                    dataPayload
                )
                console.log("push===>", push);
            }
        } catch (err) {
            console.log("Error in sending notification : ", err);
        }
    }
    async markAllRead(request){
        await this.orm.update({
            is_read:1
        },{
            where: {
                user_id: request.user.id
            }
        });
        return true;
    }
    async markSingleRead(request){
        await this.orm.update({
            is_read:1
        },{
            where: {
                user_id: request.user.id,
                id: request.params.id
            }
        });
        return true;
    }
    async getUnreadCount(request){
        const totalQuery = {
            where: {
                deletedAt: null,
                user_id: request.user.id,
                is_read: 0
            },
            distinct: true
        }
        let count = await this.orm.count(totalQuery);
        return count;
    }
}

module.exports = Notification;




