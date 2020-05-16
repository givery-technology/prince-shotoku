import { App, LogLevel } from '@slack/bolt';
import { WebAPICallResult } from '@slack/web-api'

interface Profile {
  real_name: string
  display_name: string
  avatar_hash: string
  image_24: string
  image_32: string
  image_48: string
  image_72: string
  image_192: string
  image_512: string
  image_1024?: string
}
interface User {
  id: string
  team_id: string
  name: string
  deleted: boolean
  color: string
  real_name: string
  profile: Profile
  is_admin: boolean
  is_owner: boolean
  is_bot: boolean
  is_app_user: boolean
}
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

const conversations = new Map<string, Conversation>();
const users = new Map<string, User>();

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

  if (ignore_subtypes.includes(event.subtype)) { return; }
  if (event.bot_id) { return; } // Skip messages by bots
  console.log('message.channels', { event, context });
  const user = users.get(event.user);
  if (!user) {
    throw new Error(`No such user: ${event.user}`);
  }
  // Replace specialized text to not make mention text
  const text = (event.text ?? '').replace(/<@(.*?)>/g, (_, uid) => {
    const target = users.get(uid) ?? ({ name: 'unknown' } as User);
    return `@${target.profile?.display_name || target.name}`;
  });
  const inThread = event.thread_ts ? 'in thread' : '';
  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: text,
      verbatim: true, // Required to skip mentioning
    },
  }, {
    type: 'context',
    elements: [{
      type: 'mrkdwn',
      text: `${inThread} at <#${event.channel}>`,
    }],
  }];
  await app.client.chat.postMessage({
    blocks,
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
    text: event.text || '',
    username: user.name,
    icon_url: user.profile?.image_512,
  });
});

app.event('channel_archive', async ({ event, context }) => {
  console.log('channel_archive', { event, context });
  if (event.channel === OWNER_CHANNEL_ID) {
    // Not sure the reason, but this logic fails with an error `not_in_channel`
    await app.client.conversations.unarchive({
      token: context.botToken,
      channel: event.channel,
    }).catch((error) => {
      console.log('unarchive', error.code, error.data.error);
    });
    await app.client.conversations.join({
      token: context.botToken,
      channel: event.channel,
    }).catch((error) => {
      console.log('join', error.code, error.data.error);
    });
  }
  const conv = conversations.get(event.channel);
  if (!conv) { throw new Error(`Unknown channel: ${event.channel}`); }
  const text = `<#${event.channel}> が閉まったようだのぉ`;
  await app.client.chat.postMessage({
    text,
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
  });
});
app.event('channel_unarchive', async ({ event, context }) => {
  console.log('channel_unarchive', { event, context });
  const conv = conversations.get(event.channel);
  if (!conv) { throw new Error(`Unknown channel: ${event.channel}`); }
  const text = `<#${event.channel}> が開いたようだのぉ`;
  await app.client.chat.postMessage({
    text,
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
  });
});
app.event('channel_created', async ({ event, context }) => {
  console.log('channel_created', event);
  const text = `<#${event.channel.id}> が新しくできたようだのぉ`;
  await app.client.chat.postMessage({
    text,
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
  });
  if (event.channel.name.includes('takayukioda')) {
    await app.client.conversations.join({
      token: context.botToken,
      channel: event.channel.id,
    });
  }
});
app.event('channel_deleted', async ({ event, context }) => {
  console.log('channel_deleted', { event, context });
  const conv = conversations.get(event.channel);
  if (!conv) { throw new Error(`Unknown channel: ${event.channel}`); }
  const text = 'どこかでチャンネルが消えたようだのぉ';
  await app.client.chat.postMessage({
    text,
    token: context.botToken,
    channel: OWNER_CHANNEL_ID,
  });
});
app.event('channel_left', async ({ event, context }) => {
  console.log('channel_left', { event, context });
  // If bot left by its choice, let it be.
  if (event.actor_id === context.botUserId) { return; }
  await app.client.conversations.join({
    token: process.env.SLACK_BOT_TOKEN,
    channel: event.channel,
  }).catch((error) => {
    // It will fail this left event happened by channel archive
    console.log(error.code, error.data.error);
  });
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
  const conv_opts = {
    token: process.env.SLACK_BOT_TOKEN,
    exclude_archived: false,
    limit: 100,
  };

  // Interface for `page`: https://api.slack.com/methods/conversations.list#response
  for await (const page of app.client.paginate('conversations.list', conv_opts) as AsyncIterableIterator<WebAPICallResult>) {
    if (!page.ok) {
      throw new Error(`conversations.list was not ok for some reason: ${page.response_metadata}`);
    }
    const channels = page.channels as Conversation[];
    channels.reduce((c, conv) => {
      c.set(conv.id, conv);
      return c;
    }, conversations);
  }

  const newJoins = Array.from(conversations.values())
    .filter(conv => !conv.is_member && conv.is_channel && !conv.is_archived && !conv.is_shared)
    .map(conv => {
      if (conv.name.startsWith('rss-') || conv.name.includes('takayukioda')) {
        return app.client.conversations.join({
          token: process.env.SLACK_BOT_TOKEN,
          channel: conv.id,
        });
      }
    });

  const user_opts = {
    token: process.env.SLACK_BOT_TOKEN,
    limit: 100,
  };

  for await (const page of app.client.paginate('users.list', user_opts) as AsyncIterableIterator<WebAPICallResult>) {
    if (!page.ok) {
      throw new Error(`conversations.list was not ok for some reason: ${page.response_metadata}`);
    }
    const members = page.members as User[];
    members.reduce((m, member) => {
      m.set(member.id, member);
      return m;
    }, users);
  }

  await Promise.all(newJoins);
  console.log('⚡️ Bolt app is running!');
})();
