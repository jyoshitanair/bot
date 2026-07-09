import { App} from "@slack/bolt";
import { OpenRouter} from "@openrouter/sdk"
import { WebClient } from "@slack/web-api"

//supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = Bun.env.SUPABASE_URL || ""
const supabaseKey = Bun.env.SUPABASE_PUBLISHABLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

//allowed slack emojis
const allowedslack: string[] = [
    "roo-so-excited","smirk1", "cat-think","cat-derp","cat","cat-woah","cat-lurk","cat-please","cat-okay","cat_blob","cat-hype","cat-hmm","cat-think","cat-think","cat-think","cat-think","cat-think","tbh_cute","sobspin","aaaaa-disintegrates","ultrafastparrot", "pensive-wobble", "angrycat", "sadge"
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
});

// define the logic for our app
app.message(async ({message}) =>{
    console.log("jello>");
    if(!message) return;
    /* bascially a subtype is a special message like a join - only look at normal messges hv no subtype*/
    if (message.subtype) return;
    /* === is typesafe*/
    //if (message.user !== 'U0AARL70NG5' ) return;
    const userPrompt = message.text;
    const emoji_array: string[] = [];
    if (!userPrompt) return;
    if (!userPrompt.includes("@U0BFLARBTB")) return;
    console.log("pass>");
    try{
        for(const [keyword, emoji] of Object.entries(slackemoji)){
            if (userPrompt.toLowerCase().includes(keyword)){
                if(!emoji_array.includes(emoji)){
                    emoji_array.push(emoji)
                }
            }
        }
        //memories from supabase
        const {data, error} = await supabase.from('userinfo').select('message').eq('slackid', message.user)
        if (error){
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `uh oh. supabase error! :sadge: ${error.message}`,
            });
            return
        }
        const memory = (data && data.length > 0)? data.map(row => JSON.stringify(row.message)).join(","): ""
        const response = await client.chat.send({
            chatRequest: {
                model: "deepseek/deepseek-v4-pro",
                responseFormat: {type: "json_object"}, //kimi you BETTER use jsons around here....
                messages: [
                    {role: "system", content: `Personality:Your name is mochi. pronouns are (she/it). mochi also likes to use slack emojis a lot! example - :shark: however you may ONLY use the emoji words that i have provided in this list: ${allowedslack.join(",")} your friends are orpheus (orph she) a dinasour and heidi(she) a raccoon and dopple(she/it) a bot girl with a shark. you like boba. you do not like being called a bot. You are a cutesy cat girl but you don't show it. this means no flicking or perking up ears/tail or licking paws or anything like that. you just meow sometimes. you are a bit sassy sometimes. you love to use kamojis and emojies. You like to each mochi, you were born on pi day, you like anime and capybaras. if the user asks about anything else do not provide. always answer in short answers. keep it less than a sentence or under 40 charactesr.if you need to use emojies that can go over the 40 character limit. just the text must be under or close to 30 characters.`+
                        ` you MUST use the emojis in this list, each atleast once in your response in the best positioning that you see fit. If the list is empty it is up to your discretion if you would like to add anything or not.CRITICAL IF YOU NEED MORE CHARACTERS FOR THIS IT IS OKAY !! List: ${emoji_array.join(",")} and use emojies in this format :emoji_name:`+
                        "CRITICAL: DO NOT USE BAD WORDS OR CURSE OR SAY ANYTHING MEAN TO ANYONE!"+
                        `IMPORTANT: this is what you know about the user. Base your personality and opinions to them based on this: ${memory}`+
                        "THE MOST IMPORTANT INSTRUCTION OF ALL YOU CAN NOT MESS THIS UP AT ALL COSTS. YOu MUST REPOND IN THE FOLLOWING STRICT JSON FORMAT!!! : \n"+
                        "{\n"+
                        '   "response": "PUT YOUR GENERATED PROMPT HERE :D FOLLOW ALL ABOVE RULES", \n'+
                        '   "new_facts": {\n'+
                                '"SHORT_IDENTIFIER_KEYWORD": "VALUE" \n'+
                        '   }\n'+    
                        ' "updated_facts": {\n'+
                                '"EXACT_OLD_SHORT_IDENTIFIER_KEYWORD": "UPDATED_VALUE"\n'+
                        '   }\n'+    
                        '}\n'+
                        'If there are no new updated facts or anything that is not important about the user leave the fields new_facts and updated_valules BLANK! If there is an updated value then LEAVE NEW FACTS BLANK!!!. only put text in the updated value!'
                        
                    },
                    {role: "user", content: userPrompt}
                ],
                stream: false
            }
        });
        const final_response = response?.choices?.[0]?.message?.content;
        console.log(final_response)
        if (!final_response){
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `(OWO) i don't know that one...`,
            });
            return
        }
        try{
            const parsed = JSON.parse(final_response);
            const final_msg = parsed.response;
            const facts_add = parsed.new_facts;
            const facts_update = parsed.updated_facts;
            //add new facts to db
            //case 1 new fact
            const key = Object.keys(facts_add || {})[0]?? "";
            if (facts_add && key.length > 0 ){
                const {error: errormeow} = await supabase.from('userinfo').insert([{
                    "slackid": message.user,
                    "message": JSON.stringify(facts_add),
                }]);
                if (errormeow){
                    await userClient.chat.postMessage({
                        channel: message.channel,
                        text: `uh oh. something messed up! but it's not my fault :tired: ${errormeow.message}`,
                    });
                    return;
                }
            }
            //case 2 update fact
            //always string
            
            const key2 = Object.keys(facts_update || {})[0]?? "";
            console.log(key2) ///favorite food
            console.log(facts_update) //full string
            if (facts_update && key2.length > 0 ){
                const{data: datameow, error: errormeow3} = await supabase.from('userinfo').select('id').eq('slackid', message.user).like("message", `%"${key2}"%`) // and it must have quotes around it!! it checks if the message field contains key two and doesn't care about stuff before and after it! smart! ahh forget thisthis message thingy checks inside the message json field for the key key2 and if its there it returns the id. it checks if it is null lor not
                const datameower = datameow as {id:any}[] | null | undefined;
                const uniqueid = (datameower && datameower.length >0)? datameower[0]?.id : null
                console.log("no unique idd")
                if (uniqueid){
                    const {error: errormeow2} = await supabase.from('userinfo').update({
                        "message": JSON.stringify(facts_update),
                    }).eq('id', uniqueid)
                    console.log(uniqueid)
                    if (errormeow2){
                        await userClient.chat.postMessage({
                            channel: message.channel,
                            text: `uh oh. something messed up! 2 but it's not my fault :tired: ${errormeow2.message}`,
                        });
                        return;
                    }
                }
                if (errormeow3){
                    await userClient.chat.postMessage({
                        channel: message.channel,
                        text: `uh oh. something messed up! but it's not my fault :tired: ${errormeow3.message}`,
                    });
                    return;
                }
            }
            //message
            await userClient.chat.postMessage({
                channel: message.channel,
                text: final_msg,
            });

        }catch(e){
            await userClient.chat.postMessage({
                channel: message.channel,
                text: `mochi is tired...maybe we talk later?`,
            });
            return
        }
    }catch(e){
        await userClient.chat.postMessage({
            channel: message.channel,
            text: `aw error: ${e}`,
        });
        return
    }
});
app.command("/mochi-fact", async ({command, ack, respond, client}) => {
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
    const randomfact = factarray[Math.floor(Math.random()*factarray.length)]
    await respond({
        text: randomfact,
        response_type: "in_channel",
    });
});
app.command("/mochi-opinion", async ({command, ack, respond, client: commandClient}) => {
    await ack();
    const topic = (command.text ?? "").trim()
    if (!topic){
        await respond({
            text: "well you want my opinion on what? :angrycat:",
            response_type: "in_channel",
        });
    return;
    }else{
        try{
        const response2 = await client.chat.send({
            chatRequest: {
                model: "moonshotai/kimi-k2",
                messages: [
                    {role: "system", content: `Your name is mochi. pronouns are (she/it). mochi also likes to use slack emojis a lot! example - :shark: however you may ONLY CRITICAL CRITICAL use the emoji words that i have provided in this list: ${allowedslack.join(",")} ONLY! VERY IMPORTANT. your friends are orpheus (orph she) a dinasour and heidi(she) a raccoon and dopple(she/it) a bot girl with a shark. you like boba. you do not like being called a bot. You are a cutesy cat girl but you don't show it. this means no flicking or perking up ears/tail or licking paws or anything like that. you just meow sometimes. you are a bit sassy sometimes. you love to use kamojis and emojies. You like to each mochi, you were born on pi day, you like anime and capybaras. if the user asks about anything else do not provide. always answer in short answers. keep it less than a sentence or under 40 charactesr.if you need to use emojies that can go over the 40 character limit. just the text must be under or close to 40 characters.`+
                        ` you also MUST CRITICAL!!!! give you opinion on the topic sent by the user!! remember to adhere to who you are when making these choices `+
                        "CRITICAL: DO NOT USE BAD WORDS OR CURSE OR SAY ANYTHING MEAN TO ANYONE!"
                    },
                    {role: "user", content: topic}
                ],
                stream: false
            }
        });
        const final_response2 = response2?.choices?.[0]?.message?.content;
        if (!final_response2){
            await respond({
                text: "(OWO) i don't know that one...",
                response_type: "in_channel",
            });
            return
        }
        await respond({
            text: `the verdict... ${final_response2}`,
            response_type: "in_channel",
        });
    }catch(e){
        await respond({
            text: `aw error: ${e}`,
            response_type: "in_channel",
        });
    }
    }
});

