const { validateAsync } = require("../../Helper");
const RestController = require("../RestController");
const _ = require("lodash");
const UserBlock = require("../../Models/UserBlock");
class UserBlockController extends RestController {
  constructor() {
    super('UserBlock');
    this.resource = "UserBlock";
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
            "block_user_id": "required|integer|exists:users,id",
            "reason": "required|string|min:2|max:1000"
        }
        validator = await validateAsync(this.request.body, rules)
        break;
      case "update":
        rules = {
           // "user_id": "required",
            "block_user_id": "integer|exists:users,id",
            "reason": "string|min:2|max:1000"
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

  /**
   * Unblock a user
   * Soft deletes the block record to unblock the user
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async unblock({ request, response }) {
    try {
      this.request = request;
      this.response = response;

      // Validate request
      const rules = {
        "block_user_id": "required|integer|exists:users,id"
      };
      
      const validator = await validateAsync(this.request.body, rules);
      if (!_.isEmpty(validator) && validator.fails()) {
        return this.sendError(
          this.setValidatorMessagesResponse(validator),
          {},
          400
        );
      }

      const currentUserId = this.request.user.id;
      const blockUserId = parseInt(this.request.body.block_user_id);

      // Prevent self-unblock (though this shouldn't happen)
      if (currentUserId === blockUserId) {
        return this.sendError(
          "You cannot unblock yourself",
          {},
          400
        );
      }

      const blockRecord = await UserBlock.instance().getRecordByCondition(this.request, {
        user_id: currentUserId,
        block_user_id: blockUserId,
      });

      if (_.isEmpty(blockRecord)) {
        return this.sendError(
          "User is not blocked",
          {},
          404
        );
      }

      // Soft delete the block record
      await UserBlock.instance().deleteRecord(this.request, {
        user_id: currentUserId,
        block_user_id: blockUserId,
      }, blockRecord.id);

      return this.sendResponse(
        200,
        "User unblocked successfully",
        {
          "block_user_id": blockUserId,
          "reason": blockRecord.reason,
        }
      );

    } catch (error) {
      console.error("Unblock user error:", error);
      return this.sendError(
        "Internal server error. Please try again later",
        {},
        500
      );
    }
  }

}
module.exports = UserBlockController;