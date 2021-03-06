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

// Require will call this with GameServer, GameSupport, and Misc once
// gameserver.js, gamesupport.js, and misc.js have loaded.

// Start the main app logic.
requirejs([
    'hft/gameserver',
    'hft/gamesupport',
    'hft/misc/misc',
  ], function(GameServer, GameSupport, Misc) {
  var statusElem = document.getElementById("status");
 
  var numCandidates = 0;
  var candidates = {};
  var numVoters = 0;
  var players = [];
  var voters = [];
  var candrefs = {};
  var globals = {
    itemSize: 15,
  };
  Misc.applyUrlSettings(globals);

/*  var pickRandomPosition = function() {
    return {
      x: 30 + Misc.randInt(canvas.width  - 60),
      y: 30 + Misc.randInt(canvas.height - 60),
    };
  };*/

  var Goal = function() {
      this.pickGoal();
      this.radiusesSquared = globals.itemSize * 2 * globals.itemSize;
  };

  Goal.prototype.pickGoal = function() {
    //this.position = pickRandomPosition();
  };

  Goal.prototype.hit = function(otherPosition) {
    var dx = otherPosition.x - this.position.x;
    var dy = otherPosition.y - this.position.y;
    return dx * dx + dy * dy < this.radiusesSquared;
  };

  var Player = function(netPlayer, name) {
    this.netPlayer = netPlayer;
    this.name = name;
    //this.position = pickRandomPosition();
    this.color = "green";

    netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
    netPlayer.addEventListener('move', Player.prototype.movePlayer.bind(this));
    netPlayer.addEventListener('color', Player.prototype.setColor.bind(this));
    netPlayer.addEventListener('candidateRegister', Player.prototype.registerCandidate.bind(this));
	netPlayer.addEventListener('voterRegister', Player.prototype.registerVoter.bind(this));
	netPlayer.addEventListener('vote', Player.prototype.registerVote.bind(this));
	netPlayer.addEventListener('donate', Player.prototype.registerDonation.bind(this));

  };

  // The player disconnected.
  Player.prototype.disconnect = function() {
    for (var ii = 0; ii < players.length; ++ii) {
      var player = players[ii];
      if (player === this) {
        players.splice(ii, 1);
        return;
      }
    }
  };

  Player.prototype.movePlayer = function(cmd) {
   /* this.position.x = Math.floor(cmd.x * canvas.clientWidth);
    this.position.y = Math.floor(cmd.y * canvas.clientHeight);*/
    if (goal.hit(this.position)) {
      // This will generate a 'scored' event on the client (player's smartphone)
      // that corresponds to this player.
      this.netPlayer.sendCmd('scored', {
        points: 5 + Misc.randInt(6), // 5 to 10 points
      });
      goal.pickGoal();
    }
  };

  Player.prototype.registerCandidate = function (cmd) {
      numCandidates++;
      document.getElementById("candidatenum").innerHTML= numCandidates + " Candidate(s)"
	  if(!candidates[cmd.name]) {
		  candidates[cmd.name] = [];
		  candidates[cmd.name][0] = 0; // cash
		  candidates[cmd.name][1] = 0; // votes
		  UpdateCandidates(true);
	  }
	  candrefs[cmd.name]=this;
  }

  Player.prototype.registerVoter = function (cmd) {
      numVoters++;
	  /*
      document.getElementById("voternum").innerHTML = numVoters + " Voter(s)"
	  if(!candidates[cmd.name]) {
		  candidates[cmd.name] = 1;
	  }
	  else {
		  candidates[cmd.name]++;
	  }
	  
	  UpdateCandidates();
	  */
	  voters.push(this);
	  var cash = Math.floor((Math.random() * 1000) + 1);
	  if (Math.floor((Math.random() * 5) + 1) == 5)
	  {
		  if (Math.floor((Math.random() * 10) + 1) == 20)
			  cash+= Math.floor((Math.random() * 10000000000) + 1);
		  cash+=  Math.floor((Math.random() * 1000000) + 1);
	  }
	  this.netPlayer.sendCmd("candidates", {candidates:candidates, funds:cash});
  }
  
   Player.prototype.registerDonation = function (cmd) {
      
	  
	   candidates[cmd.candidate][0] +=cmd.funds;
	  candrefs[cmd.candidate].netPlayer.sendCmd("updateFunds", {funds:cmd.funds});
  }
  
   Player.prototype.registerVote = function (cmd) {
      
	  
	   candidates[cmd.candidate][1] +=1;
	   UpdateCandidates(false);
  }

  Player.prototype.setColor = function(cmd) {
    this.color = cmd.color;
  };

  var server = new GameServer();
  GameSupport.init(server, globals);

  var goal = new Goal();

  // A new player has arrived.
  server.addEventListener('playerconnect', function(netPlayer, name) {
    players.push(new Player(netPlayer, name));
  });

  var drawItem = function(position, color) {
 //   ctx.fillStyle = color;
 //   ctx.beginPath();
  //  ctx.arc(position.x, position.y, globals.itemSize, 0, Math.PI * 2);
  //  ctx.fill();
  };

  var  UpdateCandidates = function(addCandidate) {
	  var container = document.getElementById("candidatesContainer");
	  var containerHTML = "Voting Results";
	  
	  // for every candidate
	  for (var candidate in candidates){
		  containerHTML += "</br><span>"+ candidate+" has "+candidates[candidate][1]+" vote(s)</span>"
	  }
	  
	  container.innerHTML = containerHTML;
	
	if(addCandidate)
	{
		for(var i = 0; i < voters.length; i++)
		{
			voters[i].netPlayer.sendCmd("candidates", {candidates:candidates});
		}
	}
		
  }
  
  
  
  var render = function() {
   // Misc.resize(canvas);
  //  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    players.forEach(function(player) {
      drawItem(player.position, player.color);
    });
    drawItem(goal.position, (globals.frameCount & 4) ? "red" : "pink");
  };
  GameSupport.run(globals, render);
  
  setTimeout(function(){
	  
	  
	  
	  
	  for (var i = 0 ; i < players.length; i++)
	  players[i].netPlayer.sendCmd('voting', {candidates:candidates}) 
  }, 30 * 1000); // actually 600
  
});


