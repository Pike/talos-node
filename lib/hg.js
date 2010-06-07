var sys = require('sys'),
  querystring = require('querystring'),
  http = require('http');

function HGJSON(host) {
  this._host = host;
  this._client = http.createClient(80, this._host);
}
HGJSON.prototype = {
 push: function _push(repo, onProgress, onData, params) {
    this.jsonapi('pushes', repo, onProgress, onData, params);
  },
 info: function _push(repo, onProgress, onData, params) {
    this.jsonapi('info', repo, onProgress, onData, params);
  },
 jsonapi: function _api(method, repo, onProgress, onData, params) {
    var _content = '';
    if (!onProgress) onProgress=function(){};
    var _push = this._client.request('GET',
                                     '/'+repo+'/json-'+method+'?' +
                                     querystring.stringify(params),
  {'host': this._host});
    _push.addListener('response', function(response) {
        onProgress('RESPONSE');
        response.addListener('data', function(chunk) {
            onProgress('DATA', chunk);
              _content += chunk;
          })
          .addListener('end', function() {
              sys.puts('json-' + method + ' on ' + repo + ' done');
              var pushes = JSON.parse(_content);
              onData(pushes);
            });
          });
    _push.end();
  }
};

exports.HGJSON = HGJSON;
