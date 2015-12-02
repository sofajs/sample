var Code = require('code');
var Lab = require('lab');
// var Sofajs = require('sofajs');

var Sofajs = require('../../sofajs/lib');
var Composer = require('../lib/sofafest');

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


var internals = {};
var database = Sofajs.init(Composer.manifest, Composer.composeOptions);

describe('requests.user', function () {

    it('user.create', function (done) {

        var userdoc = {
            'username': 'MockMock',
            'first': 'Moo',
            'last': 'Mook',
            'pw': 'moo',
            'email': 'mock@hapiu.com',
            'scope': ['user'],
            loginAttempts: 0,
            lockUntil: Date.now() - 60 * 1000
        };

        database.requests.user.create(userdoc, function (err, result) {

            expect(result.ok).to.equal(true);
            done();
        });
    });

    it('user.create invalid user info', function (done) {

        var userdoc = {
            'username': 'Mock',
            'first': 'Moo',
            'last': 'Mook',
            'pw': 'moo',
            'email': 'mock@hapiu.com',
            'scope': ['user'],
            loginAttempts: 0,
            lockUntil: Date.now() - 60 * 1000
        };

        database.requests.user.create(userdoc, function (err, result) {

            expect(err).to.exist();
            expect(err.message).to.equal('joi user validation failed');
            expect(err.joiMessage.message).to.equal('child "username" fails because ["username" ' +
                                                    'length must be at least 8 characters long]');
            done();
        });
    });

    it('user.create mock hashem failure', function (done) {

        var userdoc = {
            'username': 'MockMock',
            'first': 'Moo',
            'last': 'Mook',
            'pw': 'moo',
            'email': 'mock@hapiu.com',
            'scope': ['user'],
            loginAttempts: 0,
            lockUntil: Date.now() - 60 * 1000
        };

        var Bcrypt = require('bcrypt');

        var original = Bcrypt.hash;

        Bcrypt.hash = function (password, salt, callback) {

            return callback(new Error('mock hash failure'), null);
        };

        database.requests.user.create(userdoc, function (err, result) {

            Bcrypt.hash = original;

            expect(err).to.exist();
            expect(err.message).to.equal('hashem failed because of bcrypt issues.');
            expect(err.hashemMessage.message).to.equal('Bcrypt.hash() failed to generate the hash.');
            done();
        });
    });

    it('user.create mock sofaInternals.db.insert failure', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            var userdoc = {
                'username': 'MockMock',
                'first': 'Moo',
                'last': 'Mook',
                'pw': 'moo',
                'email': 'mock@hapiu.com',
                'scope': ['user'],
                loginAttempts: 0,
                lockUntil: Date.now() - 60 * 1000
            };

            var original = sofaInternals.db.insert;

            sofaInternals.db.insert = function (userdocToInsert, callback) {

                return callback(new Error('mock nano.insert failure'), null);
            };

            database.requests.user.create(userdoc, function (err, result) {

                sofaInternals.db.insert = original;

                expect(err.message).to.equal('nano failed to insert user document.');
                expect(err.nanoMessage.message).to.equal('mock nano.insert failure');

                done();
            });
        });
    });
});
