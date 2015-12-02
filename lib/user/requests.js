// user/requests.js

var Bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var internals = {};
var errors = {};
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
                comment: 'requests.user.test comments here',
                handler: function (callback) {

                    sofaInternals.tools.user.testusertool();
                    return callback(null, 'requests.user.test() executed');

                }
            },

            // create

            {
                name: 'create',
                group: internals.requestGroupName,
                comment: '#### requests.user.create \n' +
                    'create user document if valid. \n'
                ,
                handler: function (userdoc, callback) {

                    sofaInternals.tools.user.validateUser(userdoc, function (err, value) {

                        if (err) {

                            // invalid user data submitted

                            errors.validateUserFailed.joiMessage = err;

                            return callback(errors.validateUserFailed, value);
                        }

                        // hash pw

                        sofaInternals.tools.user.hashem(userdoc.pw, function (err, hash) {

                            if (err) {
                                errors.hashemFailed.hashemMessage = err;
                                return callback(errors.hashemFailed, null);
                            }

                            userdoc.pw = hash;

                            return sofaInternals.db.insert(userdoc, function (err, body) {

                                if (err) {
                                    errors.nanoInsertFailed.nanoMessage = err;
                                    return callback(errors.nanoInsertFailed, body);
                                }

                                return callback(err, body);
                            });
                        });
                    });
                }
            }
        ]);
};


errors = {
    validateUserFailed: {
        message: 'joi user validation failed',
        joiMessage: ''
    },
    hashemFailed: {
        message: 'hashem failed because of bcrypt issues.',
        hashemMessage: ''
    },
    nanoInsertFailed: {
        message: 'nano failed to insert user document.',
        nanoMessage: ''
    }
};
