var Code = require('code');
var Lab = require('lab');
// var Sofajs = require('sofajs');

var Sofajs = require('../../../sofajs/lib');
var Composer = require('../../lib/sofafest');

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;
var after = lab.after;


var internals = {};
var database = Sofajs.init(Composer.manifest, Composer.composeOptions);

describe('requests.user.create', function () {

    it('requests.user.create success', function (done) {

        database.requests.user.create(internals.mockUser1, function (err, result) {

            // console.log('--' + JSON.stringify(err) + '--' + JSON.stringify(result) );
            expect(result.ok).to.equal(true);
            done();
        });
    });

    it('requests.user.create fail username not unique.', function (done) {

        database.requests.user.create(internals.mockUser1, function (err, result) {

            // console.log('fail result: ' + JSON.stringify(err) + '--' + JSON.stringify(result) );
            expect(err).to.equal('username already exists.');
            done();
        });
    });

    it('requests.user.create fail useremail not unique.', function (done) {

        var original = internals.mockUser1.username;
        internals.mockUser1.username = 'mockUniqueUsername';

        database.requests.user.create(internals.mockUser1, function (err, result) {

            internals.mockUser1.username = original;
            // console.log('fail result: ' + JSON.stringify(err) + '--' + JSON.stringify(result) );
            expect(err).to.equal('useremail already exists.');
            done();
        });
    });


    it('requests.user.create fail invalid password submited.', function (done) {

        var original = internals.mockUser1.pw;
        internals.mockUser1.pw = 'happyInvalidPassword';
        database.requests.user.create(internals.mockUser1, function (err, result) {

            internals.mockUser1.pw = original;
            // console.log('fail result: ' + JSON.stringify(err) + '--' + JSON.stringify(result) );
            expect(err).to.equal('user data invalid.');
            done();
        });
    });

    it('requests.user.create fail bcrypt had issues.', function (done) {

        var Bcrypt = require('bcrypt');

        // return Bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        var original = Bcrypt.genSalt;

        Bcrypt.genSalt = function (SALT_WORK_FACTOR, callback) {

            Bcrypt.genSalt = original;
            return callback(new Error('genSalt failed'), null);
        };

        database.requests.user.create(internals.mockUser2, function (err, result) {

            // console.log('fail result: ' + JSON.stringify(err) + '--' + JSON.stringify(result) );
            expect(err).to.equal('failed to generate salt.');
            done();
        });
    });

    it('requests.user.create fail nano insert document failed.', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            // return sofaInternals.tools.user.rollbackUsernameEmail(

            var original3 = sofaInternals.tools.user.rollbackUsernameEmail;

            sofaInternals.tools.user.rollbackUsernameEmail = function (usernameId, emailId, callback) {

                sofaInternals.tools.user.rollbackUsernameEmail = original3;
                return callback(new Error('mock rollback failure'), null, null);
            };

            var original2 = sofaInternals.tools.user.generateUniqueValues;

            sofaInternals.tools.user.generateUniqueValues = function (username, email, callback) {

                sofaInternals.tools.user.generateUniqueValues = original2;
                return callback(null, 'pass', 'this');
            };

            var original = sofaInternals.db.insert;

            sofaInternals.db.insert = function (userdocToInsert, callback) {

                sofaInternals.db.insert = original;
                return callback(new Error('mock nano.insert failure'), null);
            };

            database.requests.user.create(internals.mockUser2, function (err, result) {

                // console.log('fail result: ' + JSON.stringify(err) + '--' + JSON.stringify(result) );
                expect(err).to.equal('rollback failed.');
                done();
            });
        });
    });

    it('requests.user.create fail rollbackUsernameEmail failed after nano insert failure.', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            // return sofaInternals.tools.user.rollbackUsernameEmail(

            var original3 = sofaInternals.tools.user.rollbackUsernameEmail;

            sofaInternals.tools.user.rollbackUsernameEmail = function (usernameId, emailId, callback) {

                sofaInternals.tools.user.rollbackUsernameEmail = original3;
                return callback(null, 'result1', 'result2');
            };

            var original2 = sofaInternals.tools.user.generateUniqueValues;

            sofaInternals.tools.user.generateUniqueValues = function (username, email, callback) {

                sofaInternals.tools.user.generateUniqueValues = original2;
                return callback(null, 'pass', 'this');
            };

            var original = sofaInternals.db.insert;

            sofaInternals.db.insert = function (userdocToInsert, callback) {

                sofaInternals.db.insert = original;
                return callback(new Error('mock nano.insert failure'), null);
            };

            database.requests.user.create(internals.mockUser2, function (err, result) {

                // console.log('fail result: ' + JSON.stringify(err) + '--' + JSON.stringify(result) );
                expect(err).to.equal('rolledback unique user data because nano insert failed.');
                done();
            });
        });
    });

    it('requests.user.create fail tools.user.rollbackUsernameEmail failed after hashem failure.', function (done) {

        // coverage
        // mock hashem failure causing rollbackUsernameEmail
        // cause rollbackUsernameEmail to execute returning failure.

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.tools.user.rollbackUsernameEmail;

            sofaInternals.tools.user.rollbackUsernameEmail = function (usernameid, emailid, callback) {

                sofaInternals.tools.user.rollbackUsernameEmail = original;
                return callback(new Error('mock rollback failed.'));
            };

            var original2 = sofaInternals.tools.user.generateUniqueValues;

            sofaInternals.tools.user.generateUniqueValues = function (username, email, callback) {

                // success of generatingUniqueValues b/c record was created earlier.
                // could revert creation of internals.mockUser2 mocked it instead.

                sofaInternals.tools.user.generateUniqueValues = original2;
                return callback(null, 'pass', 'this');
            };

            var original3 = sofaInternals.tools.user.hashem;

            sofaInternals.tools.user.hashem = function (userpw, callback) {

                sofaInternals.tools.user.hashem = original3;
                return callback(new Error('mock tools.hashem failure'), null);
            };

            database.requests.user.create(internals.mockUser2, function (err, result) {

                expect(err).to.equal('rollback failed.');
                done();
            });


        });
    });

    // it('cleanup', function (done) {

    //     database.foundation.core.uniqueDestroy('username/' + internals.mockUser1.username, function (err, result) {

    //         var splitRevisionId = result.rev.split('-');
    //         expect(splitRevisionId[1]).to.have.length(32);
    //         expect(result.ok).to.equal(true);

    //         database.foundation.core.uniqueDestroy('useremail/' + internals.mockUser1.email, function (err2, result2) {

    //             var splitRevisionId2 = result2.rev.split('-');
    //             expect(splitRevisionId2[1]).to.have.length(32);
    //             expect(result2.ok).to.equal(true);

    //             return done();
    //         });
    //     });
    // });
});


