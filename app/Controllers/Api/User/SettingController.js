const _ = require("lodash")

const RestController = require("../../RestController");

class SettingController extends RestController {

    constructor() {
        super('Setting')
        this.resource = 'Setting';
        this.request; //adonis request obj
        this.response; //adonis response obj
        this.params = {}; // this is used for get parameters from url
    }

    async index({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            let record = await this.modal.getLastRecord();
            await this.sendResponse(
                200,
                'Retrieved data successfully!.',
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

}


module.exports = SettingController