import { App } from "@slack/bolt";
import { OpenRouter } from "@openrouter/sdk";
const client = new OpenRouter ({
    apiKey: process.env.API_KEY,
    serverURL: "https://ai.hackclub.com/proxy/v1",
});
const app = new App({
    token: process.env.SLACK_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// define the logic for our app
app.message(async (event) =>{
    console.log("uh hello")
    {/* bascially a subtype is a special message like a join - only look at normal messges hv no subtype*/}
    if (event.payload.subtype) return;
    {/* === is typesafe*/}
    if (event.payload.user !== 'U0AARL70NG5' ) return;
    console.log("right user")
    const userPrompt = event.payload.text;
    if (!userPrompt) return;
    console.log("prompt there")
    try{
        const response = await client.chat.send({
            chatRequest: {
                model: "moonshotai/kimi-k2",
                messages: [
                    {role: "system", content: "you are a cat girl (she/it) that loves mochi and is very cute. respond with short messages that are less than 1 sentence long. your name is mochi and you like to use cute kaomojis in your text too!"},
                    {role: "user", content: userPrompt}
                ],
                stream: false
            }
        });
        const final_response = response?.choices?.[0]?.message?.content;
        if (!final_response){
            await app.client.chat.postMessage({
                channel: event.payload.channel,
                text: `(OWO) i don't know that one...`,
            });
            return
        }
        await app.client.chat.postMessage({
            channel: event.payload.channel,
            text: final_response,
        });
    }catch(e){
        await app.client.chat.postMessage({
            channel: event.payload.channel,
            text: `aw error: ${e}`,
        });
    }
});


await app.start();
console.log("HELLOO")