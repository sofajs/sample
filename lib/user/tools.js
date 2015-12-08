var Promise = require('bluebird');
var Hoek = require('hoek');
var Bcrypt = require('bcrypt');
var Joi = require('joi');
var SALT_WORK_FACTOR = 10;

var internals = {};
var errors = {};

var sofaInternals = {};

exports = module.exports = function (sofaInternalsParam) {

    sofaInternals = sofaInternalsParam;

    internals.toolGroup = 'user';

    sofaInternals.tool.register(internals.toolGroup)
    .tooldocs(internals.toolGroup,
        'helpers for working with user data')
        .tools([

            // hashem

            {
                name: 'hashem',
                group: internals.toolGroup,
                comment: 'make bcrypt hash of submitted pw',
                handler: function (password, callback) {

                    return Bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {

                        if (err) {
                            errors.bcrypt.genSaltFailed.bcryptMessage = err;
                            return callback(errors.bcrypt.genSaltFailed, null);
                        }

                        return Bcrypt.hash(password, salt, function (err, hash) {

                            if (err) {
                                errors.bcrypt.hashFailed.bcryptMessage = err;
                                return callback(errors.bcrypt.hashFailed, null);
                            }

                            // return hashed pw

                            return callback(null, hash);
                        });
                    });
                }
            },

            // validateUser

            {
                name: 'validateUser',
                group: internals.toolGroup,
                comment: 'uses [Joi](https://github.com/hapijs/joi) to validate submitted data. \n' +
                '#### returns callback(err, value) \n' +
                ' * err equals null or Joi.validate error message. \n' +
                ' * value equals object which was validated. ',
                handler: function (userDocToValidate, callback) {

                    var userSchema = Joi.object({ // schema required for creating a new user.
                        _id: Joi.string(),
                        _rev: Joi.string(),
                        username: Joi.string().min(8).max(250).required(),
                        // pw: Joi.string().min(3).max(64).required(),  // length long for bcrypt
                        pw: internals.passwordSchema,
                        email: Joi.string().email().required(),
                        first: Joi.string().min(1).max(50).required(),
                        last: Joi.string().min(1).max(50).required(1),
                        scope: Joi.array().items(Joi.string().valid('admin', 'user').required()),
                        loginAttempts: Joi.number().greater(-1).required(),
                        lockUntil: Joi.date().required()
                    });

                    return Joi.validate(userDocToValidate, userSchema, function (err, value) {

                        // err is Joi.validation error message.
                        // value is document being validated.

                        return callback(err, value);

                    });
                }
            },

            // validatePassword

            {
                name: 'validatePassword',
                group: internals.toolGroup,
                comment: 'uses [Joi](https://github.com/hapijs/joi) to validate the password. \n' +
                '#### returns callback(err, result) \n' +
                ' * err equals null or error message. \n' +
                ' * **result** equals **true** or **false**. ',
                handler: function (passwordToValidate, callback) {

                    // var specialCharsRegex = /(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])/;

                    // require
                    // four lowercase
                    // three uppercase
                    // three special chars


                    return Joi.validate(passwordToValidate, internals.passwordSchema, function (err, value) {

                        if (err) {

                            // err is Joi.validation error message.
                            // parse error message

                            if (err.details[0].message.search(/LOWERCASE/) !== -1) {
                                return callback('lowercase letters not valid', false);
                            } else if (err.details[0].message.search(/UPPERCASE/) !== -1) {
                                return callback('uppercase letters not valid', false);
                            } else if (err.details[0].message.search(/SPECIAL_CHARS/) !== -1) {
                                return callback('special characters not valid', false);
                            } else if (err.details[0].message.search(/DIGITS/) !== -1) {
                                return callback('digits not valid', false);
                            }

                            return callback(err, false);
                        }

                        // console.log('validatePassword internal ' + JSON.stringify(err)  + '--'  + JSON.stringify(value));
                        return callback(err, true);
                    });
                }
            },

            // uniqueUsernameCreate

            {
                name: 'uniqueUsernameCreate',
                group: internals.toolGroup,
                comment: 'make new uniqueUsername document. \n' +
                         '\n' +
                         'return **callback(err, document.id, document.rev)** \n' +
                         '* **err**  null or if error returns **\'Username already exists.\'**  \n' +
                         '* **result** on success returns **document.id** and **document.rev** \n' +
                         '  equal to newly created document  _id  and _rev. ',
                handler: function (usernameToCreate, callback) {

                    return sofaInternals.foundation.core.insertid({ description: 'uniqueUsername document.',
                        type: 'username/unique',
                        primary_doc: 0 },
                        'username/' + usernameToCreate,
                        function (err, headers, body) {

                            // if documentid exists insert will fail avoiding duplicates.
                            // couchdb's way to ensure uniqueness.

                            if (err) {

                                if (err.message === 'Document update conflict.') {
                                    return callback('Username already exists.', headers, body);
                                }

                                return callback('Error: foundation.core.insertid failed.', headers, body);
                            }

                            return callback(err, body.id, body.rev);
                        });
                }
            },

            // uniqueUsernameDestroy

            {
                name: 'uniqueDestroy',
                group: internals.toolGroup,
                comment: 'destroy unique document. \n' +
                         '\n' +
                         'return **callback(err, result)** \n' +
                         '* **err**  null or if error returns **\'Document does not exist.\'**  \n' +
                         '  or there was serious failure. \n' +
                         '* **result** on success returns **result** \n' +
                         '  - **result.id** is the destroyed document\'s id value. \n' +
                         '  - **result.rev** is the destroyed document\'s rev value. \n' +
                         '    note, couchdb puts the document in deleted status, but, technically \n' +
                         '    the record is still there. Insert a new document with the same id and \n' +
                         '    the record will be resurrected.',
                handler: function (docnameToDestroy, callback) {

                    return sofaInternals.db.get(docnameToDestroy, null, function (err, body) {

                        if (err) {

                            // couchdb/nano handles id not exist errors differently with get.
                            // example: if the id existed but is deleted err.message === deleted.

                            if (err.message === 'deleted') {
                                return callback('Document does not exist.', body);
                            } else if (err.message === 'missing') {
                                return callback('Document does not exist.', body);
                            }

                            return callback(err, body);
                        }

                        // destroy the document

                        return sofaInternals.db.destroy(body._id, body._rev, function (err, result) {

                            if (err) {

                                return callback(err, null);
                            }

                            return callback(err, result);
                        });
                    });
                }
            },

            {
                name: 'uniqueUsernameDestroy',
                group: internals.toolGroup,
                comment: 'get rid of uniqueUsername document. \n' +
                         'This function alias for uniqueDestroy. \n' +
                         '\n' +
                         'return **callback(err, result)** \n' +
                         '* **err**  null or if error returns **\'Document does not exist.\'**  \n' +
                         '  or there was serious failure. \n' +
                         '* **result** on success returns **result** \n' +
                         '  - **result.id** is the destroyed document\'s id value. \n' +
                         '  - **result.rev** is the destroyed document\'s rev value. \n' +
                         '    note, couchdb puts the document in deleted status, but, technically \n' +
                         '    the record is still there. Insert a new document with the same id and \n' +
                         '    the record will be resurrected.',
                handler: function (usernameToDestroy, callback) {

                    return sofaInternals.tools.user.uniqueDestroy(usernameToDestroy, callback);
                }
            },

            // uniqueUsernameGet

            {
                name: 'uniqueUsernameGet',
                group: internals.toolGroup,
                comment: 'get uniqueUsername document. \n' +
                         'The uniqueUsername document is record with the document._id equal to the \'uniqueUsername\' \n' +
                         'Method can also be used to test if the record exists. \n' +
                         '\n' +
                         'return **callback(err, document)** \n' +
                         '* **err**  null or if error returns **\'Username does not exists.\'**  \n' +
                         '* **result** on success returns **user document record** \n',
                handler: function (usernameToGet, callback) {

                    console.log('uniqueUsernameGet method start' + usernameToGet);
                }
            },

            // uniqueUsernameUpdate

            {
                name: 'uniqueUsernameUpdate',
                group: internals.toolGroup,
                comment: 'update the uniqueUsername of a user. \n' +
                         'user decided to change usernames. \n' +
                         'and create a new userUsername record. \n' +
                         'upon success change destroy the old uniqueUsername record \n' +
                         '\n' +
                         'return **callback(err, document)** \n' +
                         '* **err**  null or if error returns **\'Username does not exists.\'**  \n' +
                         '* **result** on success returns **user document record** \n',
                handler: function (usernameOriginal, usernameNew, callback) {

                    // insertNewUniqueUsername
                    // on success destroy old uniqueUserName.
                    // This allows for other users to begin using the discarded name.
                    console.log('uniqueUsernameUpdate method start' + usernameToGet);
                }
            }
        ]);

    return sofaInternals;
};

