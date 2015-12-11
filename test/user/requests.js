var Code = require('code');
var Lab = require('lab');
// var Sofajs = require('sofajs');

var Sofajs = require('../../../sofajs/lib');
var Composer = require('../../lib/sofafest');

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
            'pw': 'm00K@_TooK1%e',
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
            expect(err.description).to.equal('joi user validation failed');
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
            'pw': 'mook_B00M!Sh4"',
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
            expect(err.description).to.equal('hashem failed because of bcrypt issues.');
            expect(err.hashemMessage.message).to.equal('Bcrypt.hash() failed to generate the hash.');
            done();
        });
    });

    it('user.create mock nano.insert failure', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            var userdoc = {
                'username': 'MockMock',
                'first': 'Moo',
                'last': 'Mook',
                'pw': 'mook_B00M!Sh4"',
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

                expect(err.description).to.equal('nano failed to insert user document.');
                expect(err.nanoMessage.message).to.equal('mock nano.insert failure');

                done();
            });
        });
    });

    it('user.destroy', function (done) {

        // create db connection.

        database.getConnection(function (err, dbConnection) {

            dbConnection.view('user', 'findByUsername', { keys: ['MockMock'] }, function (err, records) {

                internals.destroyTest = {
                    id:  records.rows[0].value._id,
                    rev:  records.rows[0].value._rev
                };

                database.requests.user.destroy(records.rows[0].value._id, records.rows[0].value._rev, function (err, result) {

                    expect(result.ok).to.equal(true);
                    done();
                });
            });
        });
    });

    it('user.destroy fail (record not_found)', function (done) {

        database.requests.user.destroy(internals.destroyTest.id, internals.destroyTest.rev, function (err, result) {

            delete internals.destroy;
            expect(err.description).to.equal('nano failed to destroy the document.');
            expect(err.nanoMessage.error).to.equal('not_found');
            done();
        });
    });

    it('user.findByUsername success', function (done) {

        var username = 'Foo Foo';

        database.requests.user.findByUsername(username, function (err, record) {

            // expect(records.rows.length).to.equal(1);
            expect(record.email).to.equal('foo@hapiu.com');

            done();
        });
    });

    it('user.findByUsername fail username not found.', function (done) {

        var username = 'Fooky';

        database.requests.user.findByUsername(username, function (err, record) {

            // expect(records.rows.length).to.equal(1);
            expect(record).to.equal(0);

            done();
        });
    });

    it('user.findByUsername fail returned too many names.', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.view;

            sofaInternals.db.view = function (moduleName, menthodName, keysObject, callback) {

                sofaInternals.db.view = original;
                var result = {};
                result.rows = ['one', 'two'];
                return callback(null, result);
            };

            var username = 'Fooky';

            database.requests.user.findByUsername(username, function (err, record) {

                // expect(records.rows.length).to.equal(1);
                expect(err).to.exists();
                expect(err).to.equal('Result not unique.');
                done();
            });
        });
    });


    it('user.findByUsername mock nano.view failure', function (done) {

        var username = 'Foo Foo';

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.view;

            sofaInternals.db.view = function (design, methodName, keys, callback) {

                sofaInternals.db.view = original;
                return callback(new Error('mock nano.view failure'));
            };

            database.requests.user.findByUsername(username, function (err, records) {

                expect(err.description).to.equal('view.findByUsername failed.');
                expect(err.nanoMessage.message).to.equal('mock nano.view failure');
                done();
            });
        });
    });

    it('user.findByEmail', function (done) {

        var email = 'js@dali.photo';

        database.requests.user.findByEmail(email, function (err, records) {

            expect(records.rows.length).to.equal(1);
            expect(records.rows[0].value.email).to.equal('js@dali.photo');
            done();
        });
    });

    it('user.findByEmail email does not exist', function (done) {

        var email = 'js@dali.photo2';

        database.requests.user.findByEmail(email, function (err, records) {

            expect(records.rows.length).to.equal(0);
            done();
        });
    });

    it('user.findByEmail mock nano.view failure', function (done) {

        var email = 'js@dali.photo';

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.view;

            sofaInternals.db.view = function (design, methodName, keys, callback) {

                sofaInternals.db.view = original;
                return callback(new Error('mock nano.view failure'));
            };

            database.requests.user.findByEmail(email, function (err, records) {

                expect(err.description).to.equal('findByEmailFailed failed.');
                expect(err.nanoMessage.message).to.equal('mock nano.view failure');
                done();
            });
        });
    });

    it('user.emailExists true', function (done) {

        var email = 'js@dali.photo';

        database.requests.user.emailExists(email, function (err, result) {

            expect(result).to.equal(true);
            done();
        });
    });

    it('user.emailExists false', function (done) {

        var email = '2js@dali.photo';

        database.requests.user.emailExists(email, function (err, result) {

            expect(result).to.equal(false);
            done();
        });
    });

    it('user.emailExists mock nano.view failure', function (done) {

        var email = 'js@dali.photo';

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.view;

            sofaInternals.db.view = function (design, methodName, keys, callback) {

                sofaInternals.db.view = original;
                return callback(new Error('mock nano.view failure'));
            };

            database.requests.user.emailExists(email, function (err, records) {

                expect(err.description).to.equal('emailExistsFailed() nano.view.findByEmail failed.');
                expect(err.nanoMessage.message).to.equal('mock nano.view failure');
                done();
            });
        });
    });

    it('user.usernameExists true', function (done) {

        var username = 'Foo Foo';

        database.requests.user.usernameExists(username, function (err, result) {

            expect(result).to.equal(true);
            done();
        });
    });

    it('user.usernameExists false', function (done) {

        var username = 'Foo2 Foo';

        database.requests.user.usernameExists(username, function (err, result) {

            expect(result).to.equal(false);
            done();
        });
    });

    it('user.usernameExists mock nano.view failure', function (done) {

        var username = 'Foo Foo';

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.view;

            sofaInternals.db.view = function (design, methodName, keys, callback) {

                sofaInternals.db.view = original;
                return callback(new Error('mock nano.view failure'));
            };

            database.requests.user.usernameExists(username, function (err, records) {

                expect(err.description).to.equal('usernameExistsFailed() nano.view.findByUsername failed.');
                expect(err.nanoMessage.message).to.equal('mock nano.view failure');
                done();
            });
        });
    });

    it('user.updateEmail success', function (done) {

        database.requests.user.findByUsername('Foo Foo', function (err, result) {

            // console.log('got user**' + result.rows[0].value.email + '\n' + result.rows[0].value._id);

            var originalEmail = result.email;
            var email = 'wawa@dali.photo';

            database.requests.user.updateEmail(result._id, email,  function (err2, result2) {

                expect(result2).to.equal('Edited email address.');

                // foo@hapiu.com

                // change email back

                database.requests.user.updateEmail(result._id, originalEmail,  function (err3, result3) {

                    // revert email back to original.
                    // allows for tests to be re-run and not fail.

                    expect(result3).to.equal('Edited email address.');
                    done();
                });
            });
        });
    });

    it('user.updateEmail failed', function (done) {

        var email = 'wawa@dali.photo';

        database.requests.user.updateEmail('bad_document_id', email,  function (err2, result2) {

            // console.log('boom: ' + JSON.stringify(err2) + '\n** \n' + JSON.stringify(result2));
            expect(err2.description).to.equal('emailUpdateFailed() nano.atomic.update failed.');
            done();
        });
    });

    it('user.updatePassword success', function (done) {

        database.requests.user.findByUsername('Foo Foo', function (err, result) {

            // console.log('got user**' + result.rows[0].value.email + '\n' + result.rows[0].value._id);

            var originalPW = result.pw;
            var pw = '3388_LoveH**';

            database.requests.user.updatePassword(result._id, pw,  function (err2, result2) {

                // message passed from design function in couchdb.

                expect(result2).to.equal('Updated password.');

                database.requests.user.updatePassword(result._id, originalPW,  function (err3, result3) {

                    // revert password back to original.
                    // allows for tests to be re-run and not fail.

                    expect(result3).to.equal('Updated password.');
                    done();
                });
            });
        });
    });

    it('user.updatePassword fail', function (done) {

        database.getSofaInternals(function (err, sofaInternals) {

            var original = sofaInternals.db.atomic;

            sofaInternals.db.atomic = function (designName, updateMethodName, docid, insertDocument, callback) {

                sofaInternals.db.atomic = original;
                return callback(new Error('mock _design/user update method failure'));
            };

            database.requests.user.updatePassword('mockId', 'mockPwToUpdate',  function (err, result) {

                // message passed from design function in couchdb.

                expect(err.description).to.equal('passwordUpdateFailed() nano.atomic.update failed.');
                done();
            });

        });
    });

    it('tools.user.uniqueUsernameCreate. success', function (done) {

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

    it('cleanup tools.user.uniqueUsernameDestroy success.', function (done) {

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

    // it('user.destroyUniqueUsername success', function (done) {

    //     // set up username to fail.
    //     // 'Foo Foo' username exists in fixture data.

    //     database.requests.user.destroy(, rev, function (err, result) {

    //         internals.mockUser1.username = original;

    //         if ((err) && (err.description === 'nano failed to destroy the document.')) {
    //             // expect(err).to.equal('Username already exists.');
    //             console.log('destory unique username failed.');
    //             return done();
    //         }
    //     });
    // });

});



internals.mockUser1 = {
    'username': 'hapiuniversity',
    'first': 'Hapi',
    'last': 'Nes',
    'pw': 'hapiu',
    'email': 'hapiu@boom.com',
    'scope': ['user'],
    loginAttempts: 0,
    lockUntil: Date.now() - 60 * 1000
};
