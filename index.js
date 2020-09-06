const Discord = require("discord.js");
const https = require("https");

const ergastApiUrl = "https://ergast.com/api/f1/"
const client = new Discord.Client();
const prefix = '!';

const emojis = {
  mercedes: '<:mercedes:751974560089374881>',
  red_bull: '<:redbull:751974559925796914>',
  ferrari: '<:ferrari:751974559523143741>',
  williams: '<:williams:751974559921602692>',
  renault: '<:renault:751974558721900678>',
  alphatauri: '<:alpha:751974558260527275>',
  alfa: '<:alfa:751974560210878597>',
  haas: '<:haas:751974560127123456>',
  mclaren: '<:mclaren:751974558680088607>',
  racing_point: '<:racingpoint:751974559741116497>'
}


client.on("message", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  // Commands
  if (command === "ping") {
    // mostly for debugging
    const timeTaken = Date.now() - message.createdTimestamp;
    const messageToSend = `Pong! This message had a latency of ${timeTaken}ms.`
    message.reply(messageToSend);
    console.log(args)
  }

  // Next race time and location.
  if (command === "next") {
    const url = ergastApiUrl + "current/next" + ".json"

    callErgast(url, (body) => {
        const race = body.MRData.RaceTable.Races[0]

        const messageToSend = 
`Round ${race.round}: The ${race.raceName}, at ${race.Circuit.circuitName}`

        var date = new Date(race.date + ' ' + race.time)
        const datetime = date.toString()

        message.channel.send(messageToSend + '\n' + datetime)
        console.log(messageToSend + '\n' + datetime)
    });
  }

  if (command === "help") {
    message.channel.send("Available Commands: " +
      "\`\`\`" +
      "!help      - Show this message\n" +
      "!ping      - Check if Fito is awake\n" +
      "!next      - Next race\n" +
      "!points [wdc/wcc] [n] - Top n WDC/WCC standings \n" +
      "\`\`\`")
  }

  if (command === "standings") {
    if ("wcc" === args[0]) {
      const getConstructorData = (body) => {
        let data = body.MRData
                       .StandingsTable
                       .StandingsLists[0]
                       .ConstructorStandings
          .map((constructor) => {
            return {
              points: constructor.points,
              name: constructor.Constructor.name,
              emoji: emojis[constructor.Constructor.constructorId]
            }
          })
        let messageToSend = data.map((constructor, index) => {
          return `${index+1}. ${constructor.name}\t${constructor.emoji}\t${constructor.points}\n`
        }).slice(0, args[1] | 5).join('')

        message.channel.send(messageToSend)
      }
      const url = ergastApiUrl + 'current/constructorStandings.json'
      callErgast(url, getConstructorData)
      return
    }

    const getDriverData = (body) => {
      let data = body.MRData
                   .StandingsTable
                   .StandingsLists[0]
                   .DriverStandings
                   .map((driver) => {
                     return {
          points: driver.points,
          full_name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
          constructor: emojis[driver.Constructors[0].constructorId]
      }})

      let messageToSend = data.map((driver, index) => {
        return `${index+1}. ${driver.full_name} ${driver.constructor}\t${driver.points} pts\t\n`
      }).slice(0, args[1] | 5).join('')

      message.channel.send(messageToSend)
    }

    const url = ergastApiUrl + "current/driverStandings.json"
    console.log('Showing WDC standings')
    callErgast(url, getDriverData)
  }
});

const callErgast = (url, callback) => {
  https.get(url, res => {
    let body = "";

    res.setEncoding("utf8");
    res.on("data", data => {
      body += data;
    });

    res.on("end", () => {
      body = JSON.parse(body);
      callback(body)
    });
  });
}

client.login(process.env.BOT_TOKEN);
