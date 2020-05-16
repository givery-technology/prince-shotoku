import { Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';

type SlackEventListener<EventType extends string>
  = Middleware<SlackEventMiddlewareArgs<EventType>>;

export type AppHomeOpened = SlackEventListener<'app_home_opened'>;
export type Message = SlackEventListener<'message'>;
