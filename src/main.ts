import { App, LogLevel } from '@slack/bolt';

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.DEBUG,
});

const OWNER_CHANNEL_ID='CQZPD378S'

app.event('app_home_opened', ({ event }) => {
  console.log('app_home_opened', event);
});

// Listen to any messaging event except bot itself
app.event('message', async ({ event, context }) => {
  console.log('message.channels', {event, context});
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: event.text || '',
  });
});
app.event('channel_archive', async ({ event, context }) => {
  console.log('channel_archive', {event, context});
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が閉まったようだのぉ`,
  });
});
app.event('channel_unarchive', async ({ event, context }) => {
  console.log('channel_unarchive', {event, context});
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が開いたようだのぉ`,
  });
});
app.event('channel_created', ({ event }) => {
  console.log('channel_created', event);
});
app.event('channel_deleted', ({ event }) => {
  console.log('channel_deleted', event);
});
app.event('channel_left', ({ event }) => {
  console.log('channel_left', event);
});
app.event('channel_rename', async ({ event, context }) => {
  console.log('channel_rename', {event, context});
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `どこかで名が *${event.channel.name}* になったチャンネルがおるのぉ`,
  });
});
app.event('channel_shared', ({ event }) => {
  console.log('channel_shared', event);
});
app.event('channel_unshared', ({ event }) => {
  console.log('channel_unshared', event);
});

app.error((error) => {
  console.log(error);
});

(async (): Promise<void> => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
