const RestModel = require("./RestModel");
const _ = require("lodash");
const { Op } = require("../Database");

class ChatMessageStatus extends RestModel {
    constructor() {
        super("chat_message_status");
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
        return ["message_id", "chat_room_id"];
    }

    showColumns() {
        return [
            "id",
            "id",
            "user_id",
            "message_id",
            "is_sender",
            "is_read",
            "read_timestamp",
            "createdAt",
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [];
    }

    async createRecord(request, params) {
        let record = [];
        let result = [];
        let user_id;
        let status_record;
        const room_users = (
            await ChatRoomUser.instance().getRoomUsers(params.chat_room_id)
        ).map((item) => item.user_id);

        console.log(room_users);
        if (!_.isEmpty(room_users)) {
            for (let i = 0; i < room_users.length; i++) {
                user_id = room_users[i];
                status_record = {
                    user_id,
                    chat_room_id: params.chat_room_id,
                    message_id: params.message_id,
                    is_sender: user_id === request.user.id,
                    is_read: user_id === request.user.id,
                    read_timestamp: user_id === request.user.id ? new Date() : null,
                };
                record.push(status_record);
            }
            result = await this.orm.bulkCreate(record);
        }

        return result.map((item) => item.toJSON());
    }

    async deleteThreadMessages(user_id, chat_room_id) {
        const record = await this.orm.update(
            { deletedAt: new Date() },
            {
                where: {
                    user_id,
                    chat_room_id,
                },
            }
        );

        return true;
    }

    async deleteChatMessage(user_id, message_id) {
        await this.orm.update(
            { deletedAt: new Date() },
            {
                where: {
                    user_id: user_id,
                    message_id: message_id,
                    deletedAt: null,
                },
            }
        );
        return true;
    }

    /**
     * Mark messages as read (seen) for a user in a chat room.
     * @param {number} user_id - User who read the messages
     * @param {number} chat_room_id - Chat room
     * @param {number} [last_message_id] - Optional. If provided, only messages with message_id <= last_message_id are marked read. If omitted, all unread messages in the room are marked read.
     * @returns {Promise<number>} Number of status rows updated
     */
    async markAsRead(user_id, chat_room_id, last_message_id = null) {
        const where = {
            user_id,
            chat_room_id,
            is_read: false,
            deletedAt: null,
        };
        if (last_message_id != null) {
            where.message_id = { [Op.lte]: last_message_id };
        }
        const [count] = await this.orm.update(
            { is_read: true, read_timestamp: new Date() },
            { where }
        );
        return count;
    }
}

module.exports = ChatMessageStatus;

const ChatRoomUser = require("./ChatRoomUser");
