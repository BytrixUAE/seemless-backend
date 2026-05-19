
const _ = require("lodash")

class Attachment {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

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
            "id": record.id,
            "url": record.url,
            "name": record.url.split("/").pop(),
            "user_id": record.user_id,
            "type": record.type,
            "duration": record.duration,
            "thumbnail": record.thumbnail,
            "blur_image": record.blur_image,
            "instance_type": record.instance_type,
            "instance_id": record.instance_id,
            "status": record.status,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = Attachment;