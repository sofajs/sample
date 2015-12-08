var Code = require('code');
var Lab = require('lab');
var Joi = require('joi');
// var Sofajs = require('sofajs');

var Sofajs = require('../../../sofajs/lib');
var Composer = require('../../lib/sofafest');

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

var internals = {};
var database = Sofajs.init(Composer.manifest, Composer.composeOptions);

describe('tools.user', function () {

    it('tools.user.hashem Bcrypt.genSalt failed', function (done) {

        var Bcrypt = require('bcrypt');

        // return Bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        var original = Bcrypt.genSalt;

        Bcrypt.genSalt = function (SALT_WORK_FACTOR, callback) {

            return callback(new Error('genSalt failed'), null);
        };

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.hashem('password_to_hash', function (err, salt) {

                Bcrypt.genSalt = original;
                expect(err.message).to.equal('Bcrypt.genSalt() failed to generate salt.');
                // console.log('hashem !!! err ' + JSON.stringify(err.message));
                done();
            });
        });
    });

    it('tools.user.hashem Bcrypt.hash failed', function (done) {

        var Bcrypt = require('bcrypt');

        var original = Bcrypt.hash;

        Bcrypt.hash = function (password, salt, callback) {

            return callback(new Error('hash failed'), null);
        };

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.hashem('password_to_hash', function (err, salt) {

                Bcrypt.hash = original;

                expect(err.message).to.equal('Bcrypt.hash() failed to generate the hash.');
                // console.log('hashem bcryptMessage' + JSON.stringify(err.bcryptMessage.message));
                done();
            });
        });
    });

    it('tools.user.validatePassword validate valid pw', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            //var password = 'bo-isTss@s"PZ';
            var password = '3b0ss`_T4ss@sPZ';

            sofaInternals.tools.user.validatePassword(password, function (err, result) {

                // expect(err.message).to.equal('Bcrypt.hash() failed to generate the hash.');

                expect(result).to.equal(true);
                // console.log('password validation error: ' + JSON.stringify(err) + ' result ' + JSON.stringify(result));
                done();
            });
        });
    });

    it('tools.user.validatePassword lowercase letters not valid', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            //var password = 'bo-isTss@s"PZ';
            var password = '3b0`_T4s@P';

            sofaInternals.tools.user.validatePassword(password, function (err, result) {

                // expect(err.message).to.equal('Bcrypt.hash() failed to generate the hash.');

                expect(result).to.equal(false);
                expect(err).to.equal('lowercase letters not valid');
                done();
            });
        });
    });

    it('tools.user.validatePassword uppercase letters not valid', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            //var password = 'bo-isTss@s"PZ';
            var password = '3b0ss`_T4ss@s';

            sofaInternals.tools.user.validatePassword(password, function (err, result) {

                // expect(err.message).to.equal('Bcrypt.hash() failed to generate the hash.');

                expect(result).to.equal(false);
                expect(err).to.equal('uppercase letters not valid');
                done();
            });
        });
    });

    it('tools.user.validatePassword special chars not valid', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            var password = '3b0ss_T4sPZ';

            sofaInternals.tools.user.validatePassword(password, function (err, result) {

                // expect(err.message).to.equal('Bcrypt.hash() failed to generate the hash.');

                expect(result).to.equal(false);
                expect(err).to.equal('special characters not valid');
                done();
            });
        });
    });

    it('tools.user.validatePassword digits not valid', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            var password = 'b0ss`_T4ss@sPZ';

            sofaInternals.tools.user.validatePassword(password, function (err, result) {

                // expect(err.message).to.equal('Bcrypt.hash() failed to generate the hash.');

                expect(result).to.equal(false);
                expect(err).to.equal('digits not valid');
                done();
            });
        });
    });

    it('tools.user.validatePassword mock Joi failure', function (done) {

        var original = Joi.validate;

        Joi.validate = function (passwordToValidate, schema, callback) {

            // mock Joi style error message

            var err = { details: [{ message: 'Joi failed' }] };

            Joi.validate = original;

            return callback(err, null);
        };

        database.getSofaInternals(function (err, sofaInternals) {

            var password = '3b0ss`_T4sPZ';

            sofaInternals.tools.user.validatePassword(password, function (err, result) {

                expect(result).to.equal(false);
                expect(err.details[0].message).to.equal('Joi failed');
                done();
            });
        });
    });
});
