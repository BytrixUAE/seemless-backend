const { validateAsync, extractFields } = require("../../Helper");
const RestController = require("../RestController");
const UserRelationship = require("../../Models/UserRelationship");
const { USER_RELATIONSHIP_ACTION_ENUM, NOTIFICATION_TYPES } = require("../../config/enum");
const _ = require("lodash");
const db = require("../../Database");
const { Op } = require("sequelize");
const UserBlock = require("../../Models/UserBlock");

class UserRelationshipController extends RestController {
  constructor() {
    super('UserRelationship');
    this.resource = "UserRelationship";
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
            "connect_id": "required|integer|exists:users,id",
            "status": "required|integer|in:" + Object.values(USER_RELATIONSHIP_ACTION_ENUM).join(','),
            "location": "string|min:2|max:500",
            "latitude": "float",
            "longitude": "float",
        }
        validator = await validateAsync(this.request.body, rules)
        break;
      case "update":
        rules = {
            "status": "required|integer|in:" + Object.values(USER_RELATIONSHIP_ACTION_ENUM).join(','),
            "location": "string|min:2|max:500",
            "latitude": "float",
            "longitude": "float",
        }
        validator = await validateAsync(this.request.body, rules)
        break;
      case "search":
        rules = {
            "location": "string|min:2|max:500",
            "latitude": "required|float",
            "longitude": "required|float",
            "radius": "required|integer|min:1",
        }
        validator = await validateAsync(this.request.body, rules)
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
     * Create/save a new user.
     * POST users
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
  async store({ request, response }) {
    try {
        this.request = request;
        this.response = response;
        
        //validation
        if (_.isFunction(this.validation)) {
            let validator = await this.validation("store");
            if (!_.isEmpty(validator) && validator.fails()) {
                this.sendError(
                    this.setValidatorMessagesResponse(validator),
                    {},
                    400
                )
                return;
            }
        }

        const { connect_id, status, location, latitude, longitude } = request.body;
        const currentUser = request.user.id;

        // Prepare location data (optional fields)
        const locationData = {
            location: location || null,
            latitude: latitude !== undefined ? latitude : null,
            longitude: longitude !== undefined ? longitude : null
        };

        // Use the static method to handle connection action
        const result = await UserRelationship.handleConnectionAction(currentUser, connect_id, status, locationData);

        this.__is_paginate = false;
        await this.sendResponse(
            200,
            result.message || 'Action completed successfully',
            result.relationship || {}
        );

        return;
    }
    catch (err) {
        console.log(err);
        return this.sendError(
            err.message || "Internal server error.Please try again later",
            {},
            err.statusCode || 500
        )
    }
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
       * Create/save a new user.
       * POST users
       *
       * @param {object} ctx
       * @param {Request} ctx.request
       * @param {Response} ctx.response
       */
    async search({ request, response }) {
      try {
          this.request = request;
          this.response = response;
          //validation
          if (_.isFunction(this.validation)) {
              let validator = await this.validation("search");
              if (!_.isEmpty(validator) && validator.fails()) {
                  this.sendError(
                      this.setValidatorMessagesResponse(validator),
                      {},
                      400
                  )
                  return;
              }
          }
          // before store hook
          if (_.isFunction(this.beforeStoreLoadModel)) {
              var hookResponse = await this.beforeStoreLoadModel();
              if (this.__is_error) {
                  return hookResponse;
              }
          }
          let record = await this.modal.searchRecords(this.request, this.request.body);
          let data = record;
          // after store hook
          if (_.isFunction(this.afterStoreLoadModel)) {
              var afterHookResponse = await this.afterStoreLoadModel(record);
              if (typeof afterHookResponse != 'undefined') {
                  record = afterHookResponse;
              }
          }
          this.__is_paginate = false;
          this.resource = 'User'

          await this.sendResponse(
              200,
              this.response_message || 'Search records successfully!.',
              record
          );

          // after store return hook
          if (_.isFunction(this.afterStoreReturnHook)) {
              try { await this.afterStoreReturnHook(data); }
              catch (err) {
                  console.log(err)
              }
          }
          return;
      }
      catch (err) {
          console.log(err);
          return this.sendError(
              "Internal server error.Please try again later",
              {},
              500
          )
      }
    }
    
    async searchOffline({ request, response }) {
      try {
          this.request = request;
          this.response = response;
          //validation
          if (_.isFunction(this.validation)) {
              let validator = await this.validation("search");
              if (!_.isEmpty(validator) && validator.fails()) {
                  this.sendError(
                      this.setValidatorMessagesResponse(validator),
                      {},
                      400
                  )
                  return;
              }
          }
          // before store hook
          if (_.isFunction(this.beforeStoreLoadModel)) {
              var hookResponse = await this.beforeStoreLoadModel();
              if (this.__is_error) {
                  return hookResponse;
              }
          }
          let record = await this.modal.searchRecordsOffline(this.request, this.request.body);
          let data = record;
          // after store hook
          if (_.isFunction(this.afterStoreLoadModel)) {
              var afterHookResponse = await this.afterStoreLoadModel(record);
              if (typeof afterHookResponse != 'undefined') {
                  record = afterHookResponse;
              }
          }
          this.__is_paginate = false;
          this.resource = 'User'

          await this.sendResponse(
              200,
              this.response_message || 'Search records successfully!.',
              record
          );

          // after store return hook
          if (_.isFunction(this.afterStoreReturnHook)) {
              try { await this.afterStoreReturnHook(data); }
              catch (err) {
                  console.log(err)
              }
          }
          return;
      }
      catch (err) {
          console.log(err);
          return this.sendError(
              "Internal server error.Please try again later",
              {},
              500
          )
      }
    }

    /**
     * POST /api/user/user-relationship/search-offline-uuids
     * Body: { uuids: string[] }
     *
     * Sends NEW_ENCOUNTER push notification to the users with given UUIDs.
     */
    async searchUuids({ request, response }) {
      try {
          this.request = request;
          this.response = response;

          const rules = {
              uuids: "required|array|min:1|exists:users,uuid",
          };
          const validator = await validateAsync(this.request.body, rules);
          if (!_.isEmpty(validator) && validator.fails()) {
              this.sendError(
                  this.setValidatorMessagesResponse(validator),
                  {},
                  400
              );
              return;
          }

          const currentUser = request.user.id;
          const uuids = (request.body.uuids || [])
              .filter(v => typeof v === 'string')
              .map(v => v.trim())
              .filter(Boolean);

          const uniqueUuids = [...new Set(uuids)];
          if (uniqueUuids.length === 0) {
              this.__is_paginate = false;
              await this.sendResponse(200, "No uuids provided", { sent: 0, matched: 0 });
              return;
          }

          const blockedRelatedIds = await UserBlock.getBlockedRelatedUserIds(currentUser);
          const idFilter =
              blockedRelatedIds.length > 0
                  ? { [Op.ne]: currentUser, [Op.notIn]: blockedRelatedIds }
                  : { [Op.ne]: currentUser };

          const users = await db.users.findAll({
              where: {
                  deletedAt: null,
                  uuid: { [Op.in]: uniqueUuids },
                  id: idFilter,
              },
              attributes: ["id"],
              raw: true,
          });

          const currentUserName =
              request.user.username ||
              `${request.user.firstname || ''} ${request.user.lastname || ''}`.trim() ||
              request.user.name ||
              "Someone";

          let sent = 0;
          for (const u of users) {
              await UserRelationship.sendNotification(
                  u.id,
                  NOTIFICATION_TYPES.NEW_ENCOUNTER,
                  "New Encounter",
                  `${currentUserName} just crossed your path`,
                  {
                      user_id: currentUser,
                      relationship_id: '',
                  }
              );
              sent += 1;
          }

          this.__is_paginate = false;
          await this.sendResponse(200, "Notifications sent successfully", {
              matched: users.length,
              sent,
          });
          return;
      } catch (err) {
          console.log(err);
          return this.sendError(
              "Internal server error.Please try again later",
              {},
              500
          );
      }
    }
  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeUpdateLoadModel() {
    // Get the relationship ID from params
    const relationshipId = this.request.params.id;
    
    // Find the relationship
    const relationship = await this.modal.getRecordById(this.request, relationshipId);
    
    if (!relationship || !relationship.id) {
      this.__is_error = true;
      this.sendError("Relationship not found", {}, 404);
      return;
    }

    // Store relationship in request for use in update
    this.request.relationship = relationship;
  }

  /**
   * Update user relationship
   * PATCH /api/user/user-relationship/:id
   * Body: { status: number }
   */
  async update({ request, response }) {
    try {
        this.request = request;
        this.response = response;
        this.params = this.request.params;
        
        //validation
        if (_.isFunction(this.validation)) {
            let validator = await this.validation("update", this.params.id);
            if (!_.isEmpty(validator) && validator.fails()) {
                this.sendError(
                    this.setValidatorMessagesResponse(validator),
                    {},
                    400
                )
                return;
            }
        }

        // before update hook
        if (_.isFunction(this.beforeUpdateLoadModel)) {
            var hookResponse = await this.beforeUpdateLoadModel();
            if (this.__is_error) {
                return hookResponse;
            }
        }

        const { status, location, latitude, longitude } = request.body;
        const currentUser = request.user.id;
        const relationship = request.relationship;

        // Determine the other user ID from the relationship
        const connect_id = relationship.user_one_id === currentUser 
            ? relationship.user_two_id 
            : relationship.user_one_id;

        // Prepare location data (optional fields)
        const locationData = {
            location: location || null,
            latitude: latitude !== undefined ? latitude : null,
            longitude: longitude !== undefined ? longitude : null
        };

        // Use the static method to handle connection action
        const result = await UserRelationship.handleConnectionAction(currentUser, connect_id, status, locationData);

        this.__is_paginate = false;
        await this.sendResponse(
            200,
            result.message || 'Action completed successfully',
            result.relationship || {}
        );

        return;
    }
    catch (err) {
        console.log(err);
        return this.sendError(
            err.message || "Internal server error.Please try again later",
            {},
            err.statusCode || 500
        )
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
module.exports = UserRelationshipController;