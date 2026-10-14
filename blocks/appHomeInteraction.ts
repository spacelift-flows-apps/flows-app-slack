export function isAppHomeBlockAction(payload: any): boolean {
  return (
    payload?.type === "block_actions" &&
    payload?.container?.type === "view" &&
    payload?.view?.type === "home" &&
    typeof payload?.trigger_id === "string" &&
    payload.trigger_id.length > 0
  );
}

export function appHomeActionIds(payload: any): string[] {
  if (!Array.isArray(payload?.actions)) return [];

  return payload.actions
    .map((action: any) => action?.action_id)
    .filter((actionId: unknown): actionId is string =>
      Boolean(actionId && typeof actionId === "string"),
    );
}

export function matchesActionIdPrefix(
  payload: any,
  actionIdPrefix: string,
): boolean {
  if (!actionIdPrefix) return false;
  return appHomeActionIds(payload).some((actionId) =>
    actionId.startsWith(actionIdPrefix),
  );
}
