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

describe('tools.user uniqueDocuments', function () {

    // test enforcement of unique values in user documents.

    it('tools.user.uniqueUsernameCreate success', function (done) {

        // uniqueUsernameCreate

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.uniqueUsernameCreate(internals.mockUser1.username, function (err, documentId, documentRev) {

                // console.log('user.uniqueUsernameCreate success err ' +
                //             JSON.stringify(err) +
                //             JSON.stringify(documentId) +
                //             JSON.stringify(documentRev));

                expect(documentId).to.equal('username/' + internals.mockUser1.username);
                expect(documentRev).to.have.length(34);
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameCreate fail username already exists.', function (done) {

        // uniqueUsernameCreate
        // fails because username already exists.

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.uniqueUsernameCreate(internals.mockUser1.username, function (err, documentId, documentRev) {

                expect(err).to.exist();
                expect(err).to.equal('uuid already exists.');
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameCreate mock failure of function.core.insertid.', function (done) {

        // uniqueUsernameCreate
        // fails because username already exists.

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.foundation.core.insertid;

            sofaInternals.foundation.core.insertid = function (documentToInsert, uniqueIdToInsert, callback) {

                sofaInternals.foundation.core.insertid = original;
                return callback(new Error('Mock foundation.insertid failure.'), null, null);
            };

            sofaInternals.tools.user.uniqueUsernameCreate(internals.mockUser1.username, function (err, documentId, documentRev) {

                expect(err).to.exist();
                expect(err).to.equal('Error: foundation.core.insertid failed.');
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameDestroy success.', function (done) {

        // uniqueUsernameDestroy

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.uniqueUsernameDestroy('username/' + internals.mockUser1.username, function (err, result) {

                // console.log('destroy: ' + JSON.stringify(err) + ' ' + JSON.stringify(result));
                expect(err).to.not.exist();
                expect(result.id).to.equal('username/' + internals.mockUser1.username);
                expect(result.rev).to.have.length(34);
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameDestroy fail document already deleted.', function (done) {

        // uniqueUsernameDestroy
        // fails because username d/n exists.

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.uniqueUsernameDestroy('username/' + internals.mockUser1.username, function (err, result) {

                expect(err).to.exist();
                expect(err).to.equal('Document does not exist.');
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameDestroy fail document d/n exists.', function (done) {

        // uniqueUsernameDestroy
        // fails because username d/n exists.

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.uniqueUsernameDestroy('username/boom', function (err, result) {

                expect(err).to.exist();
                expect(err).to.equal('Document does not exist.');
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameDestroy mock nano.get() failure.', function (done) {

        // uniqueUsernameDestroy
        // fails because username d/n exists.

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.get;

            sofaInternals.db.get = function (documentName, params, callback) {

                sofaInternals.db.get = original;
                return callback(new Error('Mock sofaInternals.db.get failure.'), null, null);
            };

            sofaInternals.tools.user.uniqueUsernameDestroy('username/' + internals.mockUser1.username, function (err, result) {

                expect(err).to.exist();
                expect(err.message).to.equal('Mock sofaInternals.db.get failure.');
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameCreate success recreate destroyed user.', function (done) {

        // uniqueUsernameCreate

        database.getSofaInternals(function (err, sofaInternals) {

            sofaInternals.tools.user.uniqueUsernameCreate(internals.mockUser1.username, function (err, documentId, documentRev) {

                expect(documentId).to.equal('username/' + internals.mockUser1.username);
                expect(documentRev).to.have.length(34);
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameDestroy mock sofaInternals.db.destroy() failure.', function (done) {

        // uniqueUsernameDestroy
        // fails because username d/n exists.

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.destroy;

            sofaInternals.db.destroy = function (documentName, params, callback) {

                sofaInternals.db.destroy = original;
                return callback(new Error('Mock sofaInternals.db.destroy failure.'), null);
            };

            sofaInternals.tools.user.uniqueUsernameDestroy('username/' + internals.mockUser1.username, function (err, result) {

                expect(err).to.exist();
                expect(err.message).to.equal('Mock sofaInternals.db.destroy failure.');
                done();
            });
        });
    });

    it('tools.user.uniqueUsernameUpdate success', function (done) {

        internals.done = done;
        return database.getSofaInternals(function (err, sofaInternals) {

            var newUsername = 'uniqueUsernameUpdated';

            return sofaInternals.tools.user.uniqueUsernameUpdate('username/' + internals.mockUser1.username, newUsername,
                function (err, updatedUsername, updatedUsernameRev) {

                    if (err) {
                        return internals.done();
                    }

                    console.log('result: ' + updatedUsername);
                    expect(updatedUsername).to.equal('username/' + newUsername);
                    return  internals.done();
                });
        });
    });

    it('tools.user.uniqueUsernameUpdate fail update user already exists', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            // user already updated to this value.
            // update query should fail.

            var newUsername = 'uniqueUsernameUpdated';

            sofaInternals.tools.user.uniqueUsernameUpdate('username/' + internals.mockUser1.username, newUsername,
                function (err, updatedUsername, updatedUsernameRev) {

                    if (err) {
                        expect(err).to.equal('uuid already exists.');
                        return done();
                    }
                });
        });
    });

    it('tools.user.uniqueUsernameUpdate fail to destroy old username.', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            // user already updated to this value.
            // update query should fail.

            var newUsername = 'uniqueUserBoomFail';

            sofaInternals.tools.user.uniqueUsernameUpdate('boom', newUsername,
                function (err, updatedUsername, updatedUsernameRev) {

                    if (err) {
                        expect(err).to.equal('Reverted transaction. UniqueUsernameDestroy failed.');
                        return done();
                    }
                });
        });
    });
});

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

internals.mockUser1 = {
    'username': 'uniqueuser',
    'first': 'Sofa',
    'last': 'Js',
    'pw': 'n_c&d8yTT',
    'email': 'sofajs@boom.com',
    'scope': ['user'],
    loginAttempts: 0,
    lockUntil: Date.now() - 60 * 1000
};

