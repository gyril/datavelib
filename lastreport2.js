var mysql = require('db-mysql');
var report = exports;

var db = new mysql.Database({
     hostname: 'localhost',
     user: '6ou',
     password: 'vvelibb',
     database: 'velib'
  }).on('error', function(error) {
     console.log('ERROR: ' + error);
  }).on('ready', function(server) {
     console.log('Connected to ' + server.hostname + ' (' + server.version + ')');
  });

report.time = function (before, callback, soc) {

 var timestring = '';
 if(parseInt(before) != 0)
   timestring = " WHERE timestamp < "+before;

 db.connect(function(error) {
     if (error) {
         return console.log('CONNECTION error: ' + error);
     }

     this.query("SELECT velib3.station, velib3.free, velib3.available, velib3.total, velib3.timestamp FROM ( SELECT station, MAX(timestamp) AS max_timestamp FROM velib3"+timestring+" GROUP BY station ) AS t JOIN velib3 ON velib3.station = t.station AND velib3.timestamp = t.max_timestamp;").
	execute(function(error, rows, cols) {
		if (error) {
			console.log('ERROR: ' + error);
			return;
		}

		console.log(rows.length + ' rows found');
		for( var i = 0; i < rows.length; i++ ) {
			rows[i]['station'] = rows[i]['station'].toString();
			var ratio = rows[i]['available']/(rows[i]['free']+rows[i]['available']);
		}
		if(typeof soc == 'undefined')
			callback(200, rows);
		else callback.emit('response', rows);
	});
  });

};