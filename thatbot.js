var tmi = require('tmi.js');
const login = require('./login');

//This is a static load. Can update later to be asynch call so that channels can be added dynamically if needed
var channelsFile = require('./channels.json');

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
	console.log("Address: " + address + " Port: " + port);
});
// end set up, connect and console log client information

// create various objects in memory
if (typeof Cooldowns !== 'object') { 
	var Cooldowns = new Object();
}
// end create various objects in memory

// various command cooldown variables
const discordCD = 15;
const hypeCD = 5;
const instaCD = 15;
const lurkCD = 5;
const primeCD = 30;
const raidCD = 5;
const soCD = 5;

function subSeconds(numSeconds) {
		var time = new Date();
		time.setSeconds(time.getSeconds() - numSeconds);
		return time;
	}

// create cooldowns in memory
if (typeof Cooldowns.color == 'undefined') {
		Cooldowns.color = 0;
		console.log('Color cooldown: ' + Cooldowns.color);
}

if (typeof Cooldowns.discord == 'undefined') {
		Cooldowns.discord = new Date();
		console.log('Discord cmd cooldown: ' + Cooldowns.discord);
}

if (typeof Cooldowns.hype == 'undefined') {
		Cooldowns.hype = new Date();
		console.log('Hype cmd cooldown: ' + Cooldowns.hype);
}

if (typeof Cooldowns.insta == 'undefined') {
		Cooldowns.insta = new Date();
		console.log('Insta cmd cooldown: ' + Cooldowns.insta);
}

if (typeof Cooldowns.lurk == 'undefined') {
		Cooldowns.lurk = new Date();
		console.log('Lurk cmd cooldown: ' + Cooldowns.lurk);
}

if (typeof Cooldowns.prime == 'undefined') {
		Cooldowns.prime = new Date();
		console.log('Prime cmd cooldown: ' + Cooldowns.prime);
}

if (typeof Cooldowns.raid == 'undefined') {
		Cooldowns.raid = new Date();
		console.log('Raid cmd cooldown: ' + Cooldowns.raid);
}

if (typeof Cooldowns.so == 'undefined') {
		Cooldowns.so = new Date();
		console.log('SO cmd cooldown: ' + Cooldowns.so);
}
// end create cooldown Date()s in memory

client.on('chat', function(channel, user, message, self) {

	if (Cooldowns.color === 0) {
		client.color("Red");
		Cooldowns.color = 1;
	}

	if (message === "!discord") { // if the cooldown is up the discord command is listened to
		if (subSeconds(discordCD) >= Cooldowns.discord) { // checks adjusted Date() vs discord command cooldown
			client.say("ElvisPressB", "@" + user['display-name'] + " , the PressB community Discord: https://discord.gg/x3HmECn");
			Cooldowns.discord = new Date(); // the discord cooldown is refreshed with the current Date()
		} else {
			console.log("Discord cooldown not up"); // otherwise we get a console log that the cooldown isn't up
		}
	}

	if (message === "!hype") {
		if (subSeconds(hypeCD) >= Cooldowns.hype) {
			client.say("ElvisPressB", "Squid1 Squid2 Squid2 Squid3 Squid2 Squid2 Squid4");
			Cooldowns.hype = new Date();
		} else {
			console.log("Hype cooldown not up");
		}
	} 

	if (message === "!insta") {
		if (subSeconds(instaCD) >= Cooldowns.insta) {
			client.say("ElvisPressB", "@" + user['display-name'] + " , check out Elvis' weird pictures here! https://www.instagram.com/elvispressb/");
			Cooldowns.insta = new Date();
		} else {
			console.log("Insta cooldown not up");
		}
	}

	if (message === "!lurk") {
		if (subSeconds(lurkCD) >= Cooldowns.lurk) {
			client.action("ElvisPressB", "shows @" + user['display-name'] + " to a comfortable seat in the lurker section.");
			Cooldowns.lurk = new Date();
		} else {
			console.log("Lurk cooldown not up");
		}
	}

	if (message === "!prime") {
		if (subSeconds(primeCD) >= Cooldowns.prime) {
			client.say("ElvisPressB", "@" + user['display-name'] + " How to link your Twitch and Amazon Prime: https://help.twitch.tv/customer/portal/articles/2574978-how-to-link-your-amazon-account You can use your free prime sub to get a *sweet* savage emote! It's a great way to directly support Elvis!");
			Cooldowns.prime = new Date();
		} else {
			console.log("Prime cooldown not up");
		}
	}

	if (message === "!raid") {
		if (subSeconds(raidCD) >= Cooldowns.raid) {
			client.say("ElvisPressB", "twitchRaid TombRaid twitchRaid TombRaid twitchRaid TombRaid twitchRaid TombRaid twitchRaid");
			Cooldowns.raid = new Date();
		} else {
			console.log("Raid cooldown not up");
		}
	}

	if (message) {
		var soText = message;
		var soEvent = soText.slice(0, 3);
		if (soEvent === "!so") {
			if (user["user-type"] === "mod" || user.username === channel.replace("#", "")) {
				if (subSeconds(soCD) >= Cooldowns.so) {
					var targetStreamer = soText.substr(4);
					client.say("ElvisPressB", "Please go check out this amazing streamer at https://www.twitch.tv/" + targetStreamer + " and show them some love! <3 VoteYea <3");
					Cooldowns.so = new Date();
				} else {
					console.log("SO cooldown not up");
				}
			}
		} 
	} 

});