import { App, LogLevel } from '@slack/bolt';

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.INFO,
});

const OWNER_CHANNEL_ID=process.env.OWNER_CHANNEL_ID

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
app.event('channel_deleted', async ({ event, context }) => {
  console.log('channel_deleted', event);
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が消えたようだのぉ`,
  });
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
app.event('channel_shared', async ({ event, context }) => {
  console.log('channel_shared', event);
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> がどこかのチームと共有されたようだのぉ`,
  });
});
app.event('channel_unshared', async ({ event, context }) => {
  console.log('channel_unshared', event);
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が他チームとの共有をとめたようだのぉ`,
  });
});

app.error((error) => {
  console.log(error);
});

(async (): Promise<void> => {
  await app.start(process.env.PORT || 3000);
  const conversations = []
  const options = {
    token: process.env.SLACK_BOT_TOKEN,
    exclude_archived: true,
    limit: 100,
  }
  for await (const page of app.client.paginate('conversations.list', options)) {
    conversations.push(...page.channels)
  }
  console.log('⚡️ Bolt app is running!');
})();
