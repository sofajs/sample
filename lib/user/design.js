var Promise = require('bluebird');
var Hoek = require('hoek');

var internals = {};
var sofaInternals = {};

exports = module.exports = internals.userDesign = function (sofaInternalsParam) {

    sofaInternals = sofaInternalsParam;
    internals.designGroup = 'user';

    // creates design document views functions
    // creates design document update functions
    // when not live
    //     - design documents are destroyed and recreated.
    //     - will reload design fixture data.
    // when live
    //     - design documents are updated instead of recreated.
    //     - fixture data not loaded.
    //

    sofaInternals.design.register(internals.designGroup)
        .design.views({

            //  _design/user view functions built below.
            // "npm run reload" will refresh all design functions in the db.
            test: {
                map: function (doc) {

                    if (doc.username && doc.first) {

                        emit([doc._id, doc._rev], doc);
                    }
                },
                reduce: null  // optional
            }
        }).design.fixtures([
            {
                username: 'Foo Foo',
                first: 'Foo',
                last: 'Foo',
                pw: 'foo',
                email: 'foo@hapiu.com',
                scope: ['admin', 'user'],
                loginAttempts: 0,
                lockUntil: Date.now() - 60 * 1000
            },
            {
                'username': 'Bar Head',
                'first': 'Bar',
                'last': 'Head',
                'pw': 'bar',
                'email': 'bar@hapiuni.com',
                'scope': ['user'],
                loginAttempts: 0,
                lockUntil: Date.now() - 60 * 1000
            },
            {
                username: 'user1',
                pw: '8899l1v3',
                email: 'js@dali.photo',
                first: 'Jon',
                last: 'Swenson',
                scope: ['admin', 'user'],
                loginAttempts: 0,
                lockUntil: Date.now() - 60 * 1000
            }]).design.load();

    return sofaInternals;
};