errors = {
    bcrypt: {
        genSaltFailed: {
            message: 'Bcrypt.genSalt() failed to generate salt.',
            bcryptMessage: ''
        },
        hashFailed: {
            message: 'Bcrypt.hash() failed to generate the hash.',
            bcryptMessage: ''
        }
    }
};

internals.specialCharsRegex = /(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])/;

internals.passwordSchema = Joi.string()
    .min(3).max(64).required()
    .regex(/([a-z])(.*)([a-z])(.*)([a-z])/, 'LOWERCASE')
    .regex(/([A-Z])(.*)([A-Z])/, 'UPPERCASE')
    .regex(/(\d)(.*)(\d)(.*)(\d)/, 'DIGITS')
    .regex(internals.specialCharsRegex, 'SPECIAL_CHARS');

// started off with really strict schema
// it was unreasonable so simplified to above schema.

internals.specialCharsRegexStrict = /(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])/;

internals.passwordSchemaStrict = Joi.string()
    .min(3).max(64).required()
    .regex(/([a-z])(.*)([a-z])(.*)([a-z])(.*)([a-z])/, 'LOWERCASE')
    .regex(/([A-Z])(.*)([A-Z])(.*)([A-Z])/, 'UPPERCASE')
    .regex(/(\d)(.*)(\d)(.*)(\d)/, 'DIGITS')
    .regex(internals.specialCharsRegexStrict, 'SPECIAL_CHARS');
