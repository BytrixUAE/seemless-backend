
    const _ = require("lodash")

class StripeWebhook {

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
            "event_id": record.event_id,
            "event_type": record.event_type,
            "object_type": record.object_type,
            "object_id": record.object_id,
            "livemode": record.livemode,
            "api_version": record.api_version,
            "request_id": record.request_id,
            "payload": record.payload,
            "processed": record.processed,
            "processing_error": record.processing_error,
            "subscription_id": record.subscription_id,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = StripeWebhook;