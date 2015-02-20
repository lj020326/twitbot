//
//  Twitbot - Twitter bot that mingles, follows, favorites, retweets, and prunes
//  Also hopefully makes new friends along the way :)
//

//require('look').start();
var config_app = require('../config_app');
var logger = config_app.logger;
var user_config_file = "../config_user";

var argv = require('yargs').argv;

//console.dir(argv);
var	help = 'twitbot -c user-config-file';

if ((argv.h)||(argv.help)) {
	logger.console(help);
	process.exit(0);
}

if (argv.c) {
	logger.info('Will source user configuration from '+argv.c);
	user_config_file = argv.c;
}

var config_user = require(user_config_file);

var Bot = require('./bot');
var bot = new Bot(config_user.twitter_auth);

logger.info('Starting');

var probability_map = config_app.probability_map;
logger.debug("probability_map="+probability_map);

var qstring_arr = config_user.qstring_arr;
logger.debug("qstring_arr="+qstring_arr);

//get date string for today's date (e.g. '2011-01-01')
function datestring () {
    var d = new Date(Date.now() - 5*60*60*1000);  //est timezone
    return d.getUTCFullYear()   + '-'
	+  (d.getUTCMonth() + 1) + '-'
	+   d.getDate();
}

function handleError(err) {
    logger.error("response status:"+err.statusCode+", data="+err.data);
}

function doTwitterAction() {

    logger.info("doTwitterAction: Starting");

    bot.twit.get('followers/ids', function(err, reply) {
		if(err) return handleError(err);
		logger.info('# followers:' + reply.ids.length.toString());
    });
    
    var rand = Math.random();
	var twit_function="";

	if (config_app.test_function != null) {
		twit_function = config_app.test_function;
	} else if(rand <= probability_map.mingle) { //  make a friend
		twit_function = "mingle";
	} else if(rand <= probability_map.favorite) { //  make a friend
		twit_function = "favorite";
	} else if(rand <= probability_map.follow) { //  make a friend
		twit_function = "follow";
	} else if(rand <= probability_map.retweet) { //  make a friend
		twit_function = "retweet";
	} else if(rand <= probability_map.prune) { //  make a friend
		twit_function = "prune";
	}

	if(twit_function=="mingle") { //  make a friend
		logger.info('bot.mingle: starting');
		bot.mingle(function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			logger.debug("Mingle: followed @" + name);
		});
	} else if(twit_function=="favorite") {  // favorite a tweet
		var qstring = bot.randIndex(qstring_arr);

		var params = {
				q: qstring
			, since: datestring()
			, result_type: "mixed"
		};

		logger.info('bot.favorite: qstring='+qstring);
		bot.favorite(params, function(err, reply) {
			if(err) return handleError(err);
			logger.debug("Favorite: favorited response: " + reply.id);
		});
	} else if(twit_function=="follow") {  // do a targeted follow
		var qstring = bot.randIndex(qstring_arr);
		var params = {
				q: qstring
			, since: datestring()
			, result_type: "mixed"
		};

		logger.info('bot.searchFollow: qstring='+qstring);
		bot.searchFollow(params, function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			logger.debug("SearchFollow: followed @" + name);
		});
    } else if(twit_function=="retweet") {  // retweet
		var qstring = bot.randIndex(qstring_arr);

		var params = {
				q: qstring
			, since: datestring()
			, result_type: "mixed"
		};

		logger.info('bot.retweet: qstring='+qstring);
		bot.retweet(params, function(err, reply) {
			if(err) return handleError(err);
			logger.debug("Retweet: retweeted response: " + reply.id);
		});
	} else if(twit_function=="prune") { //  prune a friend
		logger.info('bot.prune');
		bot.prune(function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			logger.info('Prune: unfollowed @'+ name);
		});
	} else { // do nothing
		logger.info('do nothing');
		noop();
	}

	logger.debug("doTwitterAction: setting next runtime");
    var constantTime = 1000*60*12;// 12 minutes
    var randomTime = Math.floor(6*60*1000*Math.random());// upto 10 seconds
    var nextRuntime = constantTime + randomTime;
	setTimeout(function() { doTwitterAction() }, nextRuntime);// upto 10 seconds
}


logger.info("calling doTwitterAction()");

doTwitterAction();

