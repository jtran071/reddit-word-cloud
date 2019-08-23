var cassandra = require('cassandra-driver');
var express = require('express');
var http = require('http');
var url = require('url');
var assert = require('assert');
var bodyParser = require('body-parser');

var app = express();
app.use(express.static('public'));
var urlencodedParser = bodyParser.urlencoded({extended: false });

//Connect to the cluster
var client = new cassandra.Client({contactPoints: ['127.0.0.1'], protocolOptions: {port: 9043}});
var ip = 'localhost';
var wordcount_list = [];
var subreddit_list = [];

//Connect to the Cassandra server
client.connect(function (err) {
    if(err) {
        client.shutdown();
        return console.error('There was an error connecting', err);
    }
    
    console.log('Connected to Cassandra!');
    
});

//perform query and post request for list of subreddit names
app.post('/', function(req, res) {
	subreddit_list.length = 0;
	var count = 0;
	client.execute('SELECT DISTINCT subreddit from subreddit_data_test.words', function (err, result) {
		assert.ifError(err);
		while(count < result.rowLength) {
			subreddit_list.push({subreddit:result.rows[count].subreddit});
			++count;
		}
		res.redirect('/search.html');
	});
});

//json contents of subreddit names
app.post('/subreddit-data', function(req, res) {
	res.send(subreddit_list);
});

//search page
app.get('/search.html', function(req, res) {

});

//perform query and post request for subreddit search
app.post("/search.html", urlencodedParser, function(req, res) {
	var count = 0;
	wordcount_list.length = 0;
	var search_subreddit = req.body.subreddit_search;
	var word_user = req.body.choice;
	var select_word_or_user = '';
	if (word_user == 'words')
	{
		select_word_or_user = 'word';
	}
	else if (word_user == 'userlist')
	{
		select_word_or_user = 'user';
	}
	client.execute('SELECT ' + select_word_or_user + ', count from subreddit_data_test.' + word_user + ' WHERE subreddit=\'' + search_subreddit + '\' ORDER BY "count" DESC LIMIT 100', function(err, result) {
		assert.ifError(err);
		if (word_user == 'words') {
			while(count < result.rowLength) {
				wordcount_list.push({str_wu:result.rows[count].word, 
					count:result.rows[count].count, type:'word'});
				++count;
			}
		}
		else if (word_user == 'userlist')
		{
			while(count < result.rowLength) {
				wordcount_list.push({str_wu:result.rows[count].user, 
					count:result.rows[count].count, type:'user'});
				++count;
			}
		}
		res.redirect('/redditcloud.html');
		
	});

});

//json contents of words/users and count
app.post("/search-data", function(req,res) {
	res.send(wordcount_list);
});

//error pages
app.get('*', function(reg, res) {
	res.send('Error 404: Page Does Not Exist');
});

app.listen(8080);


						
