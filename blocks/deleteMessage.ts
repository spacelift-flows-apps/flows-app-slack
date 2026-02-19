import {
  slackChannelIdSchema,
  slackMessageTimestampSchema,
} from "../jsonschema/jsonschema.ts";

import { AppBlock, events } from "@slflows/sdk/v1";

import { callSlackApi } from "../slackClient.ts";
import { channelIdConfig } from "./utils/channelId.ts";

export default {
  name: "Delete Message",
  description:
    "Deletes a message from a Slack channel using its channel ID and timestamp.",
  category: "Messaging",
  inputs: {
    default: {
      name: "Delete",
      description: "Trigger deletion of the specified message.",
      config: {
        channelId: channelIdConfig,
        ts: {
          name: "Message Timestamp",
          description: "The timestamp (ts) of the message to delete.",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { slackBotToken } = input.app.config;
        const { channelId, ts } = input.event.inputConfig;

        if (!slackBotToken) {
          throw new Error(
            "Slack Bot Token not configured in the app. Cannot delete message.",
          );
        }

        const slackApiPayload = {
          channel: channelId,
          ts: ts,
        };

        const responseData = await callSlackApi(
          "chat.delete",
          slackApiPayload,
          slackBotToken,
        );

        await events.emit({
          channel: responseData.channel,
          ts: responseData.ts,
        });
      },
    },
  },
  outputs: {
    default: {
      name: "Message Deleted",
      description: "Emitted when the message has been successfully deleted.",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          channel: slackChannelIdSchema,
          ts: slackMessageTimestampSchema,
        },
        required: ["channel", "ts"],
      },
    },
  },
} satisfies AppBlock;