describe('requests.user.destroy', function () {

    it('requests.user.destroy success', function (done) {

        database.requests.user.findByUsername(internals.mockUser1.username, function (err, result) {

            // console.log('findByUsername mockUser1' + JSON.stringify(result));

            database.requests.user.destroy(result._id, function (err, result2) {

                var splitRevisionId = result2.rev.split('-');
                expect(splitRevisionId[1]).to.have.length(32);
                expect(result2.ok).to.equal(true);
                //expect(result.ok).to.equal(true);
                done();
            });
        });
    });

    it('requests.user.destroy fail user does not exist.', function (done) {

        database.requests.user.destroy('nonexistentUserId', function (err, result2) {

            expect(err).to.exist();
            expect(err).to.equal('document to be destroyed does not exist.');
            done();
        });
    });

    it('requests.user.destroy mock failure to create unique records.', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            database.requests.user.findByUsername(internals.mockUser2.username, function (err, result) {

                var original = sofaInternals.tools.user.rollbackUsernameEmail;

                sofaInternals.tools.user.rollbackUsernameEmail = function (fakeuser, fakeemail, callback) {

                    sofaInternals.tools.user.rollbackUsernameEmail = original;
                    return callback(new Error('mock rollback failure.'), null, null);
                };

                database.requests.user.destroy(result._id, function (err, result2) {

                    expect(err).to.equal('failed to destroy unique records.');
                    done();
                });
            });
        });
    });

    it('requests.user.destroy mock couchdb system failure.', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            database.requests.user.findByUsername(internals.mockUser2.username, function (err, result) {

                var original = sofaInternals.tools.user.rollbackUsernameEmail;

                sofaInternals.tools.user.rollbackUsernameEmail = function (fakeuser, fakeemail, callback) {

                    sofaInternals.tools.user.rollbackUsernameEmail = original;
                    // mock success of rollback.
                    return callback(null, null, null);
                };

                var original2 = sofaInternals.db.destroy;

                sofaInternals.db.destroy = function (resultid, resultrev, callback) {

                    sofaInternals.db.destroy = original2;
                    return callback(new Error('mock failure of couchdb destroy requests.'), null);
                };


                database.requests.user.destroy(result._id, function (err, result2) {

                    expect(err).to.equal('couchdb destroy request failed.');
                    done();
                });
            });
        });
    });
          // return sofaInternals.tools.user.rollbackUsernameEmail(
});

internals.mockUser1 = {
    'username': 'mockuser1',
    'first': 'Mookie',
    'last': 'MookMook',
    'pw': 'h@PP1_4utoo',
    'email': 'mock1@mock.com',
    'scope': ['user'],
    loginAttempts: 0,
    lockUntil: Date.now() - 60 * 1000
};

internals.mockUser2 = {
    'username': 'mockuser2',
    'first': 'Kookie',
    'last': 'YookYook',
    'pw': 'h@PP1_4utoo2',
    'email': 'mock2@mock.com',
    'scope': ['user'],
    loginAttempts: 0,
    lockUntil: Date.now() - 60 * 1000
};
