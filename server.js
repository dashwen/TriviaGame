var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io'),
    io = io.listen(server),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient;
    //redis = require('redis');

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//Database size is 0 at start
var count = 0;
var idUsed = [];
var round = 0;

idUsed[1] = 0;
idUsed[2] = 0;
idUsed[3] = 0;
idUsed[4] = 0;
idUsed[5] = 0;


//Connect to the database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/my_dee_bee');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected to database");
    console.log("Populating the database");

    var collection = db.collection('questions');

    count += 1;

    var input = {
        "question": "How many licks does it take to get to the center of a Tootsie Pop?",
        "answer": "The world may never know",
        "id": count
    };

    collection.insert([input], function(err, result) {
    if (err) {
            console.log(err);
        }
    });
    

    count += 1;
    var input = {
        "question": "What is the name of the alien species in the movie Alien?",
        "answer": "Xenomorph",
        "id": count
    };

    collection.insert([input], function(err, result) {
        if (err) {
            console.log(err);
        }
    });
    

    count+=1;
    var input = {
        "question": "Do you know the muffin man?",
        "answer": "Who lives on Dreary Lane?",
        "id": count
    };

    collection.insert([input], function(err, result) {
        if (err) {
            console.log(err);
        }
    });
    

    count += 1;
    var input = {
        "question": "Is 9 a prime number?",
        "answer": "no",
        "id": count
    };

    collection.insert([input], function(err, result) {
        if (err) {
            console.log(err);
        }
    });

    
    count+=1;
    var input = {
        "question": "Is the moon made out of cheese?",
        "answer": "yes",
        "id": count
    };

    collection.insert([input], function(err, result) {
        if (err) {
            console.log(err);
        }
    });

    console.log('Database populated');
});


// Redis
/*
redisClient = redis.createClient();
redisClient.set('right', 0, function(){});
redisClient.set('wrong', 0, function(){});
*/

//directory where files all lie in
app.use('/', express.static(__dirname + '/'));

// home page
app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});


var users ={};
var rightArray ={};
var wrongArray ={};
var numPlayers = 0;

// Socket.io 
io.on('connection', function(socket){
  console.log('a user connected');
  
    socket.on("join", function(username, callback){
        users[socket.id] = username;
        rightArray[socket.id] = 0;
        wrongArray[socket.id] = 0;

        numPlayers += 1;

        if(numPlayers === 1)
        {
            callback('1');
        } 
        else
        {
            callback('0');
        }

        io.emit("update-people", users, rightArray, wrongArray);
    });

    socket.on("update score", function(right, wrong){
        rightArray[socket.id] = right;
        wrongArray[socket.id] = wrong;

        io.emit("update-people", users, rightArray, wrongArray);
    });

    socket.on("Question Received", function(question, id){
        io.emit("Question Received", question, id);
    });

    socket.on("disconnect", function(){
        io.emit("update", users[socket.id] + " has left the server.");
        delete users[socket.id];
        io.emit("update-people", users);
    });

});

// Express and Socket.io both listening on port 3000
server.listen(3000, function(){
  console.log('listening on *:3000');
});



app.get('/getQuestion', function (req, res) { 
	var q, i, randQ;
    var Question = db.collection('questions');
    var idStatus = 0;


    while(idStatus === 0)
    {
        randQ = Math.trunc(Math.random()*(6 -1) + 1);
        

        if(idUsed[randQ] === 0)
        {
            idStatus = 1;
            round += 1;
            idUsed[randQ] = 1;
        

            //queries the question based on id being 1
            Question.findOne({ id: randQ }, function(err, questionObject) {
                if (err) return console.error(err);
                console.log(questionObject);
                q = questionObject.question;
                i = questionObject.id;

                res.json({"question": q, "id": i});

                if(round === 5)
                {
                    io.emit('Game Over');
                    round = 0;
                    idUsed[1] = 0;
                    idUsed[2] = 0;
                    idUsed[3] = 0;
                    idUsed[4] = 0;
                    idUsed[5] = 0;
                    numPlayers = 0;                                                                                
                }
            });        
        }
    }
});

app.post('/postQuestion', function (req, res) { 
	var newQuestion = req.body.question;
    	var newAnswer = req.body.answer;
        var Question = db.collection('questions');
    	count += 1;
    	var id = count;

    	var q1 = new Question({"question":newQuestion, "answer":newAnswer, "id":id});
        
    	// save the question
    	q1.save(function (err) { 
        	if (err !== null) {
            		// object was not saved!
            		console.log(err); 
		}
        	else{
            		console.log("the object was saved!");
        	}
    	});
	res.json({"success": "Question successfully posted!"});
});



app.post('/postAnswer', function (req, res) { 
	var collection = db.collection('questions');
    	var cursor = collection.find();
    	var answer = req.body.answer;
        var Question = db.collection('questions');
    	var id = req.body.id;    
    	id = parseInt(id);
    	cursor.forEach(function(Question) {
		if(Question.id === id) 
            	{
        		if(Question.answer === answer) 
        		{
            			//redisClient.incr('right');
            			res.json({"result": "CORRECT!"});
        		}
        		else
        		{
            			//redisClient.incr('wrong');
            			res.json({"result": "WRONG"});
        		}
           	}
    	});
});	


console.log("server is now listening");
