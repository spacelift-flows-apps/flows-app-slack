import memoizee from "memoizee";
import { callSlackApi } from "../../slackClient.ts";

interface Channel {
  id: string;
  name: string;
  is_private: boolean;
}

interface User {
  id: string;
  name: string;
  real_name: string;
}

async function fetchChannels(slackBotToken: string): Promise<Channel[]> {
  const allChannels: Channel[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page++) {
    const payload: Record<string, any> = {
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 1000,
    };

    if (cursor) {
      payload.cursor = cursor;
    }

    const responseData = await callSlackApi(
      "conversations.list",
      payload,
      slackBotToken,
      "form",
    );

    for (const channel of responseData.channels) {
      allChannels.push({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
      });
    }

    cursor = responseData.response_metadata?.next_cursor;
    if (!cursor) break;
  }

  return allChannels;
}

async function fetchUsers(slackBotToken: string): Promise<User[]> {
  const allUsers: User[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page++) {
    const payload: Record<string, any> = {
      limit: 1000,
    };

    if (cursor) {
      payload.cursor = cursor;
    }

    const responseData = await callSlackApi(
      "users.list",
      payload,
      slackBotToken,
      "form",
    );

    for (const user of responseData.members) {
      if (user.deleted || user.is_bot || user.id === "USLACKBOT") continue;
      allUsers.push({
        id: user.id,
        name: user.name,
        real_name: user.real_name || user.name,
      });
    }

    cursor = responseData.response_metadata?.next_cursor;
    if (!cursor) break;
  }

  return allUsers;
}

const getChannels = memoizee(fetchChannels, {
  maxAge: 60000,
  promise: true,
});

const getUsers = memoizee(fetchUsers, {
  maxAge: 60000,
  promise: true,
});

async function suggestChannelOnly(input: any) {
  const slackBotToken = input.app.config.slackBotToken as string | undefined;

  if (!slackBotToken) {
    return {
      suggestedValues: [],
      message: "Configure the Slack Bot Token to receive channel suggestions.",
    };
  }

  const channels = await getChannels(slackBotToken);

  let values = channels.map((channel) => ({
    label: channel.is_private
      ? `${channel.name} (private)`
      : `#${channel.name}`,
    value: channel.id,
  }));

  if (input.searchPhrase) {
    const searchLower = input.searchPhrase.toLowerCase();
    values = values.filter(
      (v) =>
        v.label.toLowerCase().includes(searchLower) ||
        v.value.toLowerCase().includes(searchLower),
    );
  }

  return { suggestedValues: values.slice(0, 50) };
}

async function suggestChannelId(input: any) {
  const slackBotToken = input.app.config.slackBotToken as string | undefined;

  if (!slackBotToken) {
    return {
      suggestedValues: [],
      message: "Configure the Slack Bot Token to receive channel suggestions.",
    };
  }

  const [channels, users] = await Promise.all([
    getChannels(slackBotToken),
    getUsers(slackBotToken),
  ]);

  let values = [
    ...channels.map((channel) => ({
      label: channel.is_private
        ? `${channel.name} (private)`
        : `#${channel.name}`,
      value: channel.id,
    })),
    ...users.map((user) => ({
      label: user.real_name,
      value: user.id,
    })),
  ];

  if (input.searchPhrase) {
    const searchLower = input.searchPhrase.toLowerCase();
    values = values.filter(
      (v) =>
        v.label.toLowerCase().includes(searchLower) ||
        v.value.toLowerCase().includes(searchLower),
    );
  }

  return { suggestedValues: values.slice(0, 50) };
}

export const channelOnlyIdConfig = {
  name: "Channel ID",
  description: "ID of the channel (e.g., C0123ABC).",
  type: "string" as const,
  required: true as const,
  suggestValues: suggestChannelOnly,
};

export const optionalChannelOnlyIdConfig = {
  name: "Channel ID",
  description: "ID of the channel (e.g., C0123ABC).",
  type: "string" as const,
  required: false as const,
  suggestValues: suggestChannelOnly,
};

export const channelOrUserIdConfig = {
  name: "Channel or User ID",
  description:
    "ID of the channel (e.g., C0123ABC), DM (D0123ABC), or user (U0123ABC).",
  type: "string" as const,
  required: true as const,
  suggestValues: suggestChannelId,
};

export const optionalChannelOrUserIdConfig = {
  name: "Channel or User ID",
  description:
    "ID of the channel (e.g., C0123ABC), DM (D0123ABC), or user (U0123ABC).",
  type: "string" as const,
  required: false as const,
  suggestValues: suggestChannelId,
};
