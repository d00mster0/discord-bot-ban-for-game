This is a discord bot made as a joke where this will scan through the servers, find any members who have been playing a game that's on the list (which you can customise at game.json) then ban them if they've been playing it for too long (30 minutes is the default). 

This bot uses [Node.js](https://nodejs.org/) for the environment, [npm](https://www.npmjs.com/) for the packages.
The main discord library used for this bot is [Eris](https://abal.moe/Eris/). This bot was made in just an hour so expect a lot of bugs if you've seen any. You may feel free to open an issue for any queries, **note this was created as a joke**.

A few things to know if you're going to host this bot:
 - This bot will need Presences and Members intents, both of them are privileged so you have to switch them on in the [applications page](https://discord.com/developers/applications).
 - Add .env file or rename example.env to .env then fill in the fields.
   - `BOT_TOKEN=BOTTOKENHERE`'s "BOTTOKENHERE" should be replaced with your bot's token for instance.