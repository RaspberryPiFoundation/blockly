
  Running an App Engine server

This directory contains the files needed to setup the optional Blockly server.
Although Blockly itself is 100% client-side, the server enables cloud storage
and sharing.  Store your programs in Datastore and get a unique URL that allows
you to load the program on any computer.

To run your own App Engine instance you'll need to create this directory
structure:

blockly/
 |- app.yaml
 |- deploy
 |- index.yaml
 |- main.py
 |- README.txt
 |- requirements.txt
 |- storage.js
 |- storage.py
 `- static/
     |- blocks/
     |- core/
     |- demos/
     |- generators/
     |- media/
     |- msg/
     |- tests/
     |- blockly_compressed.js
     |- blockly_uncompressed.js
     |- blocks_compressed.js
     |- dart_compressed.js
     |- javascript_compressed.js
     |- lua_compressed.js
     |- php_compressed.js
     `- python_compressed.js

Go to https://appengine.google.com/ and create your App Engine application.
Modify the 'PROJECT' name in the 'deploy' file to your App Engine application name.

Finally, upload this directory structure to your App Engine account,
then go to http://YOURAPPNAME.appspot.com/
