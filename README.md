# sample 

Sample project to illustrate how to use sofajs.

### Steps to install sample sofajs project
* Install CouchDB <br/>
  [CouchDB](http://couchdb.apache.org/)
* Create an admin user account for couchdb. 
  [CouchDB Authentication](http://docs.couchdb.org/en/1.6.1/intro/security.html#authentication)
* clone this project.<br/>
  `git clone https://github.com/sofajs/sample.git`
* `npm install` in root of project 
* Configure admin user credentials to be used by sofajs manifest file,<br/> 
  'lib/sofafest.js' of this project the manifest file is named 'sofafest.js'. 
* `npm run load`<br/>
   load fixutures and design functions into couchDB.<br/>
   Run above "load" command twice the first time it is run.
   If database does not exists yet it does not automitically load fixture data.
   Second time round will work.  Eventually, I will fix this issue.
* `npm test` ensure that all tests execute.
