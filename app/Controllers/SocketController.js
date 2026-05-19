"use strict";

const _ = require("lodash");
const Controller = require("./Controller");
const constants = require("../config/constants");

class SocketController extends Controller {

    constructor() {
        super()
        this.error_emitter = 'error'
    }

    async sendResponse(code = 200, message = "success", data = []) {


        let links = this.paginateLinks(data);
        let results = data;
        let obj = {};


        if (this.__collection) {
            let resource = this.loadResource();
            results = await resource.initResponse(results, this.socket);

            obj.code = code;
            obj.message = message;
            obj.data = results;
            obj.links = links;
            obj.payload = this.socket?.body;
        } else {
            obj.code = code;
            obj.message = message;
            obj.data = results;
            obj.links = links;
            obj.payload = this.socket?.body;
        }


        for (let i = 0; i < this.emitter.length; i++) {
            const fn = this.emitter[i];
            fn(obj)
        }

        this.emitter.length = 0;
        return
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
        this.socket.emit(this.error_emitter, obj);
        return;
    }

    paginateLinks(data) {
        let links = {};
        if (this.__is_paginate) {
            const limit = (_.isEmpty(this.socket.query) || !this.socket.query?.limit) ? constants.PAGINATION_LIMIT : parseInt(this.socket.query.limit)
            const total = parseInt(this.socket.query?.total)
            const page = (_.isEmpty(this.socket.query) || !this.socket.query?.page) ? 1 : parseInt(this.socket.query?.page)
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

}
module.exports = SocketController;
