const { ATTACHMENT_TYPES, USER_REPORT_STATUS_ENUM } = require("../../config/enum");
const { validateAsync } = require("../../Helper");
const RestController = require("../RestController");
const User = require("../../Models/User");

class UserReportController extends RestController {
  constructor() {
    super('UserReport');
    this.resource = "UserReport";
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
            "reported_user_id": "required|integer|exists:users,id",
            "reason": "required|string|min:2|max:100",
            "notes": "string|min:2|max:1000",
            "attachments": "array",
            "attachments.*.url": "required|string",
            "attachments.*.type": "integer|in:" + Object.values(ATTACHMENT_TYPES).join(","),
        }
        validator = await validateAsync(this.request.body, rules)
        break;
      case "update":
        rules = {
          //  "user_id": "required",
            // "reported_user_id": "required",
            "reason": "string|min:2|max:100",
            "notes": "string|min:2|max:1000",
            "block_reason": "string|min:2|max:1000",
            "status": "integer|in:" + Object.values(USER_REPORT_STATUS_ENUM).join(","),
            "attachments": "array",
            "attachments.*.url": "string",
            "attachments.*.type": "integer|in:" + Object.values(ATTACHMENT_TYPES).join(","),
        }
        validator = await validateAsync(this.request.body, rules);
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
    this.request.body.status = USER_REPORT_STATUS_ENUM.PENDING;
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
    this.request.body.admin_notes = this.request.body.block_reason || null;
  }

  /**
    * This function loads before response send to client
    * @param {object} record
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async afterUpdateLoadModel(record) {
    if(record.status == USER_REPORT_STATUS_ENUM.BLOCKED && record.reported_user_id){
      await User.instance().updateRecord(this.request, {
        is_blocked: true,
        block_reason: this.request.body.block_reason,
      }, record.reported_user_id);
    }
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
module.exports = UserReportController;