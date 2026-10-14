import { AppBlock, blocks, events, messaging } from "@slflows/sdk/v1";

import {
  appHomeActionIds,
  isAppHomeBlockAction,
  matchesActionIdPrefix,
} from "./appHomeInteraction.ts";
import {
  slackAppIdSchema,
  slackTeamIdSchema,
  slackUserIdSchema,
} from "../jsonschema/jsonschema.ts";

export async function handleAppHomeInteractionSubscriptions(payload: any) {
  if (!isAppHomeBlockAction(payload)) return false;

  const subscriptionBlocks = await blocks.list({
    typeIds: ["appHomeInteractionSubscription"],
  });
  const relevantBlocks = subscriptionBlocks.blocks.filter((block) =>
    matchesActionIdPrefix(payload, block.config.actionIdPrefix as string),
  );

  if (relevantBlocks.length > 0) {
    console.log(
      `Routing App Home interaction to ${relevantBlocks.length} subscription block(s).`,
    );
    await messaging.sendToBlocks({
      blockIds: relevantBlocks.map((block) => block.id),
      body: payload,
    });
  } else {
    console.log(
      `No App Home subscription matched action IDs: ${appHomeActionIds(payload).join(", ")}`,
    );
  }

  return true;
}

export const appHomeInteractionSubscription: AppBlock = {
  name: "App Home Interaction Subscription",
  entrypoint: true,
  description:
    "Subscribes to button clicks and other block actions from this Slack app's Home tab.",
  category: "Views",
  config: {
    actionIdPrefix: {
      name: "Action ID Prefix",
      description:
        "Only Home actions whose action_id starts with this value are emitted.",
      type: "string",
      required: true,
    },
  },
  async onInternalMessage({ block, message }) {
    const payload = message.body;
    const actionIdPrefix = block.config.actionIdPrefix as string;

    if (
      !isAppHomeBlockAction(payload) ||
      !matchesActionIdPrefix(payload, actionIdPrefix)
    ) {
      console.warn(
        "App Home Interaction Subscription received an unexpected interaction.",
      );
      return;
    }

    await events.emit(payload);
  },
  outputs: {
    default: {
      name: "On App Home Interaction",
      description:
        "Emitted when a user interacts with a matching element on the app Home tab.",
      type: {
        type: "object",
        additionalProperties: true,
        properties: {
          type: { type: "string", enum: ["block_actions"] },
          api_app_id: slackAppIdSchema,
          trigger_id: {
            type: "string",
            description:
              "A temporary token that can be used to open a modal view.",
          },
          user: {
            type: "object",
            properties: {
              id: slackUserIdSchema,
              username: { type: "string" },
              name: { type: "string" },
              team_id: slackTeamIdSchema,
            },
            required: ["id"],
          },
          team: {
            type: "object",
            properties: {
              id: slackTeamIdSchema,
              domain: { type: "string" },
            },
            required: ["id"],
          },
          container: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["view"] },
              view_id: { type: "string" },
            },
            required: ["type", "view_id"],
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
              properties: {
                action_id: { type: "string" },
                block_id: { type: "string" },
                type: { type: "string" },
                value: { type: "string" },
                action_ts: { type: "string" },
              },
              required: ["action_id", "type"],
            },
          },
          view: {
            type: "object",
            additionalProperties: true,
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["home"] },
              private_metadata: { type: "string" },
              hash: { type: "string" },
            },
            required: ["id", "type"],
          },
        },
        required: [
          "type",
          "api_app_id",
          "trigger_id",
          "user",
          "team",
          "container",
          "actions",
          "view",
        ],
      },
    },
  },
};
