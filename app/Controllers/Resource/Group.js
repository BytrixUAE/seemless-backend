const _ = require("lodash");
const { getImageUrl } = require("../../Helper");

class NewGroup {

    static async initResponse(data, request) {
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
        return {
            "chat_room_id": record.id,
            "title": record.title || '',
            "image_url": getImageUrl(record?.image_url),
            "description": record?.description || '',
            "members": record.ChatRoomUser_ChatRoomSlug?.map(item => getImageUrl(item.ChatRoomUser_ChatRoomSlug?.image_url)) || []
        };
    }


}

module.exports = NewGroup