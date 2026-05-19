const { getImageUrl } = require("../../Helper");
const _ = require("lodash")

class AdminProfile {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        this.headers = request.headers;
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
            "name": record.name,
            "firstname": record.firstname || '',
            "lastname": record.lastname || '',
            "email": record.email,
            "mobile_no": record.mobile_no,
            "image_url": getImageUrl(record.image_url),
        }
    }
}

module.exports = AdminProfile;