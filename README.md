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
   load fixutures and design functions into couchDB. 
* `npm test` ensure that all tests execute.
