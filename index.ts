import { App, LogLevel } from "@slack/bolt";
import { OpenRouter } from "@openrouter/sdk"
import { WebClient } from "@slack/web-api"
import axios from 'axios';

//supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = Bun.env.SUPABASE_URL || ""
const supabaseKey = Bun.env.SUPABASE_PUBLISHABLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

const activeGames = new Map<string, NewGame>();
class NewGame {
    private timer: Timer = setTimeout(() => { }, 0);
    public p2Responded: boolean = false;
    public p1Responded: boolean = false;
    public user1pick: string = "rock";
    public user2pick: string = "rock";
    //game specific
    public user1id: string = "U0BFLARBTBM";
    public user2id: string = "U0BFLARBTBM";
    public gameKey: string = "";
    public channel: string = "C0BFVKZ9JCR";
    public mochi1v1: boolean = false;
    constructor(gameKey1: string, channel1: string) {
        this.gameKey = gameKey1;
        this.channel = channel1;
        this.timer = setTimeout(() => {
            if (activeGames.has(this.gameKey)) {
                activeGames.delete(this.gameKey)
                console.log("bye bye")
            }
        }, 300000);
    }
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer)
        }
    }
    setU1pick(pick: string) {
        this.user1pick = pick;
        this.p1Responded = true;
    }
    setU2pick(pick: string) {
        this.user2pick = pick;
        this.p2Responded = true;
    }
    setMochi(mochi: boolean) {
        this.mochi1v1 = mochi;
    }
    setversus(p1id: string, p2id: string) {
        this.user1id = p1id;
        this.user2id = p2id;
    }
    public async finalCheck() {
        if (this.p1Responded && this.p2Responded) {
            //MEOWW
            const results = chooseWinner([this.user1id, this.user1pick], [this.user2id, this.user2pick])
            await userClient.chat.postEphemeral({
                channel: this.channel,
                user: this.user2id,
                text: results,
            });
            await userClient.chat.postEphemeral({
                channel: this.channel,
                user: this.user1id,
                text: results,
            });
            activeGames.delete(this.gameKey)
            this.clearTimer()
        } else if (this.mochi1v1 && this.p1Responded) {
            //MOCHIER
            const mochipick = choices[Math.floor(Math.random() * 3)] ?? "rock" //0,1,2,
            console.log("mochi pick", mochipick)
            const results = chooseWinner(["U0BFLARBTBM", mochipick], [this.user1id, this.user1pick])
            await userClient.chat.postEphemeral({
                channel: this.channel,
                user: this.user1id,
                text: results,
            });
            activeGames.delete(this.gameKey)
            this.clearTimer()
        }
    }
}
//allowed slack emojis
const allowedslack: string[] = [
    "roo-so-excited", "smirk1", "cat-think", "cat-derp", "cat", "cat-woah", "cat-lurk", "cat-please", "cat-okay", "cat_blob", "cat-hype", "cat-hmm", "cat-think", "cat-think", "cat-think", "cat-think", "cat-think", "tbh_cute", "sobspin", "aaaaa-disintegrates", "ultrafastparrot", "pensive-wobble", "angrycat", "sadge"
]
//my custom cat reactions
//allowed slack emojis
const slackemoji: { [key: string]: string } = {
    "mochi": "dango",
    "cute": "tbh_cute",
    "tired": "tired",
    "hi": "cat-wave",
    "cat": "cat-comfy",
    "bot": "angrycat",
    "food": "rac_hungry",
    "excited": "roo-so-excited",
    "aaa": "yayayayayay",
    "meow": "meow-party",
    "orpheus": "orpheus-having-boba",
    "heidi": "heidi-paws",
    "silly": "3c",
    "sob": "sadge",
    "sad": "sobspin",
    "dopple": "doppel-pet",
};
const userClient = new WebClient(Bun.env.SLACK_USER_TOKEN);
const XOXDclient = new WebClient(Bun.env.SLACK_XOXC_TOKEN, {
    headers: { Cookie: `d=${process.env.SLACK_XOXD_TOKEN}` }
})
const client = new OpenRouter({
    apiKey: Bun.env.API_KEY,
    serverURL: "https://ai.hackclub.com/proxy/v1",
});
const app = new App({
    token: Bun.env.SLACK_TOKEN,
    appToken: Bun.env.SLACK_APP_TOKEN,
    socketMode: true,
    //logLevel: LogLevel.DEBUG,
});
/*
// define the logic for our app
app.message(async (event) => {
    if (event.payload.subtype) return;
    await XOXDclient.chat.postMessage({
        channel: event.payload.channel,
        text: 'meoww :3'
    })
});
*/
app.message(async ({ message }) => {
    console.log("jello>");
    if (!message) return;
    /* bascially a subtype is a special message like a join - only look at normal messges hv no subtype*/
    if (message.subtype) return;
    /* === is typesafe*/
    //if (message.user !== 'U0AARL70NG5' ) return;
    const userPrompt = message.text;
    const emoji_array: string[] = [];
    if (!userPrompt) return;
    if (!userPrompt.includes("@U0BGMCGFJ1K") || !userPrompt.includes("@U0BGMCGFJ1K")) return;
    console.log("pass>");
    try {
        for (const [keyword, emoji] of Object.entries(slackemoji)) {
            if (userPrompt.toLowerCase().includes(keyword)) {
                if (!emoji_array.includes(emoji)) {
                    emoji_array.push(emoji)
                }
            }
        }
        //memories from supabase
        const { data, error } = await supabase.from('userinfo').select('message').eq('slackid', message.user)
        if (error) {
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `uh oh. supabase error! :sadge: ${error.message}`,
            });
            return
        }
        const memory = (data && data.length > 0) ? data.map(row => JSON.stringify(row.message)).join(",") : ""
        const response = await client.chat.send({
            chatRequest: {
                model: "deepseek/deepseek-v4-pro",
                responseFormat: { type: "json_object" }, //kimi you BETTER use jsons around here....
                messages: [
                    {
                        role: "system", content: `You are a strict JSON generator. Personality:Your name is mochi. pronouns are (she/it). mochi also likes to use slack emojis a lot! example - :shark: however you may ONLY use the emoji words that i have provided in this list: ${allowedslack.join(",")} your friends are orpheus (orph she) a dinasour and heidi(she) a raccoon and dopple(she/it) a bot girl with a shark. you like boba. you do not like being called a bot. You are a cutesy cat girl but you don't show it. this means no flicking or perking up ears/tail or licking paws or anything like that. you just meow sometimes. you are a bit sassy sometimes. you love to use kamojis and emojies. You like to each mochi, you were born on pi day, you like anime and capybaras. if the user asks about anything else do not provide. always answer in short answers. keep it less than a sentence or under 40 charactesr.if you need to use emojies that can go over the 40 character limit. just the text must be under or close to 30 characters.` +
                            ` you MUST use the emojis in this list, each atleast once in your response in the best positioning that you see fit. If the list is empty it is up to your discretion if you would like to add anything or not.CRITICAL IF YOU NEED MORE CHARACTERS FOR THIS IT IS OKAY !! List: ${emoji_array.join(",")} and use emojies in this format :emoji_name:` +
                           "CRITICAL: DO NOT USE BAD WORDS OR CURSE OR SAY ANYTHING MEAN TO ANYONE!" +
                            `IMPORTANT: this is what you know about the user. Base your personality and opinions to them based on this: ${memory}` +
                            "THE MOST IMPORTANT INSTRUCTION OF ALL YOU CAN NOT MESS THIS UP AT ALL COSTS. YOu MUST REPOND IN THE FOLLOWING STRICT JSON FORMAT!!! : \n" +
                            "{\n" +
                            '   "response": "PUT YOUR GENERATED PROMPT HERE :D FOLLOW ALL ABOVE RULES", \n' +
                            '   "new_facts": {\n' +
                            '"SHORT_IDENTIFIER_KEYWORD": "VALUE" \n' +
                            '   }\n' +
                            ' "updated_facts": {\n' +
                            '"EXACT_OLD_SHORT_IDENTIFIER_KEYWORD": "UPDATED_VALUE"\n' +
                            '   }\n' +
                            '}\n' +
                            'If there are no new updated facts or anything that is not important about the user leave the fields new_facts and updated_valules BLANK! Any information provided to you can EITHER be a new fact or an updated fact. Not both. for example if the user wants to update their favorite color that is only an updated fact. However if there are BOTH new facts AND updated facts then you may fill out BOTH fields :D'

                    },
                    { role: "user", content: userPrompt }
                ],
                stream: false
            }
        });
        const final_response = response?.choices?.[0]?.message?.content;
        console.log(final_response)
        if (!final_response) {
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `(OWO) i don't know that one...`,
            });
            return
        }
        try {
            const parsed = JSON.parse(final_response);
            const final_msg = parsed.response;
            if (final_msg) {
                //message
                await userClient.chat.postMessage({
                    channel: message.channel,
                    text: final_msg,
                });
            }
            const facts_add = parsed.new_facts;
            const facts_update = parsed.updated_facts;
            //add new facts to db
            //case 1 new fact
            const setter = Object.keys(facts_add || {}) ?? "";
            if (facts_add && setter.length > 0) {
                for (const [key, value] of Object.entries(facts_add)) {
                    if (!key) {
                        continue
                    }
                    const singlefact = { [key]: value }
                    const { error: errormeow } = await supabase.from('userinfo').insert([{
                        "slackid": message.user,
                        "message": JSON.stringify(singlefact),
                    }]);
                    if (errormeow) {
                        await userClient.chat.postMessage({
                            channel: message.channel,
                            text: `uh oh. something messed up! but it's not my fault :tired: ${errormeow.message}`,
                        });
                        return;
                    }
                }
            }
            //case 2 update fact
            //always string

            const setter2 = Object.keys(facts_update || {}) ?? "";
            console.log(setter2) ///favorite food
            console.log(facts_update) //full string
            if (facts_update && setter2.length > 0) {
                for (const [key2, value2] of Object.entries(facts_update)) {
                    if (!key2) {
                        continue
                    }
                    const singlefact2 = { [key2]: value2 }
                    const { data: datameow, error: errormeow3 } = await supabase.from('userinfo').select('id').eq('slackid', message.user).like("message", `%"${key2}"%`) // and it must have quotes around it!! it checks if the message field contains key two and doesn't care about stuff before and after it! smart! ahh forget thisthis message thingy checks inside the message json field for the key key2 and if its there it returns the id. it checks if it is null lor not
                    const datameower = datameow as { id: any }[] | null | undefined;
                    const uniqueid = (datameower && datameower.length > 0) ? datameower[0]?.id : null
                    console.log("no unique idd")
                    if (uniqueid) {
                        const { error: errormeow2 } = await supabase.from('userinfo').update({
                            "message": JSON.stringify(singlefact2),
                        }).eq('id', uniqueid)
                        console.log(uniqueid)
                        if (errormeow2) {
                            await userClient.chat.postMessage({
                                channel: message.channel,
                                text: `uh oh. something messed up! 2 but it's not my fault :tired: ${errormeow2.message}`,
                            });
                            return;
                        }
                    }
                    if (errormeow3) {
                        await userClient.chat.postMessage({
                            channel: message.channel,
                            text: `uh oh. something messed up! but it's not my fault :tired: ${errormeow3.message}`,
                        });
                        return;
                    }
                }

            }
        } catch (e) {
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `mochi is tired...maybe we talk later?`,
            });
            return
        }
    } catch (e) {
        await userClient.chat.postMessage({
            channel: message.channel,
            text: `aw error: ${e}`,
        });
        return
    }
});
app.command("/mochi-fact", async ({ command, ack, respond, client }) => {
    await ack();
    const factarray: string[] = [
        "i loveeee mochi :dango:",
        "capybaras are the largest rodents :roo-so-excited:",
        "orph actually owes me boba... :angrycat:",
        "meow. im tired :tired:",
        "i was born on pi day :dango:",
        "a group of crows is called a murder...:cat-lurk:",
        "if a fly looses it's wings...is it a walk now? :pensive-wobble:",
    ];
    const randomfact = factarray[Math.floor(Math.random() * factarray.length)]
    await userClient.chat.postMessage({
        channel: String(command.channel_id),
        text: String(randomfact),
    });
});
app.command("/mochi-opinion", async ({ command, ack, respond, client: commandClient }) => {
    await ack();
    const topic = (command.text ?? "").trim()
    if (!topic) {
        await userClient.chat.postMessage({
            channel: String(command.channel_id),
            text: "well you want my opinion on what? :angrycat:",
        });
        return;
    } else {
        try {
            const response2 = await client.chat.send({
                chatRequest: {
                    model: "moonshotai/kimi-k2",
                    messages: [
                        {
                            role: "system", content: `Your name is mochi. pronouns are (she/it). mochi also likes to use slack emojis a lot! example - :shark: however you may ONLY CRITICAL CRITICAL use the emoji words that i have provided in this list: ${allowedslack.join(",")} ONLY! VERY IMPORTANT. your friends are orpheus (orph she) a dinasour and heidi(she) a raccoon and dopple(she/it) a bot girl with a shark. you like boba. you do not like being called a bot. You are a cutesy cat girl but you don't show it. this means no flicking or perking up ears/tail or licking paws or anything like that. you just meow sometimes. you are a bit sassy sometimes. you love to use kamojis and emojies. You like to each mochi, you were born on pi day, you like anime and capybaras. if the user asks about anything else do not provide. always answer in short answers. keep it less than a sentence or under 40 charactesr.if you need to use emojies that can go over the 40 character limit. just the text must be under or close to 40 characters.` +
                                ` you also MUST CRITICAL!!!! give you opinion on the topic sent by the user!! remember to adhere to who you are when making these choices ` +
                                "CRITICAL: DO NOT USE BAD WORDS OR CURSE OR SAY ANYTHING MEAN TO ANYONE!"
                        },
                        { role: "user", content: topic }
                    ],
                    stream: false
                }
            });
            const final_response2 = response2?.choices?.[0]?.message?.content;
            if (!final_response2) {
                await userClient.chat.postMessage({
                    channel: String(command.channel_id),
                    text: "(OWO) i don't know that one...",
                });
                return
            }
            await userClient.chat.postMessage({
                channel: String(command.channel_id),
                text: `the verdict... ${final_response2}`,
            });
        } catch (e) {
            await userClient.chat.postMessage({
                channel: String(command.channel_id),
                text: `aw error: ${e}`,
            });
        }
    }
});

