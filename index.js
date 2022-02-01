require("dotenv").config(); // Remove if you have your own environment variables that your server can load for you.

const { Client, Member, Guild, Role } = require("eris");
const client = new Client(process.env.BOT_TOKEN, {intents: ['guildPresences', 'guildMembers', 'guilds'], restMode: true, getAllUsers: true}); // Note for 'BOT_TOKEN', it must be something like: 'Bot <BOTTOKENHERE>'

const games = require("./game.json");

// How long the player should be playing before they get banned.
const duration = parseInt(process.env.DURATION) || 1000 * 60 * 30 // 30 minutes, feel free to edit into what you'd like. It has to be in milliseconds.

let interval;

/**
 * @param {Member} member 
 * @param {Guild} guild 
 */
function canMemberBeBanned(member, guild) {
    if (member.user.id === guild.ownerID) return false;
    if (member.user.id === client.user.id) return false;
    if (client.user.id === guild.ownerID) return true;
    if (!guild.members.get(client.user.id).roles.length) return false;
    if (!member.roles.length) return true;

    const roleMap = (role) => guild.roles.get(role);

    let roles = guild.members.get(client.user.id).roles.map(roleMap);//.sort((prev, role) => guild.roles.get(prev).position - );
    
    let highestRoleOfBot = roles[findHighest(roles).index];//roles.reduce((prev, role) => (comparePositions(prev, role, guild) > 0 ? role : prev), roles[findHighest(roles, true).index]); // I have no idea about the position of role[0], it was a blind guess so I hope it indeed is the first (bottom positioned) role.


    let rolesOfMembers = member.roles.map(roleMap);
    let highestRoleOfMember = rolesOfMembers[findHighest(rolesOfMembers).index];//rolesOfMembers.reduce((prev, curr) => (comparePositions(prev, curr, guild) > 0 ? curr : prev), rolesOfMembers[findHighest(rolesOfMembers, true).index]);//member.roles[0]);

    return comparePositions(highestRoleOfBot, highestRoleOfMember, guild) > 0;
}

/**
 * @param {Role[]} roles If it's not role[], use map.
 */
function findHighest(roles, isLowest=false) {
    let first = {index: -1, position: (isLowest) ? 99999 : 0};

    for (let i = 0; i < roles.length; i++) {
        let role = roles[i];

        if (!isLowest && first.position < role.position)     first = {index: i, position: role.position}
        else if (isLowest && first.position > role.position) first = {index: i, position: role.position};
    }

    return first;
}

/**
 * @param {string} role1 
 * @param {string} role2 
 * @param {Guild} guild 
 */
function comparePositions(role1, role2, guild) {
    const resolved = [role1, role2];
    //const resolved = [guild.roles.get(role1), guild.roles.get(role2)];

    if (resolved[0].position === resolved[1].position) return 0;
    return resolved[0].position - resolved[1].position;
}

function banCycle(verbose=false) {
    interval = setTimeout(() => {
        const cantBan = [];
        const members = []; let violatingServer = {};

        client.guilds.forEach((guild) => {
            if (!guild.permissionsOf(client.user.id).has('banMembers')) { 
                cantBan.push([guild.id, guild.memberCount, guild.name]);
                return;
            }


            guild.members.forEach((member) => {
                if (!Array.isArray(member.activities) || member.activities.length < 1 || member.activities[0].type !== 0) return;
                if (member.bot) return; // idk why, I think there's an unspoken rule where bots can't acknowledge each other

                if (!member.activities[0].timestamps || !member.activities[0].timestamps.start) return;

                // Yes, capitals letter will be tested. If you don't want this to be the case then add .toLowerCase() after gameName and member.activities.[0].name.
                if (!games.some(gameName => gameName === member.activities[0].name)) return;

                if ((member.activities[0].timestamps.start + duration) < Date.now() && canMemberBeBanned(member, guild)) {
                    // looky likey some people have been very naughtwy

                    members.push([member, member.activities[0].name]);

                    if (!violatingServer[guild.id]) violatingServer[guild.id] = 1;
                    else violatingServer[guild.id]++;
                }
            });
            
        });

        if (verbose && cantBan.length) {
            console.log("There are server(s) where this bot does not have the permission to ban!\n" + cantBan.map((val) => val[2] + ` [${val[0]}] (${val[1]} members?)`).join('\n'));
        }

        Promise.all(members.map((member) => {
            return member[0].ban(0, "Playing " + member[1] + " for so long.");
        })).then((val) => {
            if (val && val.length) console.log((val.length === 1) ? "A person has been caught and is now banned from a server!" : `${val.length} members are now banned from ${Object.keys(violatingServer)} server(s)!`);

            interval = setTimeout(banCycle, 2000);
        }, (err) => {
            // If there's any error, good luck.
            console.log(err);
        })
    }, 2000); // 2 second grace for people who've been naughty for so long.
}


client.once('ready', () => {
    console.log("Ready to ban genshin players!");

    banCycle(true);
})

client.on('error', (err, id) => {
    if (err.code === 1006) return console.log(`Shard ${id} has been reset by Discord - reconnecting automatically.`); // This is where discord has automatically disconnected you, usually there is nothing to worry about as the code will reconnect for you.
    else throw err; // This is up to you, update the code and handle as you'd like.
});

client.connect();