import { AppBlock, events } from "@slflows/sdk/v1";
import { callSlackApi } from "../slackClient.ts";

export const httpRequest: AppBlock = {
  name: "HTTP Request",
  description:
    "Make an authenticated request to any Slack API method.",
  category: "Request",
  inputs: {
    default: {
      name: "Send Request",
      description: "Trigger the API request.",
      config: {
        method: {
          name: "API Method",
          description:
            'The Slack API method to call (e.g., "conversations.list", "users.info").',
          type: "string",
          required: true,
        },
        payload: {
          name: "Payload",
          description: "The request payload as key-value pairs.",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { slackBotToken } = input.app.config;

        if (!slackBotToken) {
          throw new Error(
            "Slack Bot Token not configured in the app. Cannot make request.",
          );
        }

        const method = input.event.inputConfig.method as string;
        const payload = (input.event.inputConfig.payload as Record<string, any>) ?? {};

        const responseData = await callSlackApi(
          method,
          payload,
          slackBotToken,
        );

        await events.emit(responseData);
      },
    },
  },
  outputs: {
    default: {
      name: "Response",
      description:
        "The Slack API response. Shape depends on the API method called.",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};