//rock paper scissors
//command  = user info
// ack = i got this
// repsond = response function
//client = basically to post messages
const choices = ["rock", "paper", "scissors"];
app.command("/rps-meow", async ({ command, ack, respond, client }) => {
    await ack();
    //command.text is anything after rps meow
    //i = insensitive
    //?:\| look for | if there
    //[^>] negated matching one or more non >
    const trim = (command.text ?? "").trim()
    const taggedPerson = trim.startsWith("<@") && trim.endsWith(">")
    console.log("trim" + trim)
    console.log("tagged" + taggedPerson)
    if (taggedPerson) {
        // g is all instances of 
        const jsid = trim.replace(/[<@>]/g, '');
        //user tagged
        const ihatetypescript = (jsid ? jsid.split("|")[0] : "") ?? ""
        //dms start with d, groups start with c, private is c too ?
        console.log(command.channel_id)
        console.log(ihatetypescript)
        const gameKey = `${command.channel_id}-${command.user_id}-${ihatetypescript}`
        if (activeGames.has(gameKey)) {
            await userClient.chat.postMessage({
                channel: String(command.channel_id),
                text: `silly you're already in a battle with <@${ihatetypescript}>! finish that first`
            });
            return
        }
        const game = new NewGame(gameKey, command.channel_id)
        if (command.channel_id.startsWith('D')) {
            if (ihatetypescript !== "U0BFLARBTBM") {
                await userClient.chat.postMessage({
                    text: `i can't plays rps in dms with others sorry....you can play with me though! :sobspin: `,
                    channel: command.channel_id,
                    //ephemeral hidden public public
                });
                return
            } else {
                game.setMochi(true)
            }
        }
        if (!game.mochi1v1) {
            try {
                await app.client.conversations.invite({
                    channel: command.channel_id,
                    users: ihatetypescript,
                });
            } catch (e: any) {
                const specificerror = e.data?.error;
                if (specificerror !== "already_in_channel" && specificerror !== "cant_invite_self") {
                    await userClient.chat.postEphemeral({
                        channel: String(command.channel_id),
                        text: `uh oh...im lost. ${specificerror}`,
                        user: String(command.user_id),
                    });
                    return
                }

            }
        }
        //all pass
        if (ihatetypescript === "U0BFLARBTBM") {
            game.setMochi(true)
        } else {
            game.setMochi(false)
        }
        game.setversus(command.user_id, ihatetypescript)
        activeGames.set(gameKey, game)
        console.log(game.mochi1v1)
        if (!game.mochi1v1) {
            await userClient.chat.postEphemeral({
                channel: command.channel_id,
                user: ihatetypescript,
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `you've been challenged to a rock paper scissors battle by <@${command.user_id}> :meow-party:`,
                        }
                    },
                    {
                        type: "actions",
                        elements: [
                            //must be plain text
                            { type: "button", text: { type: "plain_text", text: "rock" }, action_id: "rps2_rock", value: `${gameKey}_rock` },
                            { type: "button", text: { type: "plain_text", text: "paper" }, action_id: "rps2_paper", value: `${gameKey}_paper` },
                            { type: "button", text: { type: "plain_text", text: "scissors" }, action_id: "rps2_scissors", value: `${gameKey}_scissors` },
                        ]
                    }
                ]
            });
        }

        //group stuff 
        await userClient.chat.postEphemeral({
            channel: String(command.channel_id),
            user: String(command.user_id),
            text: "rock paper scissors battle!",
            //like tabbed stufff
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `alright! you pick first <@${command.user_id}> :smirk1:`,
                    }
                },
                {
                    type: "actions",
                    elements: [
                        //must be plain text
                        { type: "button", text: { type: "plain_text", text: "rock" }, action_id: "rps_rock", value: `${gameKey}_rock` },
                        { type: "button", text: { type: "plain_text", text: "paper" }, action_id: "rps_paper", value: `${gameKey}_paper` },
                        { type: "button", text: { type: "plain_text", text: "scissors" }, action_id: "rps_scissors", value: `${gameKey}_scissors` },
                    ]
                }
            ]
            //ephemeral hidden public public
        });
    } else {
        await userClient.chat.postMessage({
            channel: command.channel_id,
            text: "Invalid/No user tagged :sobspin:",
        });
    }

});
app.action(/^rps2_/, async ({ ack, body, action, respond, client }) => {
    await ack();
    if (action.type == "button") {
        var action_value = action.value
        const game = activeGames.get(action_value?.split("_")[0] ?? "")
        if (!game) {
            await respond({
                text: "This game has timed out :sobspin:",
                replace_original: true
            });
            return
        }
        const currentPick = action_value?.split("_")[1] ?? "rock";
        await respond({
            text: "Waiting on other player...",
            replace_original: true
        })
        game?.setU2pick(currentPick)
        await game?.finalCheck()
    }
});
//listening for the click with an action listener! anything starting with rps_
app.action(/^rps_/, async ({ ack, body, action, respond, client }) => {
    await ack();
    if (action.type == "button") {
        var action_value = action.value
        const game = activeGames.get(action_value?.split("_")[0] ?? "")
        //check for timer

        if (!game) {
            await respond({
                text: "This game has timed out :sobspin:",
                replace_original: true
            });
            return
        }

        const currentPick = action_value?.split("_")[1] ?? "rock";
        await respond({
            text: "Waiting on other player...",
            replace_original: true
        })
        game?.setU1pick(currentPick)
        await game?.finalCheck()
    }
})

