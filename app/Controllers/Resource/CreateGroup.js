const _ = require("lodash");
const { getImageUrl } = require("../../Helper");

class CreateGroup {

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
            "image_url": getImageUrl(record?.image_url),
            "title": record.title || '',
            "description": record.description || ""
        };
    }


}

module.exports = CreateGroup