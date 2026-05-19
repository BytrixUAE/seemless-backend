const RestModel = require("./RestModel");
const _ = require("lodash");

class ChatRoom extends RestModel {
    constructor() {
        super("chat_rooms");
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
            "id",
            "title",
            "image_url",
            "description",
            "type",
            "members",
            "message_type",
            "message",
            "file_name",
            "file_url",
            "file_thumb",
            "is_forwaded",
            "is_oneTime",
            "is_reply",
            "reply_message_id",
            "is_disappear",
            "disappear_timestamp",
            "is_anonymous",
            "is_admin"
        ];
    }

    showColumns() {
        return [
            "id",
            "type",
            "title",
            "image_url",
            "description",
            "can_memberEditGroup",
            "can_memberSendMessage",
            "can_memberAddMember",
            "last_message_timestamp",
            "is_admin",
            "createdAt",
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [
            "id",
            "type",
            "status",
            "member_limit",
            "createdAt",
        ];
    }

    async beforeCreateHook(request, params) {
        params.user_id = request.user.id;
        params.title = params?.title || CHAT_ROOM_TYPE_ENUM.SINGLE;
        params.type = params.type || CHAT_ROOM_TYPE_ENUM.SINGLE;
        params.image_url =
            params.type === CHAT_ROOM_TYPE_ENUM.GROUP && params?.image_url
                ? removeBaseUrl(params.image_url)
                : null;
        params.member_limit = 1024;
        params.last_message_timestamp = null;
        params.createdAt = new Date();
    }

    async afterCreateHook(record, request, params) {
        let result = record.toJSON();
        result.is_newRoom = result.type === CHAT_ROOM_TYPE_ENUM.SINGLE;
        result.is_newGroup = result.type === CHAT_ROOM_TYPE_ENUM.GROUP;
        result.members = params?.members || [];
        await ChatRoomUser.instance().createRecord(request, result);
    }

    async beforeEditHook(request, params, id) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter((exceptField) => {
            delete params[exceptField];
        });
        params.image_url = params?.image_url
            ? removeBaseUrl(params.image_url)
            : null;
    }

    async getGroupWithMembers(group_id) {
        const record = await this.orm.findOne({
            where: {
                id: group_id,
                type: CHAT_ROOM_TYPE_ENUM.GROUP,
                deletedAt: null,
            },
            include: {
                model: ChatRoomUser.instance().getModel(),
                as: "ChatRoomUser_ChatRoomSlug",
                required: false,
                where: {
                    // status: { [Op.ne]: CHAT_ROOM_STATUS_ENUM.REJECTED },
                    // is_leaved: false,
                    deletedAt: null,
                },
                include: {
                    model: User.instance().getModel(),
                    as: "ChatRoomUser_UserSlug",
                    required: true,
                    where: {
                        deletedAt: null,
                    },
                },
            },
        });
        return _.isEmpty(record) ? {} : record.toJSON();
    }

    async getRoomRecordWithUser(user_id, chat_room_id) {
        const record = await this.orm.findOne({
            where: {
                id: chat_room_id,
                deletedAt: null,
            },
            include: {
                model: ChatRoomUser.instance().getModel(),
                as: "ChatRoomUser_ChatRoomSlug",
                required: true,
                where: {
                    status: { [Op.ne]: CHAT_ROOM_STATUS_ENUM.REJECTED },
                    user_id: user_id,
                    deletedAt: null,
                },
            },
        });
        return _.isEmpty(record) ? {} : record.toJSON();
    }

    async getRoomRecordWithUserDetails(chat_room_id) {
        const record = await this.orm.findOne({
            where: {
                id: chat_room_id,
                deletedAt: null,
            },
            include: {
                model: ChatRoomUser.instance().getModel(),
                as: "ChatRoomUser_ChatRoomSlug",
                required: false,
                where: {
                    status: { [Op.ne]: CHAT_ROOM_STATUS_ENUM.REJECTED },
                    is_leaved: false,
                    is_kicked: false,
                    deletedAt: null,
                },
                include: {
                    model: User.instance().getModel(),
                    as: "ChatRoomUser_UserSlug",
                    required: true,
                    where: {
                        deletedAt: null,
                    },
                },
            },
        });
        return _.isEmpty(record) ? {} : record.toJSON();
    }

    async updateLastMessageTimeStamp(chat_room_id) {
        await this.orm.update(
            { last_message_timestamp: new Date() },
            {
                where: {
                    id: chat_room_id,
                    deletedAt: null,
                },
            }
        );
        return true;
    }
}

module.exports = ChatRoom;

const ChatRoomUser = require("./ChatRoomUser");
const { Op } = require("../Database");
const { removeBaseUrl } = require("../Helper");
const User = require("./User");
const {
    CHAT_ROOM_TYPE_ENUM,
    CHAT_ROOM_STATUS_ENUM,
} = require("../config/enum");
