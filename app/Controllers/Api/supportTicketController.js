
const { validateAll } = require("../../Helper");
const { SUPPORT_TICKET_STATUS_ENUM } = require("../../config/enum");
const RestController = require("../RestController");

class supportTicketController extends RestController {
  constructor() {
    super('supportTicket');
    this.resource = "supportTicket";
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
            // "user_id": "required",
            "first_name": "required",
            "last_name": "required",
            "term": "required",
            "message": "required",
            // "resolved_at": "required"
        }
        validator = await validateAll(this.request.body, rules)
        break;
      case "update":
        rules = {
          //  "user_id": "required",
            "first_name": "string|min:2|max:100",
            "last_name": "string|min:2|max:100",
            "term": "string|min:2|max:150",
            "message": "string|min:2|max:1000",
            "admin_notes": "string|min:2|max:1000",
            // "resolved_at": "required"
            "status": "required|integer|in:" + Object.values(SUPPORT_TICKET_STATUS_ENUM).join(','),
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
    this.request.body.user_id = this.request.user.id;
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
    if(this.request.body.status == SUPPORT_TICKET_STATUS_ENUM.RESOLVED){
      this.request.body.resolved_at = new Date();
    }

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
module.exports = supportTicketController;