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
                              pw: Joi.string().min(3).max(64).required(),  // length long for bcrypt
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
