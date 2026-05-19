"use strict";
const { extractFields } = require("../Helper/index.js");
const Controller = require("./Controller.js");
const _ = require("lodash");

class RestController extends Controller {

    constructor(modal) {
        super();
        this.modal = this.loadModal(modal);

    }

    /**
     * Show a list of all users.
     * GET users
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     * @param {View} ctx.view
     */
    async index({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            if (_.isFunction(this.validation)) {
                let validator = await this.validation("index");
                if (!_.isEmpty(validator) && validator.fails()) {
                    this.sendError(
                        this.setValidatorMessagesResponse(validator),
                        {},
                        400
                    )
                    return;
                }
            }
            // load before index hook if exist
            if (_.isFunction(this.beforeIndexLoadModel)) {
                var hookResponse = await this.beforeIndexLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            //get records from model
            let params = this.request.body;
            let records = await this.modal.getRecords(this.request, params);
            // load after index hook if exis
            if (_.isFunction(this.afterIndexLoadModel)) {
                var afterHookResponse = await this.afterIndexLoadModel(records);
                if (typeof afterHookResponse != 'undefined') {
                    records = afterHookResponse;
                }
            }
            await this.sendResponse(
                200,
                this.response_message || 'Retrieved data successfully!.',
                records
            );
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
            // before store hook
            if (_.isFunction(this.beforeStoreLoadModel)) {
                var hookResponse = await this.beforeStoreLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            let record = await this.modal.createRecord(this.request, extractFields(this.request.body, this.modal.getFields()));
            let data = record;
            // after store hook
            if (_.isFunction(this.afterStoreLoadModel)) {
                var afterHookResponse = await this.afterStoreLoadModel(record);
                if (typeof afterHookResponse != 'undefined') {
                    record = afterHookResponse;
                }
            }
            this.__is_paginate = false;
            await this.sendResponse(
                200,
                this.response_message || 'Store record successfully!.',
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
     * Display a single user.
     * GET users/:id
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     * @param {View} ctx.view
     */
    async show({ params, request, response }) {
        try {
            this.request = request;
            this.response = response;
            this.params = this.request.params;
            // before show hook
            if (_.isFunction(this.beforeShowLoadModel)) {
                var hookResponse = this.beforeShowLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            let record = await this.modal.getRecordById(this.request, this.params.id);
            // after show hook
            if (_.isFunction(this.afterShowLoadModel)) {
                var afterHookResponse = await this.afterShowLoadModel(record);
                if (typeof afterHookResponse != 'undefined') {
                    record = afterHookResponse;
                }
            }
            this.__is_paginate = false;
            await this.sendResponse(
                200,
                this.response_message || 'Retrieved data successfully!.',
                record
            );


            // after store return hook
            if (_.isFunction(this.afterShowReturnHook)) {
                try { await this.afterShowReturnHook(record); }
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
     * Update user details.
     * PUT or PATCH users/:id
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
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
            //before update hook
            if (_.isFunction(this.beforeUpdateLoadModel)) {
                var hookResponse = await this.beforeUpdateLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            let record = await this.modal.updateRecord(
                this.request,
                extractFields(this.request.body, this.modal.getFields()),
                this.params.id
            );
            //before update hook
            if (_.isFunction(this.afterUpdateLoadModel)) {
                var afterHookResponse = await this.afterUpdateLoadModel(record);
                if (typeof afterHookResponse != 'undefined') {
                    record = afterHookResponse;
                }
            }
            this.__is_paginate = false;
            await this.sendResponse(
                200,
                this.response_message || "Record Updated Successfully",
                record
            );
            return record;
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
     * Delete a user with id.
     * DELETE users/:id
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
    async destroy({ request, response }) {
        try {
            let record = {};
            this.request = request;
            this.response = response;
            this.params = request.params;


            //before destroy hook
            if (_.isFunction(this.beforeDestroyLoadModel)) {
                var hookResponse = await this.beforeDestroyLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            await this.modal.deleteRecord(this.request, this.request.body, this.params.id);
            //after destroy hook
            if (_.isFunction(this.afterDestoryLoadModel)) {
                var afterHookResponse = await this.afterDestoryLoadModel();
                if (typeof afterHookResponse != 'undefined') {
                    record = afterHookResponse;
                }
            }
            this.__is_paginate = false;
            await this.sendResponse(
                200,
                this.response_message || 'Delete record successfully!.',
                record
            );
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
     * Load Model
     * @param name
     * @returns {object} model instance
     */
    loadModal(name) {
        const Model = require("../Models/" + name)
        return Model.instance();
    }
}
module.exports = RestController;
