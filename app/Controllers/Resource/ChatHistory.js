const _ = require("lodash");
const { getImageUrl } = require("../../Helper");

class ChatHistory {
    static async initResponse(data, request) {
        if (_.isEmpty(data)) return data;

        let response;
        if (Array.isArray(data)) {
            response = [];
            for (var i = 0; i < data.length; i++) {
                response.push(this.jsonSchema(data[i], request));
            }
        } else {
            response = this.jsonSchema(data, request);
        }
        return response.reverse();
    }

    static jsonSchema(record, request) {
        return {
            message_id: record.id,
            chat_room_id: record.chat_room_id,
            user_image: getImageUrl(record.ChatMessage_UserSlug.image_url),
            user_name: record.ChatMessage_UserSlug.name,
            user_id: record.user_id,
            message_type: record.message_type,
            badge_type: record.badge_type || "",
            file_type: record.file_type || "",
            file_name: record.file_name || "",
            file_url: getImageUrl(record.file_url),
            file_thumb: record.file_thumb || "",
            message: record.message || "",
            message_timestamp: record.createdAt,
        };
    }
}

module.exports = ChatHistory;
