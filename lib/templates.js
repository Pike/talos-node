var fs = require('fs'),
  sys = require('sys');

var _cache = {};

function Template(contents, globals){
  var args=['res'];
  this._argvs = [null];
  for (var k in globals) {
    args.push(k); this._argvs.push(globals[k]);
  }
  this._asyncs = function parse() {
    var blocks = contents.split(/({{(?:(?:async)|\/)?}})/);
    var asyncs=[], syncs=[], isAsync = false;
    var state; // cycles 'inText', 'start', 'inBody', 'end'
    for (var i=0,ii=blocks.length; i<ii; ++i) {
      var _c = blocks[i];
      switch (i%4) {
      case 0:
        syncs.push(function() {
            var __c = _c;
            function _inner(res) {
              res.write(__c);
            }
            return _inner;
          }());
        break;
      case 1:
        if (_c == '{{/}}') {
          throw 'Unexpected end block';
        }
        isAsync = (_c == '{{async}}');
        break;
      case 2:
        syncs.push(new Function(args.join(','), _c));
        if (isAsync) {
          asyncs.push(syncs);
          syncs = [];
        }
        break;
      case 3:
        if (_c != '{{/}}') {
          throw 'Unexpected start block';
        }
        break;
      }
    }
    asyncs.push(syncs);
    return asyncs;
  }();
};

function BufferedStream(_inner) {
  this._inner = _inner;
}
BufferedStream.prototype = {
 write: function(str) {
    if (!str) return;
    this._inner.write(str);
    return;
  },
 end: function() {
    this._buffer.end();
  }
};

Template.prototype = {
 render: function(ctxt, res) {
    var self = this;
    var buffered = new BufferedStream(res);
    function renderSyncChunk(i) {
      var _res, needsEnd = false;
      function nextChunkRes(j) {
        this.end = function() {
          renderSyncChunk(j+1);
        };
      }
      nextChunkRes.prototype = buffered;

      if (i < self._asyncs.length-1) {
        // we're still having another sync batch, make end() call that
        _res = new nextChunkRes(i);
      }
      else {
        _res = buffered;
        needsEnd = true;
      }
      var chunk = self._asyncs[i];
      for (var j=0, jj=chunk.length; j<jj; ++j) {
        var args = new Array(self._argvs.length);
        for (var k=1, kk=self._argvs.length; k<kk; ++k) {
            args[k] = self._argvs[k];
        }
        args[0] = _res;
        chunk[j].apply(ctxt, args);
      }
      if (needsEnd) {
        res.end()
      }
    }
    renderSyncChunk(0);
  }
};

exports.getTemplate = function(filename, globals) {
  if (filename in _cache) {
    return _cache[filename];
  }
  var contents = fs.readFileSync(filename).toString();
  var _t = new Template(contents, globals);
  //_cache[filename] = _t;
  return _t;
};
