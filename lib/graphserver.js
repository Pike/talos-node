var http = require('http'),
  sys = require('sys');

exports.load = function(rev, references) {
  var ghost = 'graphs.mozilla.org';
  var graphapi = '/api/test/runs/revisions?';
  var gclient = http.createClient(80, ghost);
  var revs = ['revision='+rev];
  references.forEach(function(_r){revs.push('revision='+_r)});
  var q = revs.join('&');
  var req = gclient.request("GET", graphapi + q,
                            {'host': ghost});
  var rv = {
  stat: 'loading',
  _data: null,
  _cb: null,
  waitForLoad: function(cb) {
      if (this.stat != 'loading') {
        var self = this;
        process.nextTick(function(){cb(self._data);});
        return
      }
      this._cb = cb;
    },
  addData: function(data) {
      this._data = data;
      if (this._cb) {
        var self = this;
        process.nextTick(function() {self._cb(self._data);});
      }
    }
  }
  function processGraph(gdata) {
    if (gdata.stat != 'ok') {
      rv.addData(gdata.stat);
      return rv;
    }
    // averages per test and platform, for all references
    // first list, then numbers
    // and sorted list of tests in both refs and rev, and of missings
    var compares = [], missing = [], norefs = [];
    
    var avgs = {};
    references.forEach(function(_r) {
        if (!(_r in gdata.revisions)) {
          sys.debug(_r + " not found in graph data");
          return;
        }
        for (var testname in gdata.revisions[_r]) {
          if (!(testname in avgs)) avgs[testname]={};
          var tdata = gdata.revisions[_r][testname];
          for (var platform in tdata.test_runs) {
            if (!(platform in avgs[testname]))
              avgs[testname][platform] = [];
            tdata.test_runs[platform].forEach(function(t) {
                avgs[testname][platform].push(t[3]);
              });
          }
        }
      });
    for (var testname in avgs) {
      var pdata = avgs[testname];
      for (var platform in pdata) {
        var total = 0;
        pdata[platform].forEach(function(v){total += v});
        pdata[platform] = total/pdata[platform].length;
        try {
          gdata.revisions[rev][testname].test_runs[platform][0];
          compares.push([testname, platform]);
        } catch (e) {
          missing.push([testname, platform]);
        }
      }
    }
    function tuplecmp(l,r) { 
      if (l[0] == r[0]) 
        {_l = l[1];_r=r[1];}
      else
        {_l = l[0];_r=r[0];}
      if (_l==_r) return 0;
      if (_l < _r) return -1;
      return 1;
    }
    compares.sort(tuplecmp);
    missing.sort(tuplecmp);
    var items = [];
    compares.forEach(function(tpl, id) {
        var testname = tpl[0], platform = tpl[1];
        var item = {
        id: id,
        rev: [],
        references: [],
        avg: null,
        testname: testname,
        platform: platform
        };
        references.forEach(function(_r) {
            try {
              gdata.revisions[_r][testname].test_runs[platform][0];
            } catch (e) {
              return;
            }
            gdata.revisions[_r][testname].test_runs[platform].forEach(function(_t) {
                item.references.push(_t[3]);
              });
          });
        gdata.revisions[rev][testname].test_runs[platform].forEach(function(_t) {
            item.rev.push(_t[3]);
          });
        item.avg = avgs[testname][platform];
        item.rev.sort(function(a,b){return a-b});
        item.references.sort(function(a,b){return a-b});
        items.push(item);
      });
    rv.addData({items:items, missing: missing});
  };
  req.addListener('response', function(response) {
      var content = '';
      response.addListener('data', function(chunk) {
          content += chunk;
        })
        .addListener('end', function() {
            processGraph(JSON.parse(content));
          });
    });
  req.end();
  return rv;
}