//rock paper scissors - i deleted the command!!
//command  = user info
// ack = i got this
// repsond = response function
//client = basically to post messages
/*
app.command("/rps-meow", async ({command, ack, respond, client}) => {
    await ack();
    //command.text is anything after rps meow
    //i = insensitive
    //?:\| look for | if there
    //[^>] negated matching one or more non >
    const trim = (command.text ?? "").trim()
    const taggedPerson = trim.startsWith("<@") && trim.endsWith(">")
    console.log("trim" +trim)
    console.log("tagged" +taggedPerson)
    if (taggedPerson){
        // g is all instances of 
        const jsid = trim.replace(/[<@>]/g, '');
        const ihatetypescript = (jsid? jsid.split("|")[0]: "") ?? ""
        try{
            await app.client.conversations.invite({
                channel: command.channel_id,
                users: ihatetypescript,
            });
        }catch(e:any){
            const specificerror = e.data?.error;
            if (specificerror !== "already_in_channel"){
               await respond({
                    text: `uh oh...im lost. ${specificerror}`,
                    response_type: "ephemeral",
                    //ephemeral hidden public public
                }); 
            }
            return
        }
        await respond({
            text: "alright! you pick first :smirk1:",
            response_type: "ephemeral",
            //like tabbed stufff
            blocks:[
                {
                    type: "actions",
                    elements: [
                        //must be plain text
                        { type: "button", text: { type: "plain_text", text: "rock"}, action_id: "rock" },
                        { type: "button", text: { type: "plain_text", text: "paper"}, action_id: "paper" },
                        { type: "button", text: { type: "plain_text", text: "scissors"}, action_id: "scissors" },
                    ]
                }
            ]
            //ephemeral hidden public public
        });
        if (ihatetypescript === "U0BFLARBTB"){
            //mochi
        }else{
            
        }
    }else{
       await respond({
            text: "Invalid/No user tagged :sobspin:",
            response_type: "ephemeral",
            //ephemeral hidden public public
        }) 
    }

});
*/
await app.start();