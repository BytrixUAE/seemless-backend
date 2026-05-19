const { baseUrl, getImageUrl } = require("../../Helper");
const _ = require("lodash");

class ChatMessages {
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
        return response;
    }

    static jsonSchema(record, request) {
        return {
            chat_room_id: record.chat_room_id,
            message_id: record.id,
            message_type: record.message_type,
            badge_type: record.badge_type || "",
            file_type: record.file_type || "",
            message: record.message,
            file_url: getImageUrl(record.file_url),
            file_thumb: record.file_thumb,
            file_name: record.file_name,
            user_id: record.user_id,
            user_image: getImageUrl(request.user.image_url),
            user_name: request.user.name,
            message_timestamp: record.createdAt,
        };
    }
}

module.exports = ChatMessages;
