var exec = require('child_process').exec
  , spawn = require('child_process').spawn
  , express = require('express')
  , path = require('path')
  , app = express()
  , http = require('http').Server(app)
  , io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, "./")));
app.use(express.static(path.join(__dirname, "./public/")));
app.use(express.static(path.join(__dirname, "./public/bower_components")));
app.use(express.static(path.join(__dirname, "./public/webcomponents")));

console.log(__dirname);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
    //res.send("Hello World");
});

var child = exec('./src/attControl -s');
child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
});
child.stderr.on('data', function(data) {
    console.log('stdout: ' + data);
});
child.on('close', function(code) {

    console.log('closing code: ' + code);
});

http.listen(9010, function() {
  console.log('listening on localhost:9010');
});

// Begin reading from stdin so the process does not exit imidiately
process.stdin.resume();

//catches ctrl+c event
process.on('SIGINT', function() {
  child = exec('./src/attControl -r');
  console.log('Interrupted');
  process.exit();
});

//do something when app is closing
process.on('exit', function() {
  child = exec('./src/attControl -r');
  console.log('Interrupted');
  process.exit();
});
