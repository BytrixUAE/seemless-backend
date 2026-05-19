const _ = require("lodash")

class Lookup {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        let response = {};

        for (var i = 0; i < data.length; i++) {
            const record = data[i];

            response[record.key] = record.LookupData_LookupSlug?.map(item => {
                return {
                    "id": item.id,
                    "title": item.title
                }
            }) || []
        }

        return response;

    }


}

module.exports = Lookup