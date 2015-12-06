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

                    // sofaInternals.tools.user.testusertool();
                    return callback(null, 'requests.user.test() executed');

                }
            },

            // create

            {
                name: 'create',
                group: internals.requestGroupName,
                comment: 'create user document if valid. \n',
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
            },

            // destroy

            {
                name: 'destroy',
                group: internals.requestGroupName,
                comment: 'destroy user document. \n' +
                         'returns error if the document does not exist.',
                handler: function (userdocId, revisionId, callback) {

                    // ensure document exists.
                    // otherwise, return error document does not exist to delete.

                    sofaInternals.db.destroy(userdocId, revisionId, function (err, result) {

                        if (err) {

                            errors.destroyFailed.nanoMessage = err;
                            return callback(errors.destroyFailed, null);
                        }

                        return callback(null, result);
                    });
                }
            },

            // findByUsername

            {
                name: 'findByUsername',
                group: internals.requestGroupName,
                comment: 'search for user record with username. \n' +
                         'system requires username be unique.',
                handler: function (username, callback) {

                    sofaInternals.db.view('user', 'findByUsername', { keys: [username] }, function (err, result) {

                        if (err) {

                            errors.findByUsernameFailed.nanoMessage = err;
                            return callback(errors.findByUsernameFailed, null);
                        }

                        return callback(null, result);
                    });
                }
            },

            // findByEmail

            {
                name: 'findByEmail',
                group: internals.requestGroupName,
                comment: 'search for user record with email. \n' +
                         'system requires emails are unique.',
                handler: function (email, callback) {

                    sofaInternals.db.view('user', 'findByEmail', { keys: [email] }, function (err, result) {

                        if (err) {
                            errors.findByEmailFailed.nanoMessage = err;
                            return callback(errors.findByEmailFailed, null);
                        }

                        return callback(null, result);
                    });
                }
            },

            // emailExists

            {
                name: 'emailExists',
                group: internals.requestGroupName,
                comment: 'check if email exists. \n' +
                         'system requires emails be unique. \n' +
                         '`callback(err, result)`\n' +
                         '**result** equals **true** or **false**\n',
                handler: function (email, callback) {

                    sofaInternals.db.view('user', 'findByEmail', { keys: [email] }, function (err, result) {

                        if (err) {
                            // nano.view method failed.
                            errors.emailExistsFailed.nanoMessage = err;
                            return callback(errors.emailExistsFailed, null);
                        }

                        if (result.rows.length === 0) {
                            return callback(null, false);
                        }

                        return callback(null, true);
                    });
                }
            },

            // usernameExists

            {
                name: 'usernameExists',
                group: internals.requestGroupName,
                comment: 'check if username exists. \n' +
                         'system requires usernames be unique. \n' +
                         '`callback(err, result)`\n' +
                         '**result** equals **true** or **false**\n',
                handler: function (username, callback) {

                    sofaInternals.db.view('user', 'findByUsername', { keys: [username] }, function (err, result) {

                        if (err) {
                            // nano.view method failed.
                            errors.usernameExistsFailed.nanoMessage = err;
                            return callback(errors.usernameExistsFailed, null);
                        }

                        if (result.rows.length === 0) {
                            return callback(null, false);
                        }

                        return callback(null, true);
                    });
                }
            },

            // updateEmail

            {
                name: 'updateEmail',
                group: internals.requestGroupName,
                comment: 'update email. \n' +
                         'system requires emails to be unique. \n',
                handler: function (docid, newEmail, callback) {

                    sofaInternals.db.atomic('user', 'email', docid, { email: newEmail }, function (err, result) {

                        if (err) {
                            errors.emailUpdateFailed.nanoMessage = err;
                            return callback(errors.emailUpdateFailed, null);
                        }

                        // console.log('**atomic** ' + JSON.stringify(result));
                        return callback(null, result);
                    });
                }
            },

            // updatePassword

            {
                name: 'updatePassword',
                group: internals.requestGroupName,
                comment: 'update password. \n',
                handler: function (docid, newPassword, callback) {

                    sofaInternals.db.atomic('user', 'password', docid, { password: newPassword }, function (err, result) {

                        if (err) {
                            errors.passwordUpdateFailed.nanoMessage = err;
                            return callback(errors.passwordUpdateFailed, null);
                        }

                        // console.log('**atomic** ' + JSON.stringify(result));
                        return callback(null, result);
                    });
                }
            }
        ]);
};


errors = {
    validateUserFailed: {
        description: 'joi user validation failed',
        joiMessage: ''
    },
    hashemFailed: {
        description: 'hashem failed because of bcrypt issues.',
        hashemMessage: ''
    },
    nanoInsertFailed: {
        description: 'nano failed to insert user document.',
        nanoMessage: ''
    },
    destroyFailed: {
        description: 'nano failed to destroy the document.',
        nanoMessage: ''
    },
    findByUsernameFailed: {
        description: 'view.findByUsername failed.',
        nanoMessage: ''
    },
    findByEmailFailed: {
        description: 'findByEmailFailed failed.',
        nanoMessage: ''
    },
    emailExistsFailed: {
        description: 'emailExistsFailed() nano.view.findByEmail failed.',
        nanoMessage: ''
    },
    emailUpdateFailed: {
        description: 'emailUpdateFailed() nano.atomic.update failed.',
        nanoMessage: ''
    },
    passwordUpdateFailed: {
        description: 'passwordUpdateFailed() nano.atomic.update failed.',
        nanoMessage: ''
    },
    usernameExistsFailed: {
        description: 'usernameExistsFailed() nano.view.findByUsername failed.',
        nanoMessage: ''
    }
};
