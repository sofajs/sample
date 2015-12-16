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

