const _ = require("lodash");
const { getImageUrl } = require("../../Helper");

class Subscriber {
  static async initResponse(data, request) {
    if (_.isEmpty(data)) return Array.isArray(data) ? [] : data;

    let response;
    if (Array.isArray(data)) {
      response = [];
      for (var i = 0; i < data.length; i++) {
        response.push(this.jsonSchema(data[i], request));
      }
    } else {
      response = this.jsonSchema(data, request);
    }
    return response;
  }

  static jsonSchema(record, request) {
    return {
      slug: record.slug,
      user_slug: record.user_slug,
      subscriber_id: record.subscriber_id,
      expiry_date: record.expiry_date,
      amount: record.amount,
      type: record.type,
      status: record.status,
      free_trial: record.free_trial,
      trial_end_at: record.trial_end_at,
      name: record?.user_subscription ? record?.user_subscription?.first_name+" "+ record?.user_subscription?.last_name : null,
    };
  }
}

module.exports = Subscriber;
