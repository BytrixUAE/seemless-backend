const { baseUrl, getImageUrl } = require("../../Helper");
const _ = require("lodash")

class ChatThreads {

    static async initResponse(data, request) {
        // console.log("Chat Threads Data : ", data?.map(item => item?.ChatMessage_ChatRoomSlug))
        console.log("Chat thread data : ", data)
        if (_.isEmpty(data))
            return Array.isArray(data) ? [] : {};

        let response;
        if (Array.isArray(data)) {
            response = []
            for (var i = 0; i < data.length; i++) {
                response.push(this.jsonSchema(data[i], request));
            }
        } else {
            response = this.jsonSchema(data, request)
        }
        return response;

    }


    static jsonSchema(record, request) {
        const room_record = record.ChatRoomUser_ChatRoomSlug;
        const user_record = record.ChatRoomUser_ChatRoomSlug_Self.find(item => item.user_slug === request.user.slug) || {};

        return {
            "chat_room_id": record.chat_room_id,
            "image_url": getImageUrl(room_record.image_url),
            "room_name": room_record.title || '',
            "members": record.ChatRoomUser_ChatRoomSlug_Self.map(item => {
                const member_record = item.ChatRoomUser_UserSlug
                if (item.is_leaved || item.is_kicked) return null
                return {
                    "id": member_record.id,
                    "name": member_record.name,
                    "image_url": getImageUrl(member_record.image_url),
                }
            }).filter(Boolean),
            "unread_message_count": user_record.unread_message_count,
            "is_admin": user_record.is_owner || user_record.is_subAdmin,
            "is_leaved": user_record.is_leaved,
            "is_kicked": user_record.is_kicked,
        }
    }
}

module.exports = ChatThreads