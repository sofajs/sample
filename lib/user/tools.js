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

                                  // console.log(err);
                                  // console.log(err.name);
                                  // console.log(err.details[0].message);
                                  // console.log(err.details[0].message.search(/LOWERCASE/));

                                  if (err.details[0].message.search(/LOWERCASE/) !== -1) {
                                      return callback('lowercase letters not valid', false);
                                  } else if (err.details[0].message.search(/UPPERCASE/) !== -1) {
                                      return callback('uppercase letters not valid', false);
                                  } else if (err.details[0].message.search(/SPECIAL_CHARS/) !== -1) {
                                      return callback('special characters not valid', false);
                                  } else if (err.details[0].message.search(/DIGITS/) !== -1) {
                                      return callback('digits not valid', false);
                                  }

                                  return callback('disaster caputso', false);
                              }

                              // console.log('validatePassword internal ' + JSON.stringify(err)  + '--'  + JSON.stringify(value));
                              return callback(err, true);
                          });
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

internals.specialCharsRegex = /(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])(.*)([~`!@#$%^&*()\-_+={}\]\[|\\:;"'<>\.,?\/])/;

internals.passwordSchema = Joi.string()
    .min(3).max(64).required()
    .regex(/([a-z])(.*)([a-z])(.*)([a-z])(.*)([a-z])/, 'LOWERCASE')
    .regex(/([A-Z])(.*)([A-Z])(.*)([A-Z])/, 'UPPERCASE')
    .regex(/(\d)(.*)(\d)(.*)(\d)/, 'DIGITS')
    .regex(internals.specialCharsRegex, 'SPECIAL_CHARS');
