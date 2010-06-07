var HGJSON = require('./lib/hg').HGJSON,
  templates = require('./lib/templates'),
  graphserver = require('./lib/graphserver'),
  querystring = require('querystring'),
  sys = require('sys'),
  url = require('url'),
  http = require('http');

var hg = new HGJSON('hg.mozilla.org');
/*
 * Helper to find the parent of the given revision in srcrepo inside
 * the targetrepo.
 */
function ParentFinder(srcrepo, targetrepo, revision, onProgress, onData) {
  var foundPush = null;
  function gotPush(_push) {
    if (foundPush) return;
    if (typeof(_push) == 'string') {
      var m = /unknown revision '([0-9a-f]+)'/.exec(_push);
      if (!m) return;
      hg.info(srcrepo, onProgress, gotInfo, {node:m[1]});
      return
    }
    for (var k in _push) {
      foundPush = k;
      break;
    }
    onData(foundPush);
  }
  function gotInfo(_info) {
    if (foundPush) return;
    for (var k in _info) {
      for (var j=_info[k].parents.length-1;j>=0;--j) {
        hg.push(targetrepo, onProgress, gotPush, {changeset:_info[k].parents[j].substring(0,12)});
      }
    }
  }
  hg.info(srcrepo, onProgress, gotInfo, {node:revision});
}

var globals = {
 hg: hg,
 querystring: querystring,
 sys: sys,
 ParentFinder: ParentFinder
};

function index(res, params) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var t = templates.getTemplate('templates/index.html', globals);
  t.render(null, res);
}

function findbase(res, params) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var t = templates.getTemplate('templates/findbase.html', globals);
  t.render(params, res);
}

function graph(res, params) {
  var try_rev = params.try_rev.substring(0,12);
  var revs = [];
  if (typeof(params.base_rev) === "string") {
    revs.push(params.base_rev.substring(0,12));
  }
  else {
    params.base_rev.forEach(function(_r) {
      revs.push(_r.substring(0,12));
      });
  };
  var loader = graphserver.load(try_rev, revs);
  var ctxt = {graphloader: loader,
              refs: revs,
              rev: try_rev};
  res.writeHead(200, {'Content-Type': 'text/html'});
  var t = templates.getTemplate('templates/graph.html', globals);
  t.render(ctxt, res);
}

function graph_code_js(res, params) {
  res.writeHead(200, {'Content-Type': 'application/javascript'});
  var t = templates.getTemplate('templates/graph.js', globals);
  t.render(null, res);
}


function urlmapper(req, res) {
  var _url = url.parse(req.url, true);
  sys.puts(_url.pathname);
  switch (_url.pathname) {
  case '/':
    index(res, _url.query, _url);
    break;
  case '/findbase':
    findbase(res, _url.query, _url);
    break;
  case '/graph':
    graph(res, _url.query, _url);
    break;
  case '/graph-code.js':
    graph_code_js(res, _url.query, _url);
    break;
  default:
    four_o_four(res, _url.query, _url);
  }
}

http.createServer(urlmapper).listen(8000);
sys.puts('Server running at http://127.0.0.1:8000');
