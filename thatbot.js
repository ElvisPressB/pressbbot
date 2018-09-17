var tmi = require('tmi.js');
var jerx = require('./coolfunctions/jerxfunctions.js');
const login = require('./login');

//This is a static load. Can update later to be asynch call so that channels can be added dynamically if needed
var channelsFile = require('./channels.json');
var admins = require('./admins.json');
var settingsJSON = require('./commandSettings.json');
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
	jerx.clearLog();
	jerx.log("Address: " + address + " Port: " + port);
	//This is a test of the timer crap I'm working on
	//var id = jerx.manageTimers((function() { console.log('This is an iterative test'); }), null, null, null);
});
// end set up, connect and console log client information

// various command cooldown variables
const soCD = 5;
const multiCD = 5;

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
	if(typeof liveSettings[channel] === "undefined")
		liveSettings[channel] = new Object();
	if(typeof liveSettings[channel].Cooldowns === "undefined")
		liveSettings[channel].Cooldowns = new Object();
	jerx.log("Initiating cooldowns for channel: "+channel);
	var settings = jerx.getChannelSettings(settingsJSON, channel);
	var commands = settings.commands;
	liveSettings[channel].Cooldowns = jerx.initCooldowns(liveSettings[channel].Cooldowns, commands);
	//client.color(typeof settings != "undefined" ? ( typeof settings.color == "string"? settings.color: "Red") : "Red");
	client.color("Red");
}); 

// ^^^^ Attempting to create a channel named object in memory upon joining a channel and store cooldowns on it ^^^^

client.on('chat', function(channel, user, message, self) {
	if(self) return;
	
	var settings = jerx.getChannelSettings(settingsJSON, channel);
	//console.log("The name of the settings is: "+settings.name+" and their preferred color is: "+settings.color);
	var Cooldowns = liveSettings[channel].Cooldowns;
	
	if (message) {

		var parsed = jerx.parse(message);
		
		if (parsed.success) {
			var command = jerx.getCommandSettings(settings, parsed.command);
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
				jerx.log(command.message);
				replaced = jerx.replaceStringContents(replaceObj);
				jerx.log(replaced);
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
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								client.say(channel, command.message);
							Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Raid cooldown not up");
							}
						}
						break;
					case "!prime":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Prime cooldown not up");
							}
						}
						break;
					case "!lurk":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Lurk cooldown not up");
							}
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
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								client.say(channel, command.message);
								Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Hype cooldown not up");
							}
						}
						break;
					case "!discord": // discord command ?
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) { // check the discord cooldown vs adjusted current time
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns[parsed.command] = new Date(); // the discord cooldown is refreshed with the current Date()
							} else {
								console.log("Discord cooldown not up: " + Cooldowns[parsed.command]); // otherwise we get a console log that the cooldown isn't up
							}
						}
						break;
					case "!skynet":
						client.say(channel, "I'm sorry, I certainly don't know what you're talking about...");
						break;
					case "!so":
						if (checkMod(user, channel)) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								if (parsed.argument.length > 1) {
									var soText = command.leadText;
									for (word in parsed.argument) {
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
						break;
					case "!multi":
						if (checkMod(user, channel)) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								var multiText = command.leadText + " " + command.multiProvider + channel.slice(1) + "/";
								for (word in parsed.argument) {
									multiText += parsed.argument[word] + "/"
								}
								multiText += "layout4";
								client.say(channel, multiText);
								Cooldowns[parsed.command] = new Date();
							}
						}
						break;
					default:
						client.say(channel, "Sorry @" + user['display-name'] + " , but I don't recognize that command, please type !commands for a list of recognized commands.");
				}
			}
		}
		jerx.log("Username is "+user.username)
		/*
		** This is a test of individual responses
		if(user.username == 'jerxhabdun')
		{
			client.say(channel, "^^ This guy knows what he's talking about");
		}
		else if(user.username == 'sergeantsmokie')
		{
			var mocked = jerx.spongeMock(message);
			jerx.log(mocked);
			client.say(channel, mocked);
		}
		*/
	}
});

client.on("whisper", function (from, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;
	
	if(jerx.searchArray(from, admins)) {
		var parsed = jerx.parse(message);
		if(parsed.success){
			client.whisper(from, "Command accepted: "+parsed.command+" with arg "+parsed.argument);
		}
		else {
			client.whisper(from, "Error!");
		}
		return;
	}
});