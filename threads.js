var cluster = require('cluster');
var forEachSync = require('./forEachSync');
var cpus = 8;
if(cluster.isMaster) {
	for(var i = 0; i < cpus; i++) {
		cluster.fork();
	}
} else {
	var express = require('express');
	var app = express();
	app.use(express.bodyParser());
	var redis = require('redis').createClient(6390, '172.16.39.31');
	var compute = function(codes, callback) {
			//console.log(codes);
			var SH = 0,
				SZ = 0;
			codes.forEachSync(function(key, index, cb) {
				redis.keys('TRADE.' + key, function(e, r) {
					//console.log(process.pid + ' TRADE.' + key + ',' + r)
					if(!e && r.length == 0) {
						if(contains(key, 'SH')) {
							SH = parseFloat(SH) + 1;
						} else if(contains(key, 'SZ')) {
							SZ = parseFloat(SZ) + 1;
						}
						//console.log(process.pid + ',' + SH + ',' + SZ);
					}
					cb();
				})
			}, function() {
				callback({
					'val': [SH, SZ]
				});
			});
		};
	var contains = function(str, sub) {
			return str.indexOf(sub) != -1 ? true : false;
		}

	app.post('/receive', function(req, res) {
		res.header("Content-Type", "application/json; charset=utf-8");
		try {
			obj = req.body;
			compute(obj.val, function(ob) {
				console.log('-----------------------------------process.pid:'+process.pid+',' + JSON.stringify(ob) + '--------------------------------');
				res.end(JSON.stringify(ob));
			})
		} catch(ex) {
			var error = '进程号:' + process.pid + '\n' + ex.stack;
			res.end(JSON.stringify([0, 0, error]));
		}
	});
	app.listen(8080);
	console.log('******pid：' + process.pid + '，接收端启动.。。 ');
}