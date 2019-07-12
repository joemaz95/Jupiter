'use strict';

const Hapi = require('hapi');
const Good = require('good');
const Path = require('path');
var request = require("request");
var CryptoJS = require('crypto-js');


const server = new Hapi.Server();
server.connection({port:8800});

var log = [];
var user = '';

function buildQuery(req) {
  var kDSLquery = "";

  if (req.params.term == "kdsl") {
    //This is highly insecure
    kDSLquery = unescape(req.query.q.replace(/AND/g, "&"));
  }

  else if (req.query.proot) {
    kDSLquery += 'patient_root=\'' + req.query.proot + '\'';

    if (req.query.pext) {
      kDSLquery += '&patient_extension=\'' + req.query.pext + '\'';
    }

    if (req.params.term) {
      kDSLquery += '&literal=\'' + req.params.term + '\'';
    }
  }

  else {
    kDSLquery = "(";
    var searchTerms =req.params.term.split('|');
    server.log('search terms: ' + searchTerms);

    for(var i = 0; i < searchTerms.length; i++) {
        kDSLquery += 'literal=\'' + searchTerms[i] + '\'';
        server.log('blah: ' + i);
        if(i != searchTerms.length-1){
            kDSLquery += "|";
        }
        if(i == searchTerms.length-1){
            kDSLquery += ")";
        }
  }
    server.log('kdslquery: ' + kDSLquery);

    if (req.query.gender) {
      kDSLquery += '&gender=\'' + req.query.gender + '\'';
    }
    if (req.query.age_condition) {
      kDSLquery += '&age_now';
      if (req.query.age_condition === "Over") {
        kDSLquery += '>';
      }
      else if (req.query.age_condition === "Under") {
        kDSLquery += '<';
      }
      else {
        kDSLquery += "<";
        kDSLquery += req.query.between;
        kDSLquery += "&age_now>";
      }
      if (req.query.age_entered) {
        kDSLquery += encodeURIComponent(req.query.age_entered);
      }
      else {
        res("Invalid criteria, need to enter age number if age criteria selected");
      }
    }
    if (req.query.doctype) {
      kDSLquery += '&document_type=\'' + req.query.doctype +'\'';
    }

  }
  return kDSLquery;
}

//from postman script for kamioka api request
function computeHttpSignature(config, headerHash) {
  var template = 'hmac username="${keyId}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"';
  var sig = template;

  var signingBase = '';
  config.headers.forEach(function(h) {
    if (signingBase !== '') { signingBase += '\n' }
    signingBase += h.toLowerCase() + ": " + headerHash[h];
  });

  var hashf = (function() {
    switch (config.algorithm) {
      case 'hmac-sha1': return CryptoJS.HmacSHA1;
      case 'hmac-sha256': return CryptoJS.HmacSHA256;
      case 'hmac-sha512': return CryptoJS.HmacSHA512;
      default: return null;
    }
  }());

  var hash = hashf(signingBase, config.secretkey);
  var signatureOptions = {
    keyId: config.keyId,
    algorithm: config.algorithm,
    headers: config.headers,
    signature: CryptoJS.enc.Base64.stringify(hash)
  };

  Object.keys(signatureOptions).forEach(function(key) {
    var pattern = "${" + key + "}",
    value = (typeof signatureOptions[key] != 'string') ? signatureOptions[key].join(' ') :
      signatureOptions[key];
    sig = sig.replace(pattern, value);
  })

  return sig;
}

function addUrlParams (req, targetURL) {
  if (req.query.sort) {
    targetURL += "&sort=" + req.query.sort;
    if (req.query.dir) {
      targetURL += "&dir=" + req.query.dir;
    }
  }
  if (req.query.from) {
    targetURL += "&from=" + req.query.from;
  }
  return targetURL;
}

server.route({
  method: 'GET',
  path: '/execsearch/{term}',
  handler: function(req, res) {

    const RESULTS_SIZE = "35";
    var curDate = new Date().toGMTString();
    var targetURL = "https://dev.kamioka.upmce.net/api/v1/load_test_tenant_1/document/search?snippets=true&size=" + RESULTS_SIZE;
    targetURL = targetURL.replace(new RegExp('^https?://[^/]+/'), '/');

    targetURL = addUrlParams(req, targetURL);

    // var kDSLquery = 'literal=\'' + encodeURIComponent(req.params.term).replace("_", " ") + '\'';


    // server.log('target url: ' + targetURL);

    var headerHash = {
      date: curDate,
      path: targetURL
    }

    var config = {
      algorithm: 'hmac-sha1',
      keyId: 'jupiter-dev',
      secretkey: 'c815b8f7105342be99d3e24c277a1278',
      headers: [ 'path', 'date']

    };


    var sig = computeHttpSignature(config, headerHash);
    var kDSLquery = buildQuery(req);
      log.push(user + " : " + kDSLquery + " - " + new Date());

    var options = { method: 'POST',
      url: 'https://dev.kamioka.upmce.net' + targetURL,
      headers:
       { 'postman-token': '1fa769bc-15cb-4bd0-e150-53cc7fc38137',
         'cache-control': 'no-cache',
         path: targetURL,
         authorization: 'hmac username=\\"jupiter-dev\\",algorithm=\\"hmac-sha1\\",headers=\\"path date\\",signature=\\"' + sig + '\\"',
         date: curDate,
         user_root: 'ur',
         user_extension: 'ue',
         'content-type': 'application/json' },
      body: { criterion: kDSLquery },
      json: true };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);

      if (response.statusCode == 200) {
        res(body);
      }
      else {
        res(body).code(response.statusCode);
      }

    });
  }
});



server.register({
    register: Good,
    options: {
        reporters: {
            console: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    response: '*',
                    log: '*'
                }]
            }, {
                module: 'good-console'
            }, 'stdout']
        }
    }
}, (err) => {
    if (err) {
        throw err;
    }

    server.start((err) => {
        if (err) {
            throw err;
        }

        server.log('info', 'Server running at: ' + server.info.uri);
    });
});

server.register(require('inert'), (err) => {

    if (err) {
        throw err;
    }

    server.route({
      method: 'GET',
      path: '/',
      handler: function(req, res) {
        res.redirect('/login');
      }
    })

    server.route({
        method: 'GET',
        path: '/app/{param*}',
        handler: {
            directory: {
              path: "./public/components/search",
              listing: false,
              index: ['index.html']
            }
        }
    });

    server.route({
      method: 'GET',
      path: "/login/{param*}",
      handler: {
          directory: {
            path: "./public/components/login",
            listing: false,
            index: ['login.html']
          }
      }
    });

    server.route({
      method: 'GET',
      path: "/icons/{file}",
      handler: function(req, res) {
        res.file("./public/assets/" + req.params.file);
      }
    })

    //log page
    server.route({
        method: 'GET',
        path: '/log',
        handler: function(req, res) {
            res(log.join('<br>'));
        }
    });

    // log the user that logs in
    server.route({
        method: 'GET',
        path: '/log/{entry}',
        handler: function(req, res) {
            // encodeURIComponent(req.params.query)
            log.push(req.params.entry + ' has logged in' + ' - ' + new Date());
            server.log(req.params.entry + ' has logged in');
            user = req.params.entry;
            // server.log(Object.keys(req.auth));
            res.redirect('/app');
        }
    });

    //log a user logout
    server.route({
        method: 'GET',
        path: '/logout',
        handler: function(req, res) {
            log.push(user + ' has logged out' + ' - ' + new Date());
            server.log(user + ' has logged out');
            res.redirect('/login');
        }
    });

});
