const _ = require("lodash")

class AppUpdate {

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
            "android_version": record.android_version,
            "ios_version": record.ios_version,
            "force_update": record.force_update
        }
    }
}

module.exports = AppUpdate;