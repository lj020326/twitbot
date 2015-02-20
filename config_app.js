
var config = {};
module.exports = config;

var log4js = require('log4js');
var path = require('path');

var modulename = path.basename(process.argv[1]);
//log4js.configure('log4js_config.json', { reloadSecs: 300 });
log4js.configure('./log4js_config.json');

//var logger = log4js.getLogger(modulename);
config.logger = log4js.getLogger(modulename);

config.twitter_auth = {};
config.probability_map = {};

config.probability_map = {
	"mingle":0.2,
	"favorite":0.4,
	"follow":0.6,
	"retweet":0.8,
	"prune":1.00
};

config.test_function=null;

//config.test_function="mingle";
//config.test_function="favorite";
//config.test_function="follow";
//config.test_function="retweet";
//config.test_function="prune";


