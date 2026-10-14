import assert from "node:assert/strict";
import test from "node:test";

import {
  appHomeActionIds,
  isAppHomeBlockAction,
  matchesActionIdPrefix,
} from "../blocks/appHomeInteraction.ts";

const homePayload = {
  type: "block_actions",
  trigger_id: "123.456.abcdef",
  container: { type: "view", view_id: "V123" },
  view: { id: "V123", type: "home" },
  actions: [
    { type: "button", action_id: "pam_access_request", value: "service-a" },
  ],
};

test("recognizes App Home block actions", () => {
  assert.equal(isAppHomeBlockAction(homePayload), true);
  assert.deepEqual(appHomeActionIds(homePayload), ["pam_access_request"]);
});

test("rejects message and modal block actions", () => {
  assert.equal(
    isAppHomeBlockAction({
      ...homePayload,
      container: { type: "message", message_ts: "1.2" },
    }),
    false,
  );
  assert.equal(
    isAppHomeBlockAction({ ...homePayload, view: { type: "modal" } }),
    false,
  );
});

test("filters actions by prefix", () => {
  assert.equal(matchesActionIdPrefix(homePayload, "pam_access_"), true);
  assert.equal(matchesActionIdPrefix(homePayload, "sandbox_"), false);
  assert.equal(matchesActionIdPrefix(homePayload, ""), false);
});

test("ignores malformed action IDs", () => {
  const payload = {
    ...homePayload,
    actions: [{ type: "button" }, { action_id: 42 }, null],
  };

  assert.deepEqual(appHomeActionIds(payload), []);
  assert.equal(matchesActionIdPrefix(payload, "pam_access_"), false);
});

test("requires a trigger ID", () => {
  const payload = { ...homePayload, trigger_id: "" };

  assert.equal(isAppHomeBlockAction(payload), false);
});
