/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

// Start the main app logic.
requirejs([
    'hft/commonui',
    'hft/gameclient',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/mobilehacks',
    'hft/misc/touch',
  ], function(
    CommonUI,
    GameClient,
    Input,
    Misc,
    MobileHacks,
    Touch) {

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  var score = 0;
  var statusElem = document.getElementById("gamestatus");
 // var inputElem = document.getElementById("inputarea");
 // var colorElem = document.getElementById("display");
  var client = new GameClient();
  var voterButton = document.getElementById("voter");
  var candidateButton = document.getElementById("candidate");
  var clientName = document.getElementById("name");
  CommonUI.setupStandardControllerUI(client, globals);
	var hasVoted = false;
	var funds = 0;
  var randInt = function(range) {
    return Math.floor(Math.random() * range);
  };

  // Sends a move command to the game.
  //
  // This will generate a 'move' event in the corresponding
  // NetPlayer object in the game.
  var sendMoveCmd = function(position, target) {
    client.sendCmd('move', {
      x: position.x / target.clientWidth,
      y: position.y / target.clientHeight,
    });
  };

  // Pick a random color
  var color =  'rgb(' + randInt(256) + "," + randInt(256) + "," + randInt(256) + ")";
  // Send the color to the game.
  //
  // This will generate a 'color' event in the corresponding
  // NetPlayer object in the game.
  client.sendCmd('color', {
    color: color,
  });
 // colorElem.style.backgroundColor = color;

  // Send a message to the game when the screen is touched
  /*inputElem.addEventListener('pointermove', function(event) {
    var position = Input.getRelativeCoordinates(event.target, event);
    sendMoveCmd(position, event.target);
    event.preventDefault();
  });*/
  
  voterButton.addEventListener('click', function(event) {
	 client.sendCmd('voterRegister', {
		 name:clientName.value
	 })
	voterButton.style.display="none";
	candidateButton.style.display="none";
	clientName.style.display = "none";
  });
  
  candidateButton.addEventListener('click', function(event) {
	 client.sendCmd('candidateRegister', {
		 name:clientName.value
	 }) 
	voterButton.style.display="none";
	candidateButton.style.display="none";
	clientName.style.display = "none";
	
	var fundsbox = document.getElementById("funds");
	  fundsbox.innerHTML = "This is eventually where your current Campaign funds will go!"
  });

  // Update our score when the game tells us.
  client.addEventListener('scored', function(cmd) {
    score += cmd.points;
    statusElem.innerHTML = "You scored: " + cmd.points + " total: " + score;
  });
  client.addEventListener('candidates', function(cmd) {
	  if(!hasVoted) {
		  
	   var container = document.getElementById("candidatesContainer");
	   container.style.display = "block";
	  var containerHTML = "Candidates On Ballot";
	  
	  // for every candidate
	  for (var candidate in cmd.candidates){
		  containerHTML += "</br><input class=\"candidate\" type = \"button\" value =\""+ candidate+"\"  >"
	  }
	  
	  container.innerHTML = containerHTML;
	  if(cmd["funds"])
	  var fundsbox = document.getElementById("funds");
	  fundsbox.innerHTML = "You have $" + cmd.funds + " cash! You'll donate it to the candidate you select now"
	  var buttons = document.querySelectorAll("input.candidate");
	  funds = cmd.funds;
	  for (var i = 0; i < buttons.length; i++)
	  {
		  buttons[i].addEventListener('click', donate.bind(this, buttons[i]));
	  }
	  }
  })
  
  function donate(choice)
  {
	    hasVoted = true;
	  var container = document.getElementById("candidatesContainer");
	   container.style.display = "none";
	  client.sendCmd('donate', {candidate:choice.value, funds:funds});
  }
  
  function vote(choice)
  {
	  
	  hasVoted = true;
	  var container = document.getElementById("candidatesContainer");
	   container.style.display = "none";
	  client.sendCmd('vote', {candidate:choice.value});
  }
  
  //It's time to vote. Pop the stuff back up if it's beengone and put the candidates
  client.addEventListener('voting', function(cmd) {
	  //NOTE - everyone votes, including candidates
	  var fundsbox = document.getElementById("funds");
	  fundsbox.innerHTML = "It's Voting Time. Select your choice of Candidate."
	  var container = document.getElementById("candidatesContainer");
	   container.style.display = "block";
	  var containerHTML = "Candidates On Ballot";
	  var candidateList = [];
	   for (var candidate in cmd.candidates){
		   candidateList.push([candidate, cmd.candidates[candidate][0], cmd.candidates[candidate][1]])
	   }
	  //sort a list of candidates by money
	  var candidateList = candidateList.sort(function(a,b){if (a[1] < b[1]) {return -1;} else { return 1;} });
	  // for every candidate
	  for (var i = 0; i < candidateList.length; i++){
		  containerHTML += "</br><input class=\"candidate\" type = \"button\" value =\""+ candidateList[i][0]+"\" height=\""+candidateList[i][1]+"px\" width=\""+candidateList[i][1]+"px\"  >"
	  }
	  
	  container.innerHTML = containerHTML;
	  
	   var buttons = document.querySelectorAll("input.candidate");
	  funds = cmd.funds;
	  for (var i = 0; i < buttons.length; i++)
	  {
		  buttons[i].addEventListener('click', vote.bind(this, buttons[i]));
	  }
	  
	  
  });
  
  client.addEventListener('updateFunds', function(cmd){
	  var fundsbox = document.getElementById("funds");
	  funds += cmd.funds;
	  fundsbox.innerHTML = "Your campaign now has $"+funds+" work of campaign funds.";
  })
  
});

