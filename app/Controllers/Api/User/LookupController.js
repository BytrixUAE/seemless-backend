const _ = require("lodash")

const RestController = require("../../RestController");

class LookupController extends RestController {

    constructor() {
        super("Lookup")
        this.resource = 'Lookup';
        this.request;
        this.response;
        this.params = {};
    }

    async afterIndexLoadModel() {
        this.__is_paginate = false;
    }
}

module.exports = LookupController;