
    const _ = require("lodash")

class ReportReason {

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
            "reason": record.reason,
            "description": record.description,
            "is_active": record.is_active,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
    }
}

module.exports = ReportReason;