const { baseUrl, getImageUrl } = require("../../Helper");
const _ = require("lodash");
const UserBlock = require("../../Models/UserBlock");

class ChatThreads {
    static async initResponse(data, request) {
        if (_.isEmpty(data)) return data;

        let response;
        if (Array.isArray(data)) {
            response = [];
            for (var i = 0; i < data.length; i++) {
                response.push(await this.jsonSchema(data[i], request));
            }
        } else {
            response = await this.jsonSchema(data, request);
        }
        return response;
    }

    static async jsonSchema(record, request) {
        const user_record =
            record.ChatRoomUser_ChatRoomSlug_Self_Single.ChatRoomUser_UserSlug;
        const my_record = request.user;

        let message_record = record.ChatRoomUser_ChatRoomSlug
            .ChatMessage_ChatRoomSlug.length
            ? record.ChatRoomUser_ChatRoomSlug.ChatMessage_ChatRoomSlug[0]
            : {};
        const message = {};

        if (!_.isEmpty(message_record)) {
            message.id = message_record.id;
            message.message_type = message_record.message_type;
            message.badge_type = message_record.badge_type || "";
            message.file_type = message_record.file_type || "";
            message.message = message_record.message;
            message.file_name = message_record.file_name;
            message.file_url = message_record.file_url;
            message.file_thumb = message_record.file_thumb;
            message.message_timestamp = message_record.message_timestamp;
            message.sender =
                message_record.user_id === my_record.id ? "You" : user_record?.firstname + " " + user_record?.lastname;
            message.createdAt = message_record.createdAt;
        }

        console.log(
            "Message record : ",
            record.ChatRoomUser_ChatRoomSlug.ChatMessage_ChatRoomSlug
        );

        const is_blocked = await UserBlock.isBlocked(my_record.id, user_record.id);

        return {
            chat_room_id: record.chat_room_id,
            user_id: user_record.id,
            image_url: getImageUrl(user_record.image_url),
            room_name: user_record?.firstname + " " + user_record?.lastname || "",
            unread_message_count: record.unread_message_count || 0,
            message: message,
            is_blocked: !!is_blocked,
        };
    }
}

module.exports = ChatThreads;
