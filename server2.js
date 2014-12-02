HOST = null;
PORT = 8088;
DEBUG = false;
var NOT_FOUND = "Uh oh -- no velib data found...\n";

function notFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain"
                     , "Content-Length": NOT_FOUND.length
                     });
  res.end(NOT_FOUND);
}

var starttime = (new Date()).getTime();

var url = require("url");
var http = require("http");
var util = require("util");
var readFile = require("fs").readFile;
var report = require("./lastreport");
var mime = require("./mime");

function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

function staticHandler(filename) {
  var body, headers;
  var content_type = mime.fn.lookupExtension(extname(filename));

  function loadResponseData(callback) {
    if (body && headers && !DEBUG) {
      callback();
      return;
    }

    util.puts("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        util.puts("Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        if (!DEBUG) headers["Cache-Control"] = "public";
        util.puts("static file " + filename + " loaded");
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  }
};

var getMap = {};

getMap['/report.json'] = function (req, res) {
	var parts = url.parse(req.url, true);
	var before = parts.query.before;
	
    report.time(before, res.simpleJSON);
    return;
};
getMap['/coords.json'] = staticHandler("coords.json");
getMap['/natural_paris.json'] = staticHandler("natural_paris.json");
getMap['/railways_paris.json'] = staticHandler("railways_paris.json");
getMap['/'] = staticHandler("live2.html");
getMap['/full.PNG'] = staticHandler("full.PNG");
getMap['/empty.PNG'] = staticHandler("empty.PNG");
getMap['/bonus.PNG'] = staticHandler("bonus.PNG");
getMap['/ooo.PNG'] = staticHandler("ooo.PNG");
getMap['/styles.css'] = staticHandler("styles.css");
getMap['/live2.html'] = staticHandler("live2.html");

var server = http.createServer(function(req, res) {
  if (req.method === "GET" || req.method === "HEAD") {
    var handler = getMap[url.parse(req.url).pathname] || notFound;

    res.simpleText = function (code, body) {
      res.writeHead(code, { "Content-Type": "text/plain"
                          , "Content-Length": body.length
                          });
      res.end(body);
    };

    res.simpleJSON = function (code, obj) {
      var body = new Buffer(JSON.stringify(obj));
      res.writeHead(code, { "Content-Type": "text/json"
                          , "Content-Length": body.length
                          });
      res.end(body);
    };

    handler(req, res);
  }
});

/*var socketio = require("socket.io").listen(server);

socketio.on('connection', function (socket) {
  socket.on('report', function(data) {
  	report.time(data.timestamp, socket, true);
  });
});*/

server.listen(Number(process.env.PORT || PORT), HOST);
