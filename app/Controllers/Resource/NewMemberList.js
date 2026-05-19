const { getImageUrl } = require("../../Helper");
const _ = require("lodash")

class NewMemberList {

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
        const user = record.ChatRoomUser_UserSlug;
        return {
            "slug": user.slug,
            "user_image": getImageUrl(user.image_url),
            "name": user.name,
        }
    }
}

module.exports = NewMemberList