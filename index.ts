import { App } from "@slack/bolt";

const app = new App({
    token: process.env.SLACK_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// define the logic for our app
app.message(async (event) =>{
    {/* bascially a subtype is a special message like a join - only look at normal messges hv no subtype*/}
    if (event.payload.subtype) return;
    {/* === is typesafe*/}
    if (event.payload.user !== 'U06SQJ508LF' ) return;
   await app.client.chat.postMessage({
        channel: event.payload.channel,
        text: "meooww",
   });
});
await app.start();