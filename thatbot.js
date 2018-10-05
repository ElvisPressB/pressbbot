"use strict";
var tmi = require('tmi.js');
var func = require('./functions/functions.js');
const login = require('./config/login');
const Poll = require('./functions/poll.js');

// Set the error reporting level.
// 0 = no errors reported
// 1 = simple error messages reported
// 2 = full stack traces reported
const debugLevel = 1;

//This is a static load. Can update later to be asynch call so that channels can be added dynamically if needed
var channelsFile = require('./config/channels.json');
var admins = require('./config/admins.json');
var settingsJSON = require('./config/commandSettings.json');
var liveSettings = new Object();

// TMI OPTIONS
var options = {
	options: {
		debug: true
	},
	connection: {
		cluster: "aws",
		reconnect: true
	},
	identity: {
		username: login.creds.user,
		password: login.creds.auth
	},
	channels: channelsFile
};
// END TMI OPTIONS

// set up, connect and console log client information
var client = new tmi.client(options);

client.connect();

client.on('connected', function(address, port) {
	func.clearLog();
	func.log("Address: " + address + " Port: " + port);
	//This is a test of the timer crap I'm working on
	//var id = func.manageTimers((function() { console.log('This is an iterative test'); }), null, null, null);
});
// end set up, connect and console log client information

function subSeconds(numSeconds) {
	var time = new Date();
	time.setSeconds(time.getSeconds() - numSeconds);
	return time;
}

function checkMod(user, channel) {
	if (user["user-type"] === "mod" || user.username === channel.replace("#", "")) { 
		return true; 
	} else { 
		return false; 
	}
}

// vvvv Attempting to create a channel named object in memory upon joining a channel and store cooldowns on it vvvv
// tried upper and lowercase, tried multiple variable switches as the channelName variable alone was not giving the desired results and or was getting lost

client.on("join", function (channel, username, self) {
	if(self)
	{
		initOnJoin(channel);
	}
	
});

function initOnJoin(channel){
	if(typeof liveSettings[channel] === "undefined")
		liveSettings[channel] = new Object();
	if(typeof liveSettings[channel].Cooldowns === "undefined")
		liveSettings[channel].Cooldowns = new Object();
	if(typeof liveSettings[channel].Poll === "undefined")
		liveSettings[channel].Poll = new Poll();
	
	func.log("Initiating cooldowns for channel: "+channel);
	var settings = func.getChannelSettings(settingsJSON, channel);
	var commands = settings.commands;
	liveSettings[channel].Cooldowns = func.initCooldowns(liveSettings[channel].Cooldowns, commands);
	//client.color(typeof settings != "undefined" ? ( typeof settings.color == "string"? settings.color: "Red") : "Red");
	client.color("Red");
}

// ^^^^ Attempting to create a channel named object in memory upon joining a channel and store cooldowns on it ^^^^

