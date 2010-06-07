var gs=require('./lib/graphserver'), sys=require('sys');

var data={};
function __cb(d){
  for (var k in d) {
    //sys.puts(k);
    data[k]=d[k];
  };
  sys.puts(sys.inspect(d));
  sys.puts('loaded');
};

loader = gs.load('c3d7add9df54',['7ebd45a02360','ac1ed3f6b2e7']);
loader.waitForLoad(__cb);