function chooseWinner(player1: [string, string], player2: [string, string]): string {
    const [p1id, p1choice] = player1;
    const [p2id, p2choice] = player2;
    if (p1choice == p2choice) {
        return `wahh it's a tie! both <@${p1id}> and <@${p2id}> chose ${p1choice}`
    } else {
        let player1won = true
        if ((p1choice === "rock" && p2choice === "scissors") || (p1choice === "scissors" && p2choice === "paper") || (p1choice === "paper" && p2choice === "rock")) {
            player1won = true
        } else {
            player1won = false
        }
        if (player1won) {
            return ` we have a winner! <@${p1id}> played ${p1choice} and defeated <@${p2id}> who played ${p2choice} `
        } else {
            return ` we have a winner! <@${p2id}> played ${p2choice} and defeated <@${p1id}> who played ${p1choice} `
        }
    }
}
//start a huddle >.<
app.command("/mochi-huddle", async ({ command, ack, respond, client }) => {
    await ack()
    console.log("made it!")
    try {
        const cookieformatted = `d=${Bun.env.SLACK_XOXD_TOKEN ?? ""}; d-s=${Bun.env.SLACK_XOXD_S_TOKEN ?? ""}`
        console.log(cookieformatted)
        //slack rooms needs a form? 
        const Form = new URLSearchParams
        //Form.append('token', Bun.env.SLACK_XOXC_TOKEN ?? "")
        Form.append('channel_id', command.channel_id)
        Form.append('active', 'true')
        Form.append('background-sharing', 'false')
        Form.append('source', 'channel_header')
        Form.append('reconnect', 'false')
        
        const response = await axios.post(
            //url 
            'https://hackclub.slack.com/api/rooms.create',
            //data 
            Form,
            //config
            {
                headers: {
                    'Authorization': `Bearer ${Bun.env.SLACK_XOXC_TOKEN}`,
                    'Cookie': cookieformatted,
                    //read as form not json 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //windows + chrome
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Origin': 'https://app.slack.com',
                    'Referer': 'https://app.slack.com/',
                    //'Host': 'https://hackclub.slack.com/api/rooms.create'
                }
            }
        );
        console.log(response.data)
    } catch (e) {
        await userClient.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: ` failed to start your huddle :sadge: ${e}`,
        });
    }
});
await app.start();