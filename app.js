/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

var main = function () 
{ 
	'use strict';
	var url = 'http://localhost:3000/';
    var socket = io();
    var right = 0;
    var wrong = 0;
    var username;
    var rScore = 0;
    var wScore = 0;
    var ID = 0;

	var get = function () 
    {
        //getQuestion
        url += 'getQuestion';
        $.ajax(
        {
            url: url, 
            type: 'GET',
            data: '',
            success: function(data)
            {
                socket.emit('Question Received', data.question, data.id);
            }
        });
            
        url = 'http://localhost:3000/';              
	};

	var post = function (choice) 
    {
        //postQuestion
        if(choice === 1)
        {
            var newQuestion;
			var newAnswer;        	
        	url += 'postQuestion';

            newQuestion = $('#new-question').val();
            newAnswer = $('#new-answer').val();
            
            $.ajax(
            {
            	url: url, 
            	type: 'post',
                dataType: 'json',
                data: JSON.stringify({"question": newQuestion, "answer": newAnswer }),
                contentType: 'application/json',
                success: function(data)
                {
                    alert(data.success);
                }
            });
            
            url = 'http://localhost:3000/';
        }
        //postAnswer        
        else
        {
        	url += 'postAnswer';        	
        	var possibleAnswer;

            possibleAnswer = $('#possible-answer').val();
            
            $.ajax(
            {
            	url: url, 
            	type: 'post',
                dataType: 'json',
                data: JSON.stringify({"answer": possibleAnswer, "id": ID }),
                contentType: 'application/json',
                success: function(data)
                {
                    $('#result').val(data.result);
                    
                    if(data.result === "CORRECT!")
                    {
                        right += 1;
                    }
                    else
                    {
                        wrong += 1;
                    }
                    socket.emit('update score', right, wrong);
                }
            });
            
            url = 'http://localhost:3000/';
        }
	};

	
    $('.get-question button').on('click', function (event) 
    {
    	get();
	});

	$('.post-question button').on('click', function (event) 
    {
    	post(1);
    	$('.post-question input').val("");
	});

	$('.post-answer button').on('click', function (event) 
    {
    	post(2);

    	$('#possible-answer').val("");
    	$('#question-id').val("");
	});    


    $('#submit').on('click', function (event) 
    {
        if($('#username').val().length !== 0)
        {
            username = $('#username').val();
            
            socket.emit('join', username, function (response) {
                if(response === '1')
                {
                    $('.container').show();
                    $('.users').show();                    
                    $('.Start-Round').show();
                    $('.Update-Database').show();
                    $('.login').hide();
                    $('.Header-Display').hide();
                    $('.Answer-Question').hide();
                    $('.post-question').hide();  
                    $('.Round-Over').hide();                  
                }
                else
                {
                    $('.container').show();
                    $('.users').show();                    
                    $('.Get-Question').hide();
                    $('.Update-Database').hide();
                    $('.Header-Display').hide();
                    $('.login').hide();
                    $('.Answer-Question').hide();
                    $('.post-question').hide();
                    $('.Round-Over').hide();
                }
            });               
        }
    });  


    socket.on("update-people", function(users, rightArray, wrongArray)
    {
        $(".users").empty();
        var rArray = {};
        var wArray = {};

        $.each(rightArray, function(clientid, rightScore) 
        {
             rArray[clientid] = rightScore;    
        });

        $.each(wrongArray, function(clientid, wrongScore) 
        {
            wArray[clientid] = wrongScore;
        });
        
        $.each(users, function(clientid, username) 
        {
            $('.users').append("<li>" + username + " score: " + " right: " + rArray[clientid] +  " wrong: " + wArray[clientid] + "</li>");    
        });         
   });
    socket.on('Question Received', function(question, id)
    {
        $('.Get-Question').show();
        $('.Answer-Question').show();
        $('#trivia-question').val(question);
        ID = id;        
    });
    socket.on('Game Over', function(question, id)
    {
        right = 0;
        wrong = 0;
        socket.emit('update score', right, wrong);

        $('.container').hide();
        $('.Header-Display').hide();
        $('.Round-Over').show();
    });

};

$(document).ready(main);
