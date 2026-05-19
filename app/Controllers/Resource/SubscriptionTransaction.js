
    const _ = require("lodash")

class SubscriptionTransaction {

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
            "subscription_id": record.subscription_id,
            "user_id": record.user_id,
            "amount": record.amount,
            "currency": record.currency,
            "payment_type": record.payment_type,
            "billing_reason": record.billing_reason,
            "status": record.status,
            "stripe_invoice_id": record.stripe_invoice_id,
            "stripe_payment_intent_id": record.stripe_payment_intent_id,
            "stripe_charge_id": record.stripe_charge_id,
            "period_start": record.period_start,
            "period_end": record.period_end,
            "payment_date": record.payment_date,
            "metadata": record.metadata,
            "failure_reason": record.failure_reason,
            "refund_amount": record.refund_amount,
            "refund_date": record.refund_date,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = SubscriptionTransaction;