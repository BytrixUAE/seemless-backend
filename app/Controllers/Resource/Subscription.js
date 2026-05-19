
    const _ = require("lodash")

class Subscription {

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
            "package_id": record.package_id,
            "amount": record.amount,
            "start_date": record.start_date,
            "end_date": record.end_date,
            "status": record.status,
            "stripe_subscription_id": record.stripe_subscription_id,
            "stripe_customer_id": record.stripe_customer_id,
            "stripe_payment_intent_id": record.stripe_payment_intent_id,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = Subscription;