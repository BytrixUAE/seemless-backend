"use strict";

const _ = require("lodash");
const constants = require("../config/constants");

class Controller {

    constructor() {
        this.__is_error = false;
        this.__is_paginate = true;
        this.__collection = true;
    }

    /**
     *
     * @param {*} validator
     * @returns
     */
    async webValidateRequestParams(validator = []) {
        return this.setValidatorMessagesResponse(validator.messages(), 'web');
    }

    /**
     *
     * @param validator
     * @returns {Promise<void>}
     */
    async validateRequestParams(validator = []) {
        if (!_.isEmpty(validator) && validator.fails()) {
            this.__is_error = true;
            this.sendError(
                this.setValidatorMessagesResponse(validator, 'api'),
                {},
                400
            );
            return;
        }
    }

    /**
     *
     * @param {*} messages
     * @returns
     */
    setValidatorMessagesResponse(validator, type = 'api') {
        console.log(validator)
        const error = validator.errors.errors
        let error_messages = error[Object.keys(error)[0]][0];
        return error_messages;
    }

    /**
     *
     * @param code
     * @param message
     * @param data
     * @returns {Promise<void>}
     */
    async sendResponse(code = 200, message = "success", data = []) {


        let links = this.paginateLinks(data);
        let results = data;
        let obj = {};


        if (this.__collection) {
            let resource = this.loadResource();
            results = await resource.initResponse(results, this.request);

            obj.code = code;
            obj.message = message;
            obj.data = results;
            if (this.__is_paginate){
                obj.links = links;
            }
        } else {
            obj.code = code;
            obj.message = message;
            obj.data = results;
            if (this.__is_paginate){
                obj.links = links;
            }
        }
        this.response.status(code).send(obj);
        return;
    }

    /**
    *
    * @param data
    * @returns {{next: null, last: null, prev: null, first: null}|{next: number, per_page: number, total: (number|number), current: number, prev: number}}
    */
    paginateLinks(data) {
        let links = {};
        if (this.__is_paginate) {
            const limit = _.isEmpty(this.request.query?.limit) ? constants.PAGINATION_LIMIT : parseInt(this.request.query.limit)
            const total = parseInt(this.request.query?.total)
            const page = _.isEmpty(this.request.query?.page) ? 1 : parseInt(this.request.query?.page)
            var total_page = Math.ceil(
                total / limit
            );
            links = {
                total: total_page > 0 ? total_page : 1,
                per_page: limit,
                current: page,
                prev: page - 1,
                next: page + 1,
                total_records: total
            };
        } else {
            links = {
                first: null,
                last: null,
                prev: null,
                next: null,
            };
        }
        return links;
    }

    /**
     *
     * @param error
     * @param error_messages
     * @param http_code
     */
    sendError(error = '', error_message = [], http_status_code = 400) {
        let obj = {
            code: http_status_code,
            message: error,
            data: error_message,
        };
        this.response.status(http_status_code).send(obj);
        return;
    }

    /**
     *
     * @returns {*}
     */
    loadResource() {
        return require("./Resource/" + this.resource);
    }
}

module.exports = Controller;