const Discord = require("discord.js");
const https = require("https");

const ergastApiUrl = "https://ergast.com/api/f1/"
const client = new Discord.Client();
const prefix = '!';


// corresponds to custom emoji codes in discord
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


// API helper function
const callErgast = (endpoint, callback) => {
  console.log('Hitting ' + ergastApiUrl + endpoint)

  https.get(ergastApiUrl + endpoint, res => {
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

/**
 * Bot code
 **/
client.on("message", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();


  /**
   * Commands
   **/
  if (command === "ping") {
    // mostly for debugging
    const timeTaken = Date.now() - message.createdTimestamp;
    const messageToSend = `Pong! This message had a latency of ${timeTaken}ms.`
    message.reply(messageToSend);
  }


  if (command === "help") {
    message.channel.send("Available Commands: " +
      "\`\`\`" +
      "!help      - Show this message\n" +
      "!ping      - Check if Fito is awake\n" +
      "!next      - Next race\n" +
      "!quali [n] - Latest qualifying results\n" +
      "!points [wdc/wcc] [n] - Top n WDC/WCC standings \n" +
      "\`\`\`")
  }


  if (command === "next") {
    // Next race time and location.
    callErgast('current/next.json', (body) => {
        const race = body.MRData.RaceTable.Races[0]

        const messageToSend = 
`Round ${race.round}: The ${race.raceName}, at ${race.Circuit.circuitName}`

        var date = new Date(race.date + ' ' + race.time)
        const datetime = date.toString()

        message.channel.send(messageToSend + '\n' + datetime)
    });
  }


  if (command === "quali") {
    const getQualiResults = (body) => {
      console.log('foo')

      let data = body.MRData
                      .RaceTable
                      .Races[0]
                      .QualifyingResults
        .map((result) => {
          console.log(result)
          return {
            driver_code: result.Driver.code,
            emoji: emojis[result.Constructor.constructorId],
            q1: result.Q1,
            q2: result.Q2 ? result.Q2 : '',
            q3: result.Q3 ? result.Q3 : '',
          }
        })

      let messageToSend = data.map(
        (result, index) =>
          `${index+1}. ${result.driver_code}\t${result.emoji}\t${result.q1}\t${result.q2}\t${result.q3}\n`
                              ).slice(0, args[0] | 5)
                              .join('')

      message.channel.send(messageToSend)
      return
    }
    callErgast('current/next/qualifying.json', getQualiResults)
  }


  if (command === "points") {
    // Current standings
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

        let messageToSend = data.map(
          (constructor, index) =>
            `${index+1}. ${constructor.name}\t${constructor.emoji}\t${constructor.points}\n`
                               ).slice(0, args[1] | 5)
                                .join('')

        message.channel.send(messageToSend)
      }

      callErgast('current/constructorStandings.json', getConstructorData)
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
        return `${index+1}. ${driver.full_name} ${driver.constructor}\t${driver.points}\t\n`
      }).slice(0, args[1] | 5).join('')

      message.channel.send(messageToSend)
    }

    callErgast('current/driverStandings.json', getDriverData)
  }
});

client.login(process.env.BOT_TOKEN);
