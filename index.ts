import { App,  LogLevel} from "@slack/bolt";
import { OpenRouter} from "@openrouter/sdk"
import { WebClient } from "@slack/web-api"

//supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = Bun.env.SUPABASE_URL || ""
const supabaseKey = Bun.env.SUPABASE_PUBLISHABLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)


//my custom cat reactions
const slackemoji: { [key: string]: string } = {
    "mochi": "dango",
    "cute": "tbh_cute",
    "tired": "tired",
    "hi": "cat-wave",
    "cat": "cat-comfy",
    "bot": "angrycat",
    "food": "placeholder",
    "excited": "roo-so-excited",
    "aaa": "yayayayayay",
    "meow": "meow-party",
    "orpheus" : "orpheus-having-boba",
    "heidi" : "heidi-paws",
    "silly": "3c",
    "sob": "sadge",
    "sad": "sobspin",
    "dopple": "doppel-pet",
};
const userClient = new WebClient(process.env.SLACK_USER_TOKEN);
const client = new OpenRouter ({
    apiKey: process.env.API_KEY,
    serverURL: "https://ai.hackclub.com/proxy/v1",
});
const app = new App({
    token: process.env.SLACK_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: LogLevel.DEBUG
});

// define the logic for our app
app.message(async ({message}) =>{
    console.log("jello>");
    if(!message) return;
    {/* bascially a subtype is a special message like a join - only look at normal messges hv no subtype*/}
    if (message.subtype) return;
    {/* === is typesafe*/}
    if (message.user !== 'U0AARL70NG5' ) return;
    const userPrompt = message.text;
    const emoji_array: string[] = [];
    if (!userPrompt) return;
    console.log("passer>");
    if (!userPrompt.includes("@U0AARL70NG5")) return;
    console.log("pass>");
    try{
        for(const [keyword, emoji] of Object.entries(slackemoji)){
            if (userPrompt.toLowerCase().includes(keyword)){
                if(!emoji_array.includes(emoji)){
                    emoji_array.push(emoji)
                }
            }
        }
        const response = await client.chat.send({
            chatRequest: {
                model: "moonshotai/kimi-k2",
                messages: [
                    {role: "system", content: "Your name is mochi. pronouns are (she/it). mochi also likes to use slack emojis a lot! example - :shark: your friends are orpheus (orph) a dinasour and heidi a raccoon and dopple a bot girl with a shark. you like boba. you do not like being called a bot. You are a cutesy cat girl but you don't show it. this means no flicking or perking up ears/tail or licking paws or anything like that. you just meow sometimes. you are a bit sassy sometimes. you love to use kamojis and emojies. You like to each mochi, you were born on pi day, you like anime and capybaras. if the user asks about anything else do not provide. always answer in short answers. keep it less than a sentence or under 40 charactesr.if you need to use emojies that can go over the 40 character limit. just the text must be under or close to 30 characters."+
                        ` you MUST (CRITICAL) use the emojis in this list, each atleast once in your response in the best positioning that you see fit. If the list is empty it is up to your discretion if you would like to add anything or not.CRITICAL IF YOU NEED MORE CHARACTERS FOR THIS IT IS OKAY !! List: ${emoji_array.join(",")} and use emojies in this format :emoji_name`
                    },
                    {role: "user", content: userPrompt}
                ],
                stream: false
            }
        });
        const final_response = response?.choices?.[0]?.message?.content;
        if (!final_response){
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `(OWO) i don't know that one...`,
            });
            return
        }
        await userClient.chat.postMessage({
            channel: message.channel,
            text: final_response,
        });
    }catch(e){
        await userClient.chat.postMessage({
            channel: message.channel,
            text: `aw error: ${e}`,
        });
    }
});

//rock paper scissors
//command  = user info
// ack = i got this
// repsond = response function
//client = basically to post messages
app.command("/rps-meow", async ({command, ack, respond, client}) => {
    console.log("hello");
    await ack();
    console.log("test");
});
await app.start();