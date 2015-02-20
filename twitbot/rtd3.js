//
//  RTD2 - Twitter bot that tweets about the most popular github.com news
//  Also makes new friends and prunes its followings.
//

var nconf = require('nconf');
var path = require('path');

// replace log4js with winston due to hanging issue
var log4js = require('log4js');
var modulename = path.basename(process.argv[1]);
log4js.configure('log4js_config.json', { reloadSecs: 300 });
var logger = log4js.getLogger(modulename);

var Bot = require('./bot')
, config = './config-lee.json';

nconf.use('file', { file: config });
nconf.load();

var bot = new Bot(nconf);

logger.info('Starting');

var probability_map = nconf.get("probability_map");
logger.debug("probability_map="+probability_map);

var qstring_arr = nconf.get('qstring_arr');
logger.debug("qstring_arr="+qstring_arr);

//get date string for today's date (e.g. '2011-01-01')
function datestring () {
    var d = new Date(Date.now() - 5*60*60*1000);  //est timezone
    return d.getUTCFullYear()   + '-'
	+  (d.getUTCMonth() + 1) + '-'
	+   d.getDate();
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

function handleError(err) {
    logger.error("response status:"+err.statusCode+", data="+err.data);
}


function randIndex (arr) {
    var index = Math.floor(arr.length*Math.random());
    return arr[index];
};

function doTwitterAction() {

    logger.info("doTwitterAction: Starting");

    bot.twit.get('followers/ids', function(err, reply) {
	if(err) return handleError(err)
	logger.info('# followers:' + reply.ids.length.toString());
    });
    
    var rand = Math.random();

    if(rand <= probability_map.mingle) { //  make a friend
	logger.info('bot.mingle: starting');
	bot.mingle(function(err, reply) {
	    if(err) return handleError(err);

	    var name = reply.screen_name;
	    logger.debug("Mingle: followed @" + name);
	});
    } else if(rand <= probability_map.favorite) {  // favorite a tweet
	var qstring = randIndex(qstring_arr);

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
    } else if(rand <= probability_map.follow) {  // do a targeted follow
	var qstring = randIndex(qstring_arr);
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
    } else if(rand <= probability_map.retweet) {  // retweet
	var qstring = randIndex(qstring_arr);

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
    } else {                  //  prune a friend
	logger.info('bot.prune');
	
	bot.prune(function(err, reply) {
	    if(err) return handleError(err);

	    var name = reply.screen_name
	    logger.info('\nPrune: unfollowed @'+ name);
	});
    };

    logger.debug("doTwitterAction: setting next runtime");
    var constantTime = 1000*60*12;// 12 minutes
    var randomTime = Math.floor(6*60*1000*Math.random());// upto 10 seconds
    var nextRuntime = constantTime + randomTime;
    //    logger.debug("doTwitterAction: constantTime="+constantTime);
    //    logger.debug("doTwitterAction: randomTime="+randomTime);
    logger.debug("typeof nextRuntime="+typeof(nextRuntime));
    logger.debug("doTwitterAction: nextRuntime="+nextRuntime);
    setTimeout(function() { doTwitterAction() }, nextRuntime);// upto 10 seconds
};

logger.info("calling doTwitterAction()");

doTwitterAction();

