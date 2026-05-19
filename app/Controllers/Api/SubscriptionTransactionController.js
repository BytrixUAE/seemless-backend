
const { validateAll } = require("../../Helper");
const RestController = require("../RestController");

class SubscriptionTransactionController extends RestController {
  constructor() {
    super('SubscriptionTransaction');
    this.resource = "SubscriptionTransaction";
    this.request; 
    this.response;
    this.params = {};
  }

  /**
   * This function is used for validate restfull request
   * @param $action
   * @param string $slug
   * @return validator response
   */
  async validation(action, slug = '') {
    let validator = [];
    let rules;
    switch (action) {
      case "store":
        rules = {
          "subscription_id": "required",
            "user_id": "required",
            "amount": "required",
            "currency": "required",
            "payment_type": "required",
            "billing_reason": "required",
            "stripe_invoice_id": "required",
            "stripe_payment_intent_id": "required",
            "stripe_charge_id": "required",
            "period_start": "required",
            "period_end": "required",
            "payment_date": "required",
            "metadata": "required",
            "failure_reason": "required",
            "refund_amount": "required",
            "refund_date": "required"
        }
        validator = await validateAll(this.request.body, rules)
        break;
      case "update":
        rules = {
           "subscription_id": "required",
            "user_id": "required",
            "amount": "required",
            "currency": "required",
            "payment_type": "required",
            "billing_reason": "required",
            "stripe_invoice_id": "required",
            "stripe_payment_intent_id": "required",
            "stripe_charge_id": "required",
            "period_start": "required",
            "period_end": "required",
            "payment_date": "required",
            "metadata": "required",
            "failure_reason": "required",
            "refund_amount": "required",
            "refund_date": "required"
        }
        validator = await validateAll(this.request.body, rules);
        break;
    }
    return validator;
  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async beforeIndexLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async afterIndexLoadModel() {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async beforeStoreLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async afterStoreLoadModel(record) {

  }

  /**
    * This function loads before a model load
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async beforeShowLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async afterShowLoadModel(record) {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeUpdateLoadModel() {

  }

  /**
    * This function loads before response send to client
    * @param {object} record
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async afterUpdateLoadModel(record) {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeDestroyLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async afterDestoryLoadModel() {

  }

}
module.exports = SubscriptionTransactionController;