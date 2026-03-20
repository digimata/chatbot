CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" varchar(64) NOT NULL,
  "password" text,
  "name" text,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "isAnonymous" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "users"("id"),
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp,
  "updatedAt" timestamp
);

CREATE TABLE IF NOT EXISTS "chats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" timestamp NOT NULL,
  "title" text NOT NULL,
  "userId" text NOT NULL REFERENCES "users"("id"),
  "visibility" varchar NOT NULL DEFAULT 'private'
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" uuid NOT NULL REFERENCES "chats"("id"),
  "role" varchar NOT NULL,
  "parts" json NOT NULL,
  "attachments" json NOT NULL,
  "createdAt" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "votes" (
  "chatId" uuid NOT NULL REFERENCES "chats"("id"),
  "messageId" uuid NOT NULL REFERENCES "messages"("id"),
  "isUpvoted" boolean NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" timestamp NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "text" varchar NOT NULL DEFAULT 'text',
  "userId" text NOT NULL REFERENCES "users"("id"),
  PRIMARY KEY ("id", "createdAt")
);

CREATE TABLE IF NOT EXISTS "suggestions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "documentId" uuid NOT NULL,
  "documentCreatedAt" timestamp NOT NULL,
  "originalText" text NOT NULL,
  "suggestedText" text NOT NULL,
  "description" text,
  "isResolved" boolean NOT NULL DEFAULT false,
  "userId" text NOT NULL REFERENCES "users"("id"),
  "createdAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "documents"("id", "createdAt")
);

CREATE TABLE IF NOT EXISTS "streams" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "chatId" uuid NOT NULL,
  "createdAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("chatId") REFERENCES "chats"("id")
);
