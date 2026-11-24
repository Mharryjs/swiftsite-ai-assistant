import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 128 }),
  avatarUrl: text("avatar_url"),
  isOwner: boolean("is_owner").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  dailyLimit: integer("daily_limit").notNull().default(100),
  imageApiKey: text("image_api_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const sessions = pgTable("sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userAgent: text("user_agent"),
});

export const loginEvents = pgTable("login_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  method: varchar("method", { length: 24 }).notNull(),
  ip: varchar("ip", { length: 96 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 24 }).notNull().default("auto"),
  defaultMode: varchar("default_mode", { length: 32 }).notNull().default("assistant"),
  imageStyle: varchar("image_style", { length: 32 }).notNull().default("cinematic"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: varchar("workspace_id", { length: 96 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 180 }).notNull(),
  mode: varchar("mode", { length: 32 }).notNull().default("assistant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("conversations_user_idx").on(table.userId)]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  provider: varchar("provider", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("messages_conversation_idx").on(table.conversationId)]);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: varchar("workspace_id", { length: 96 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 240 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  bytes: text("bytes").notNull(),
  fileName: varchar("file_name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("attachments_workspace_idx").on(table.workspaceId)]);

export const aiRequests = pgTable("ai_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: varchar("workspace_id", { length: 96 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 100 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("ai_requests_workspace_idx").on(table.workspaceId)]);

export const adminAudit = pgTable("admin_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 80 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const generations = pgTable("generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("done"),
  progress: varchar("progress", { length: 160 }),
  error: text("error"),
  prompt: text("prompt").notNull(),
  source: varchar("source", { length: 48 }).notNull(),
  mime: varchar("mime", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 120 }),
  inputFile: varchar("input_file", { length: 120 }),
  html: text("html"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("generations_user_idx").on(table.userId)]);

export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Generation = typeof generations.$inferSelect;
