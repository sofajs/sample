// ./test/sample.js

var Code = require('code');
var Lab = require('lab');
var Sofajs = require('sofajs');
// var Sofajs = require('../../sofajs/lib');
var Composer = require('../lib/sofafest');

var database = Sofajs.init(Composer.manifest, Composer.composeOptions);

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;


describe('initialization', function () {

    it('requests.user.test', function (done) {

        database.requests.user.test(function (err, result) {

            expect(result).to.equal('requests.user.test() executed');
            done();
        });

    });
});

