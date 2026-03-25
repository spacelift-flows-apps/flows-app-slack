import { AppBlock, events } from "@slflows/sdk/v1";

export const eventSubscription: AppBlock = {
  name: "Event Subscription",
  description:
    "Subscribes to all Slack events received by this app, with optional filtering by event type.",
  category: "Events",
  config: {
    eventType: {
      name: "Event Type",
      description:
        'If specified, only events of this type will be emitted (e.g., "app_mention", "message", "reaction_added"). Leave empty to receive all events.',
      type: "string",
      required: false,
    },
  },
  async onInternalMessage({ block, message }) {
    const slackEvent = message.body;
    if (!slackEvent) return;

    const configuredEventType = block.config.eventType as string | undefined;
    if (configuredEventType && slackEvent.type !== configuredEventType) {
      return;
    }

    await events.emit(slackEvent);
  },
  outputs: {
    default: {
      name: "On Event",
      description:
        "Emitted when a Slack event is received. The shape depends on the event type.",
      type: {
        type: "object",
        additionalProperties: true,
        properties: {
          type: {
            type: "string",
            description: "The Slack event type.",
          },
        },
        required: ["type"],
      },
    },
  },
};
