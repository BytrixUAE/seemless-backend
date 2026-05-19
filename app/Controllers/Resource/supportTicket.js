
    const _ = require("lodash")

class supportTicket {

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
            "user_id": record.user_id,
            "user": record.User || null,
            "first_name": record.first_name,
            "last_name": record.last_name,
            "term": record.term,
            "message": record.message,
            "admin_notes": record.admin_notes || null,
            "status": record.status,
            "resolved_at": record.resolved_at,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = supportTicket;