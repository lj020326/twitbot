//
//  Bot
//  class for performing various twitter actions
//
var Twit = require('../lib/twitter');

var Bot = module.exports = function(config) { 
  this.twit = new Twit(config);
};

//
//  post a tweet
//
Bot.prototype.tweet = function (status, callback) {
  if(typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'));
  } else if(status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }
  this.twit.post('statuses/update', { status: status }, callback);
};

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = function (callback) {
  var self = this;
  
  this.twit.get('followers/ids', function(err, reply) {
      if(err) { return callback(err); }
      
      var followers = reply.ids
        , randFollower  = randIndex(followers);
        
      self.twit.get('friends/ids', { user_id: randFollower }, function(err, reply) {
          if(err) { return callback(err); }
          
          var friends = reply.ids
            , target  = randIndex(friends);
            
          self.twit.post('friendships/create', { id: target }, callback); 
        })
    })
};

//
// favorite a tweet
//
Bot.prototype.favorite = function (params, callback) {
	var self = this;

	self.twit.get('search/tweets', params, function (err, reply) {
		if(err) return callback(err);

		var tweets = reply.statuses;

		if (tweets.length==0) {
			return callback(new Error('cannot find tweets for:'+params.q));
		}

		var randomTweet = randIndex(tweets);
		self.twit.post('favorites/create', { id: randomTweet.id_str }, callback);
	});
};

//
// added new searchFollow function per apcoder.com
//
Bot.prototype.searchFollow = function (params, callback) {
	var self = this;

	self.twit.get('search/tweets', params, function (err, reply) {
		if(err) return callback(err);

		var tweets = reply.statuses;
		if (tweets.length==0) {
			return callback(new Error('cannot find tweets for: ' + params.q));
		}

		var target = randIndex(tweets).user.id_str;
		self.twit.post('friendships/create', { id: target }, callback);
	});
};


//
// retweet
//
Bot.prototype.retweet = function (params, callback) {
	var self = this;

	self.twit.get('search/tweets', params, function (err, reply) {
		if(err) return callback(err);

		var tweets = reply.statuses;

		if (tweets.length==0) {
			return callback(new Error('cannot find tweets for: ' + params.q));
		}
		var randomTweet = randIndex(tweets);
		self.twit.post('statuses/retweet/:id', { id: randomTweet.id_str }, callback);
	});
};


//
//  thank users
//

Bot.prototype.dm_thanks = function (callback) {
	var self = this;

	this.twit.get('followers/ids', function(err, reply) {
		if(err) return callback(err);

		var followers = reply.ids;

		if (followers.length==0) {
			return callback(new Error('cannot find followers for pruning'));
		}

		for (var i = 0; i < followers.length; i++) {
			var target = followers[i];
			if (!~already_sent_reply.indexOf(target)) {
				var msg = "Thanks for following!";
				self.twit.post('direct_messages/new', { user_id: target, text: msg }, callback);
//		logger.debug("Sent direct message to " + target);
				console.log("Sent direct message to " + target);
			}
		}

	});

};


//
//  prune your followers list; unfollow a friend that hasn't followed you back
//
Bot.prototype.prune = function (callback) {
  var self = this;
  
  this.twit.get('followers/ids', function(err, reply) {
      if(err) return callback(err);
      
      var followers = reply.ids;
      
      self.twit.get('friends/ids', function(err, reply) {
          if(err) return callback(err);
          
          var friends = reply.ids
            , pruned = false;
          
          while(!pruned) {
            var target = randIndex(friends);
            
            if(!~followers.indexOf(target)) {
              pruned = true;
              self.twit.post('friendships/destroy', { id: target }, callback);   
            }
          }
      });
  });
};

function randIndex (arr) {
  var index = Math.floor(arr.length*Math.random());
  return arr[index];
};

//
// choose a randox element from array
//
Bot.prototype.randIndex = function (arr) {
	return randIndex(arr);
};
