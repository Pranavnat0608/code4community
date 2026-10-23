export const JOIN_POLICY_OPEN = "open";
export const JOIN_POLICY_APPROVAL = "approval";

/** @param {unknown} raw */
export function normalizeJoinPolicy(raw) {
  return raw === JOIN_POLICY_APPROVAL ? JOIN_POLICY_APPROVAL : JOIN_POLICY_OPEN;
}

/** @param {unknown} policy */
export function clubRequiresJoinApproval(policy) {
  return normalizeJoinPolicy(policy) === JOIN_POLICY_APPROVAL;
}
