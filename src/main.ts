import { App, LogLevel } from '@slack/bolt';
import { WebAPICallResult } from '@slack/web-api'

interface Conversation {
  id: string
  name: string
  name_normalized: string
  is_channel: boolean
  is_group: boolean
  is_im: boolean
  is_archived: boolean
  is_shared: boolean
  is_member: boolean
  is_private: boolean
  is_mpim: boolean
}

const OWNER_CHANNEL_ID = process.env.OWNER_CHANNEL_ID || ''
const ignore_subtypes = [
  'channel_join',
  'channel_left',
  'message_deleted',
]

const conversations = []
// const users = new Map<string, object>()

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.INFO,
});

app.error((error) => {
  console.error(error);
});

app.event('app_home_opened', ({ event }) => {
  console.log('app_home_opened', event);
});

// Listen to any messaging event except bot itself
app.event('message', async ({ event, context }) => {

  if (ignore_subtypes.includes(event.subtype)) {return; }
  if (event.bot_id) { return; } // Skip messages by bots
  console.log('message.channels', { event, context });
  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: event.text || '',
    },
  }, {
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: `by <@${event.user}> in <#${event.channel}>`,
    }],
  }];
  await app.client.chat.postMessage({
    blocks,
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: event.text || '',
    username: event.user,
  });
});
app.event('channel_archive', async ({ event, context }) => {
  console.log('channel_archive', { event, context });
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が閉まったようだのぉ`,
  });
});
app.event('channel_unarchive', async ({ event, context }) => {
  console.log('channel_unarchive', { event, context });
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が開いたようだのぉ`,
  });
});
app.event('channel_created', async ({ event, context }) => {
  console.log('channel_created', event);
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: `<#${event.channel}> が新しくできたようだのぉ`,
  });
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
  console.log('channel_rename', { event, context });
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

(async (): Promise<void> => {
  await app.start(process.env.PORT || 3000);
  const options = {
    token: process.env.SLACK_BOT_TOKEN,
    exclude_archived: true,
    limit: 100,
  }

  // Interface for `page`: https://api.slack.com/methods/conversations.list#response
  for await (const page of app.client.paginate('conversations.list', options) as AsyncIterableIterator<WebAPICallResult>) {
    if (!page.ok) {
      throw new Error(`conversations.list was not ok for some reason: ${page.response_metadata}`)
    }
    const channels = page.channels as Conversation[]
    conversations.push(...channels)
  }
  const newJoins = conversations
    .filter(conv => !conv.is_member && conv.is_channel && !conv.is_archived && !conv.is_shared)
    .map(conv => {
      if (conv.name.startsWith('rss-')) {
        console.log(conv)
        return app.client.conversations.join({
          token: process.env.SLACK_BOT_TOKEN,
          channel: conv.id,
        })
      }
    })

  await Promise.all(newJoins)
  console.log('⚡️ Bolt app is running!');
})();
