var forEachSync = require('./forEachSync');
var request = require('request');
var _ = require('underscore');
var KEYS = null,
	ZDP = null,
	cpus = 8,
	totalSHCount = 0,
	totalSZCount = 0;
var count = 0;
var post = function(obj) {
		var options = {
			url: 'http://127.0.0.1:8080/receive',
			method: 'POST',
			json: obj,
			timeout: 100000000
		};

		request(options, function(e, res, body) {
			console.log(body);
			body = body || {
				'val': []
			};
			body = body.val;
			if(body.length == 3) {
				console.log(body[2]);
			} else if(body.length == 2) {
				totalSHCount = parseInt(totalSHCount) + parseInt(body[0]);
				totalSZCount = parseInt(totalSZCount) + parseInt(body[1]);
			}
			count = count + 1;
			if(count == cpus) save();
		})
	}
var caluate = function(keys) {
		console.log('沪深股票个数：' + keys.length + '个');
		var index = parseInt(keys.length / cpus);
		if(index * cpus < keys.length) {
			cpus = parseInt(cpus) + 1;
		}
		for(var i = 0; i < cpus; i++) {
			var temp = keys.slice(i * parseInt(index), (i + 1) * parseInt(index));
			post({
				'val': temp
			});
		}
	}
var contains = function(str, sub) {
		return(str + '').indexOf(sub) != -1 ? true : false;
	}

var save = function() {
		console.log('耗时：' + parseInt((new Date().getTime() - start_.getTime()) / 1000) + '秒');
		console.log('SH停牌:' + totalSHCount+'个','SZ停牌:' + totalSZCount + '个');
		setTimeout(function(){
			process.exit(0);
		},5000);
		// redis.set('SHZ.ZDP', data, function(ee, rr) {
		// 	if(ee){
		// 		log.error('停牌股票存储失败。');
		// 	}else{
		// 		log.debug('停牌股票计算完毕，沪市：'＋sh + '个,深市：' + sz + '个。');
		// 	}			
		// });
	};

var getZDP = function(sh, sz) {
		redis.get('SHZ.ZDP', function(e, r) {
			if(e) {
				process.nextTick(function() {
					getZDP(sh, sz);
				});
			} else {
				save(r, sh, sz);
			}
		})
	};

var redis = require('redis').createClient(6390, '172.16.39.31');

var getKeys = function() {

		redis.hkeys('SC.STOCK', function(e, r) {
			if(e) {

			} else {
				var keys = _.filter(r, function(item) {
					return !contains(item, 'HK');
				})
				caluate(keys);
			}
		})
	}
var start_ = new Date(); /**计算停牌股票*/
var computeSuspension = function(redis) {
		if(KEYS) {
			compute();
		} else {
			getKeys();
		}
	}
computeSuspension();
exports.start = function(redis) {

}