Talos Node
==========

The server.js app is helping you to compare results from the Mozilla
Talos graphserver. The main entry point offers to you select a push
from the try server, which is the primary goal of this app. On
submitting, you get to an intermediate screen that shows the progress
while the server is gathering data from the hg server. It then offers
a link to the graph display, which compares the try results with the
changesets on mozilla-central that are closest to your try push in the
graph on try. It compares to 10 pushes. You can reload the page to get
updated test results.

Provided libraries
==================

The code comes with a few more or less useful libraries in ``lib``.

graphserver
-----------
Get results from the graphserver, and post-process it as needed for
our use-case. It takes one revision to compare to a list of reference
revisions. You should make sure that those revisions are 12-digit hg
hashes.

The ``load`` api returns an object that you can later register
callbacks to, enabling you to start the async load before you defined
the observer. If the load is done already, you'll get the callback run
on ``process.nextTick``.

hg
--
A simple asynchronous interface to get the json output of both the
``pushes`` and the ``info`` web apis on the hg web server.


templates
---------
*Very* rudimentary templating engine. You can specify synchronous js
blocks with::

 {{}}
 // some js code
 res.write('this ends up in the output');
 {{/}}

Asynchronous blocks can be created with::

 {{async}}
 res.write('this code is written right now');
 setTimeout(function(){
   res.write('this code is written a second later');
   // need to call end with the last asynchronous write for this block
   res.end(); 
 }, 1000);
 {{/}}

Caveats
=======
node.js seems to be rather active, breaking compat every now and
then. This code was tested with revision 0.1.97.
