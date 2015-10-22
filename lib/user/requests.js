// user/requests.js

var internals = {};
var sofaInternals = {};

exports = module.exports = internals.User = function (sofaInternalsParam) {

    internals.context = this;
    sofaInternals = sofaInternalsParam;

    internals.requestGroupName = 'user';

    sofaInternals.request.register(internals.requestGroupName)
        .requests([

            // test

            {
                name: 'test',
                group: internals.requestGroupName,
                comment: 'test value',
                handler: function (callback) {

                    return callback(null, 'requests.user.test() executed');
                }
            }
        ]);
};