client.on('chat', function(channel, user, message, self) {
	if(self) return;
	
	var settings = func.getChannelSettings(settingsJSON, channel);
	//console.log("The name of the settings is: "+settings.name+" and their preferred color is: "+settings.color);
	var Cooldowns = liveSettings[channel].Cooldowns;
	var poll = liveSettings[channel].Poll;

	if (message) {

		var parsed = func.parse(message);
		
		if (parsed.success) {
			var command = func.getCommandSettings(settings, parsed.command);
			//console.log("Command is: "+command.trigger+" cooldown is "+command.cooldown+" allowed is "+command.allowed+" modOnly is "+command.modOnly);
			//TODO: actually use the command object to drive the switch
			var replaceObj = {};
			var replaced = "";
			if(typeof command.replaceStrings !== "undefined") {
				replaceObj = {
					message : command.message,
					replaceArray : command.replaceStrings,
					chatInfo: {
						user: user,
						channel: channel
					}
				};
				func.log(command.message);
				replaced = func.replaceStringContents(replaceObj);
				func.log(replaced);
			}
			
			if(command.matched && command.allowed) {
				
				// this is part of the attempt to implement channel named objects in memory elvis
				// for some reason the channel name variable doesn't seem to be transferring into the switch case, tested with discord command but since reverted
				
				/* 
				var channelName = channel.replace("#", "");
				var channelObj = channelName; 
				*/
				
				switch (parsed.command) {
					case "!raid":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message);
								Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Raid cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!prime":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message.replace("$username", user['display-name']));
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Prime cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!lurk":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message.replace("$username", user['display-name']));
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Lurk cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!insta":

						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Insta cooldown not up");
							}
						}
						break;
					case "!hype":
						try {

							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message);
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Hype cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!discord": // discord command ?
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) { // check the discord cooldown vs adjusted current time
									client.say(channel, command.message.replace("$username", user['display-name']));
									Cooldowns[parsed.command] = new Date(); // the discord cooldown is refreshed with the current Date()
								} else {
									console.log("Discord cooldown not up: " + Cooldowns[parsed.command]); // otherwise we get a console log that the cooldown isn't up
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!skynet":
						try {
							client.say(channel, "I'm sorry, I certainly don't know what you're talking about...");	
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!so":
						try {
							if (checkMod(user, channel)) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									if (parsed.argument.length > 1) {
										var soText = command.leadText;
										for (let word in parsed.argument) {
											if (word == parsed.argument.length-1) {
												soText += "http://twitch.tv/" + parsed.argument[word] + " ";
											} else {
												soText += "http://twitch.tv/" + parsed.argument[word] + " & ";
											}
										}
										soText += command.followText;
										soText = soText.replace(command.replaceStrings, command.plural);
										client.say(channel, soText);
									} else {
										var soText = command.leadText + " http://twitch.tv/" + parsed.argument + " " + command.followText;
										soText = soText.replace(command.replaceStrings, command.singular);
										client.say(channel, soText);
									}
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Shoutout cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!multi":
						try {
							if (checkMod(user, channel)) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									var multiText = command.leadText + " " + command.multiProvider + channel.slice(1) + "/";
									for (let word in parsed.argument) {
										multiText += parsed.argument[word] + "/"
									}
									multiText += "layout4";
									client.say(channel, multiText);
									Cooldowns[parsed.command] = new Date();
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!poll":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								//console.log(typeof poll);
								if (poll.isActive()) {
									if (parsed.argument == "stop") {
										poll.stop();
									} else {
										poll.registerVote(parsed.argument, user.username);
									}
								} else {
									//console.log(parsed.message);
									let question = parsed.msg.split("?")[0] + "?";
									question = question.substring(5);
									let answers = parsed.msg.split("?")[1];
									answers = answers.split("/");
									for (let a in answers) {
										answers[a] = answers[a].trim();
									}
									poll = new Poll(question, answers, command.pollLength, command.minPercent, command.maxPercent, 0, client, channel);
									if (poll.start()) {
										client.say(channel, poll.getString("poll_started"));
										poll.report(client, channel);
										liveSettings[channel].Poll = poll;
									} else {
										client.say(channel, poll.getString("poll_not_started"));
									}
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!vote":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (poll.isActive()) {
									poll.registerVote(parsed.argument, user.username);
								} else {
									client.say(channel, "No poll is currently running.");
									if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
										Cooldowns[parsed.command] = new Date();
									}
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!randomsub":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								let winner = func.getRandomSub("subscriber-list.csv").then(function(result) {
									client.say(channel, "Winner is: " + result);
								});
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					default:
						client.say(channel, "Sorry @" + user['display-name'] + " , but I don't recognize that command, please type !commands for a list of recognized commands.");
				}
			}
		}
		//func.log("Username is "+user.username)
		/*
		** This is a test of individual responses
		if(user.username == 'jerxhabdun')
		{
			client.say(channel, "^^ This guy knows what he's talking about");
		}
		else if(user.username == 'sergeantsmokie')
		{
			var mocked = func.spongeMock(message);
			func.log(mocked);
			client.say(channel, mocked);
		}
		*/
	}
});

client.on("whisper", function (from, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;
	
	if(func.searchArray(from, admins).contains) {
		var parsed = func.parse(message);
		if(parsed.success){
			client.whisper(from, "Command accepted: "+parsed.command+" with arg "+parsed.argument);
			if(parsed.command === "!exit")
			{
				return process.exit(0);
			}
			else if(parsed.command === "!part")
			{
				if(typeof liveSettings["_parted"] === "undefined")
					liveSettings["_parted"] = [];
				liveSettings["_parted"].push(parsed.argument[0]);
				client.part(parsed.argument[0]);
			}
			else if(parsed.command === "!join")
			{
				var arr = liveSettings["_parted"];
				var searchResult = func.searchArray(parsed.argument[0], arr);
				if(searchResult.contains){
					
					client.join(parsed.argument[0]);
				}
			}
			else if(parsed.command === "!rejoin")
			{
				var arrayVar = liveSettings["_parted"];
				arrayVar.forEach((incObj, index) => {
					client.part(incObj);
				});
				client.part(parsed.argument[0]);
			}
		}
		else {
			client.whisper(from, "Error!");
		}
		return;
	}
});
/*
**
** Jerx is stubbing these out for potential implementation, ideally enabled by configurations for individual channels
**
client.on("hosted", function (channel, username, viewers) {
	var enabled = false;
    var minimum = 5;
	if(enabled && viewers > minimum){
		client.say(channel, "Thanks so much for the host from http://twitch.tv/"+username+" !");
	}
});

client.on("hosting", function (channel, target, viewers) {
    var enabled = false;
    var minimum = 5;
	if(enabled && viewers > minimum){
		client.say(target, "Incoming host from http://twitch.tv/"+channel+" !");
	}
});
*/
