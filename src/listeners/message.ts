import { Message } from './interface';
import { App } from '@slack/bolt';
import { Config } from '../interfaces';
import { User } from '../interfaces/slack';

const users = new Map<string, User>();
export const message = (app: App, config: Config): Message =>
  async ({ event, context }): Promise<void> => {
    const { ignore_subtypes } = config;

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
  };