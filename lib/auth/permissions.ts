// lib/auth/permissions.ts
// Define all resources, actions, and roles for the platform.
// This is the single source of truth for what each role can do.

import { createAccessControl } from "better-auth/plugins/access";

// ── Resource → Action map ─────────────────────────────────────────────────────
// Every resource your platform has, and every action that can be performed on it.

export const statement = {
  // Platform admin actions
  platform: ["viewStats", "manageFees", "viewAllCreators", "viewAllUsers"],

  // Creator management (admin + agency)
  creator:  ["view", "create", "update", "suspend", "ban", "verify", "delete"],

  // User management (admin only)
  user:     ["view", "create", "ban", "delete", "impersonate", "setRole"],

  // Content moderation (admin only)
  report:   ["view", "resolve", "dismiss", "removeContent"],

  // Payout management
  payout:   ["view", "initiate", "approve", "cancel"],

  // Creator's own content
  post:     ["create", "update", "delete", "publish", "schedule"],

  // Subscriber management (creator)
  subscriber: ["view", "message", "refund", "block"],

  // Earnings / analytics
  earnings: ["view", "export"],

  // Agency-specific
  agency:   ["view", "update", "inviteCreator", "removeCreator", "viewCommissions"],

  // Fan / user actions
  feed:        ["view"],
  subscription:["create", "cancel", "upgrade"],
  tip:         ["send"],
  ppv:         ["unlock"],
} as const;

export const ac = createAccessControl(statement);

// ── Role definitions ──────────────────────────────────────────────────────────

/** Platform admin — full access to everything */
export const adminRole = ac.newRole({
  platform:     ["viewStats", "manageFees", "viewAllCreators", "viewAllUsers"],
  creator:      ["view", "create", "update", "suspend", "ban", "verify", "delete"],
  user:         ["view", "create", "ban", "delete", "impersonate", "setRole"],
  report:       ["view", "resolve", "dismiss", "removeContent"],
  payout:       ["view", "initiate", "approve", "cancel"],
  post:         ["create", "update", "delete", "publish", "schedule"],
  subscriber:   ["view", "message", "refund", "block"],
  earnings:     ["view", "export"],
  agency:       ["view", "update", "inviteCreator", "removeCreator", "viewCommissions"],
  feed:         ["view"],
  subscription: ["create", "cancel", "upgrade"],
  tip:          ["send"],
  ppv:          ["unlock"],
});

/** Agency manager — manages their creator roster, views commissions */
export const agencyRole = ac.newRole({
  creator:    ["view", "create", "update"],          // only their own roster
  post:       ["update"],                             // suggest edits
  subscriber: ["view"],
  earnings:   ["view", "export"],
  agency:     ["view", "update", "inviteCreator", "removeCreator", "viewCommissions"],
  payout:     ["view"],
  report:     ["view"],
});

/** Content creator — manages their own content and subscribers */
export const creatorRole = ac.newRole({
  post:         ["create", "update", "delete", "publish", "schedule"],
  subscriber:   ["view", "message", "refund", "block"],
  earnings:     ["view", "export"],
  payout:       ["view"],
  feed:         ["view"],
  tip:          ["send"],
});

/** Regular fan / subscriber */
export const userRole = ac.newRole({
  feed:         ["view"],
  subscription: ["create", "cancel", "upgrade"],
  tip:          ["send"],
  ppv:          ["unlock"],
});