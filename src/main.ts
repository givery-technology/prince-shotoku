import { App, LogLevel } from '@slack/bolt';
import { WebAPICallResult } from '@slack/web-api';
import { Config } from './interfaces';
import { Conversation, User } from './interfaces/slack';
import { app_home_opened } from './listeners';
import { channel_msg } from './resources/messages';

const config: Config = {
  owner_channel_id: process.env.OWNER_CHANNEL_ID || '',
  ignore_subtypes:  [
    'channel_join',
    'channel_left',
    'channel_leave',
    'message_changed',
    'message_deleted',
  ],
};

if (config.owner_channel_id === '') {
  throw new Error('Must specify owner channel id to run this app');
}

const conversations = new Map<string, Conversation>();
const users = new Map<string, User>();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.INFO,
});

app.error(async (error) => {
  console.error(error);
});

app.event('app_home_opened', app_home_opened(app, config));

// Listen to any messaging event except bot itself
app.event('message', async ({ event, context }) => {
  const {ignore_subtypes} = config;

  if (ignore_subtypes.includes(event.subtype)) { return; }
  if (event.bot_id) { return; } // Skip messages by bots
  if (event.channel === config.owner_channel_id) { return; }

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
    channel: config.owner_channel_id,
    text: event.text || '',
    username: user.name,
    icon_url: user.profile?.image_512,
  });
});

app.event('channel_archive', async ({ event, context }) => {
  console.log('channel_archive', { event, context });
  if (event.channel === config.owner_channel_id) {
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
  await app.client.chat.postMessage({
    channel: config.owner_channel_id,
    text: channel_msg.archived(event.channel),
    token: context.botToken,
  });
});
app.event('channel_unarchive', async ({ event, context }) => {
  console.log('channel_unarchive', { event, context });
  const conv = conversations.get(event.channel);
  if (!conv) { throw new Error(`Unknown channel: ${event.channel}`); }
  await app.client.chat.postMessage({
    channel: config.owner_channel_id,
    text: channel_msg.unarchived(event.channel),
    token: context.botToken,
  });
});
app.event('channel_created', async ({ event, context }) => {
  console.log('channel_created', event);
  await app.client.chat.postMessage({
    channel: config.owner_channel_id,
    text: channel_msg.created(event.channel.id),
    token: context.botToken,
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
  await app.client.chat.postMessage({
    channel: config.owner_channel_id,
    text: channel_msg.deleted,
    token: context.botToken,
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
    channel: config.owner_channel_id,
    text: channel_msg.renamed(event.channel.name),
    token: context.botToken,
  });
});
app.event('channel_shared', async ({ event, context }) => {
  console.log('channel_shared', event);
  await app.client.chat.postMessage({
    channel: config.owner_channel_id,
    text: channel_msg.shared(event.channel),
    token: context.botToken,
  });
});
app.event('channel_unshared', async ({ event, context }) => {
  console.log('channel_unshared', event);
  await app.client.chat.postMessage({
    channel: config.owner_channel_id,
    text: channel_msg.unshared(event.channel),
    token: context.botToken,
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
      throw new Error(`users.list was not ok for some reason: ${page.response_metadata}`);
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
