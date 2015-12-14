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

            // create

            {
                name: 'create',
                group: internals.requestGroupName,
                comment: 'create user document if valid. \n' +
                         'parameters \n' +
                         '* **userdoc** is user document to be created. \n' +
                         '* **callback(err, newUserDocument)** \n'  +
                         '  - err equals \n' +
                         '    * \'user data invalid.\'\n' +
                         '    * \'username already exists.\'\n' +
                         '    * \'useremail already exists.\'\n' +
                         '    * \'couchdb request failed.\'\n' +
                         '    * \'failed to generate salt.\'\n' +
                         '    * \'failed to generate hash.\'\n' +
                         '    * \'nano failed to insert user document.\' \n' +
                         '  - newUserDocument \n' +
                         '    on success returns details of created document.\n' +
                         '    `{"ok":true,"id":"xxxxx","rev":"1-xxxxx"}`',
                handler: function (userdoc, callback) {

                    sofaInternals.tools.user.validateUser(userdoc, function (err, validUserDocument) {

                        if (err) {
                            return callback('user data invalid.', validUserDocument);
                        }

                        sofaInternals.tools.user.generateUniqueValues(userdoc.username, userdoc.email, function (err, username, email) {

                            // console.log('generateUniqueValues err:' + JSON.stringify(err));
                            if (err) {
                                // err message options:
                                // 'username already exists.'
                                // 'useremail already exists.'
                                // 'couchdb request failed.'

                                return callback(err, null);
                            }


                            //console.log('username.success' +
                            //            '\n\tid: ' + JSON.stringify(username.id) +
                            //            '\n\trev: ' + JSON.stringify(username.rev) +
                            //            'email.success' +
                            //            '\n\tid: ' + JSON.stringify(email.id) +
                            //            '\n\trev: ' + JSON.stringify(email.rev)
                            //           );

                            // generated unique username and useremail.

                            return sofaInternals.tools.user.hashem(userdoc.pw, function (err, hash) {

                                if (err) {

                                    var error = err;

                                    return sofaInternals.tools.user.rollbackUsernameEmail(
                                        username.id,
                                        email.id,
                                        function (err, result1, result2) {

                                            if (err) {
                                                // return callback('rollback failed.', null);
                                                return callback('rollback failed.', null);
                                            }

                                            return callback(error, null);
                                        });
                                }

                                userdoc.pw = hash;

                                // validations passed, create new record.

                                return sofaInternals.db.insert(userdoc, function (err, body) {

                                    if (err) {

                                        // return callback('nano failed to insert user document.', null);
                                        return sofaInternals.tools.user.rollbackUsernameEmail(
                                            username.id,
                                            email.id,
                                            function (err, result1, result2) {

                                                if (err) {
                                                    // return callback('rollback failed.', null);
                                                    return callback('rollback failed.', null);
                                                }

                                                return callback('rolledback unique user data because nano insert failed.', null);
                                            });
                                    }

                                    return callback(null, body);
                                });
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

                    // get existing user record using uuid.
                    // destroy uniqueRecords for the user.
                    // destroy the user document.
                    // ensure document exists.
                    // otherwise, return error document does not exist to delete.

                    sofaInternals.db.destroy(userdocId, revisionId, function (err, result) {

                        if (err) {

                            errors.destroyFailed.nanoMessage = err;
                            return callback(errors.destroyFailed, null);
                        }

                        // console.log('target: ' + result);
                        return callback(null, result);
                    });
                }
            },

            // findByUsername

            {
                name: 'findByUsername',
                group: internals.requestGroupName,
                comment: 'search for user record with value equal to username. \n' +
                         'Utilizes view \'findByUsername\' to search user documents for match. \n' +
                         'uniqueRecords with uuid are not searched. But, this does not search uniqueRecords.\n' +
                         'system requires a [unique username](#tools-user-uniqueUsernameCreate). \n' +
                         '#### parameters: \n' +
                         '* **username** \n' +
                         '  username name to search for in db.\n' +
                         '* **callback(err, record)** \n' +
                         '  - **err**\n' +
                         '    * **null** if match is found. \n' +
                         '    * **0** if no match is found. \n' +
                         '    * **result not unique.** if more than one record returned. \n' +
                         '      Should never happen but test in case error occurs. \n' +
                         '  - **record** \n' +
                         '    * returns the matching user document record.',
                handler: function (username, callback) {

                    sofaInternals.db.view('user', 'findByUsername', { keys: [username] }, function (err, result) {

                        if (err) {
                            errors.findByUsernameFailed.nanoMessage = err;
                            return callback(errors.findByUsernameFailed, null);
                        }

                        if (result.rows.length === 0) {
                            // console.log('tools.user.findByUsername no records found.');
                            return callback(null, 0);
                        } else if (result.rows.length > 1) {
                            return callback('Result not unique.', null);
                        }

                        // @todo return result document.  This is an array.
                        return callback(null, result.rows[0].value);
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
    findByIdFailed: {
        description: 'view.findById failed.',
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
