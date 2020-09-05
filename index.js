const Discord = require("discord.js");
const config = require("./config.json");
const https = require("https");

const client = new Discord.Client();

const prefix = "!";
const ergastApiUrl = "https://ergast.com/api/f1/"

client.on("message", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  // Commands
  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }

  if (command === "next") {
    const url = ergastApiUrl + "current/next" + ".json"
    https.get(url, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        body = JSON.parse(body);

        const race = body.MRData.RaceTable.Races[0]
        const messageToSend = `Round ${race.round}: The ${race.raceName}, at ${race.Circuit.circuitName}`

        var date = new Date(race.date + ' ' + race.time)
        const datetime = date.toString()

        message.channel.send(messageToSend + '\n' + datetime)
      });
    });
  }
});

client.login(config.BOT_TOKEN);
