import { createServerSupabaseClient } from "@/lib/supabase/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_CREATE_DRAFT_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

type StoredGmailConnection = {
  id: string;
  doctor_user_id: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
};

type GmailDraftResult = {
  draftId: string;
  messageId: string | null;
};

type GmailDraftAttachment = {
  filename: string;
  contentType: string;
  data: Buffer;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function serializeEmailMessage(
  recipientEmail: string | undefined,
  subject: string,
  body: string,
  attachments: GmailDraftAttachment[] = []
) {
  const normalizedSubject = subject.trim();
  const normalizedBody = body.replace(/\r\n/g, "\n").trim();
  const normalizedRecipientEmail = recipientEmail?.trim();

  if (attachments.length === 0) {
    return [
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      ...(normalizedRecipientEmail ? [`To: ${normalizedRecipientEmail}`] : []),
      `Subject: ${normalizedSubject}`,
      "",
      normalizedBody
    ].join("\r\n");
  }

  const boundary = `medmatch-${crypto.randomUUID()}`;
  const parts = [
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ...(normalizedRecipientEmail ? [`To: ${normalizedRecipientEmail}`] : []),
    `Subject: ${normalizedSubject}`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    normalizedBody
  ];

  for (const attachment of attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      attachment.data.toString("base64").replace(/(.{76})/g, "$1\r\n").trim()
    );
  }

  parts.push(`--${boundary}--`);
  return parts.join("\r\n");
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

function safeSerialize(value: unknown) {
  if (value == null) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function logGmailDraftError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (error instanceof Error) {
    const candidate = error as Error & {
      status?: number;
      code?: string | number;
      providerMessage?: string;
      details?: unknown;
      response?: unknown;
      body?: unknown;
      cause?: {
        status?: number;
        code?: string | number;
        message?: string;
        providerMessage?: string;
        details?: unknown;
        response?: unknown;
        body?: unknown;
      };
    };

    console.error("[gmail-draft] creation failed");
    console.error("message:", candidate.message);
    console.error("status:", candidate.status ?? candidate.cause?.status ?? null);
    console.error("code:", candidate.code ?? candidate.cause?.code ?? null);
    console.error(
      "providerMessage:",
      candidate.providerMessage ?? candidate.cause?.providerMessage ?? null
    );
    console.error("details:", safeSerialize(candidate.details ?? candidate.cause?.details));
    console.error("response:", safeSerialize(candidate.response ?? candidate.cause?.response));
    console.error("body:", safeSerialize(candidate.body ?? candidate.cause?.body));
    console.error("causeMessage:", candidate.cause?.message ?? null);
    console.error("stack:", candidate.stack ?? null);
    return;
  }

  console.error("[gmail-draft] creation failed");
  console.error("message:", safeSerialize(error));
}

async function refreshAccessToken(connection: StoredGmailConnection) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || !connection.refresh_token) {
    return connection;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token"
    }).toString()
  });

  const tokenJson = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !tokenJson.access_token) {
    const error = new Error("Gmail access token refresh failed.") as Error & {
      status?: number;
      code?: string | number;
      providerMessage?: string;
      body?: unknown;
    };
    error.status = response.status;
    error.code = tokenJson.error ?? response.status;
    error.providerMessage = tokenJson.error_description ?? tokenJson.error;
    error.body = tokenJson;
    throw error;
  }

  const nextConnection: StoredGmailConnection = {
    ...connection,
    access_token: tokenJson.access_token,
    token_type: tokenJson.token_type ?? connection.token_type,
    scope: tokenJson.scope ?? connection.scope,
    expires_at:
      typeof tokenJson.expires_in === "number"
        ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
        : connection.expires_at
  };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("doctor_gmail_connections")
    .update({
      access_token: nextConnection.access_token,
      token_type: nextConnection.token_type,
      scope: nextConnection.scope,
      expires_at: nextConnection.expires_at
    })
    .eq("id", connection.id)
    .eq("doctor_user_id", connection.doctor_user_id);

  if (error) {
    const persistError = new Error(error.message || "Unable to persist refreshed Gmail token.");
    throw persistError;
  }

  return nextConnection;
}

async function getUsableConnection(doctorUserId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: connection, error } = await supabase
    .from("doctor_gmail_connections")
    .select("id, doctor_user_id, access_token, refresh_token, token_type, scope, expires_at")
    .eq("doctor_user_id", doctorUserId)
    .maybeSingle<StoredGmailConnection>();

  if (error) {
    throw new Error(error.message || "Die Gmail-Verbindung konnte nicht geladen werden.");
  }

  if (!connection) {
    return null;
  }

  if (isExpired(connection.expires_at) && connection.refresh_token) {
    return refreshAccessToken(connection);
  }

  return connection;
}

export async function createDoctorGmailDraft(args: {
  doctorUserId: string;
  recipientEmail?: string;
  subject: string;
  body: string;
  attachments?: GmailDraftAttachment[];
}): Promise<GmailDraftResult> {
  try {
    const subject = args.subject.trim();
    const body = args.body.trim();

    if (!subject || !body) {
      throw new Error("Subject and body are required to create a Gmail draft.");
    }

    const connection = await getUsableConnection(args.doctorUserId);

    if (!connection) {
      throw new Error("GMAIL_NOT_CONNECTED");
    }

    const raw = base64UrlEncode(
      serializeEmailMessage(
        args.recipientEmail,
        subject,
        body,
        args.attachments ?? []
      )
    );
    const response = await fetch(GMAIL_CREATE_DRAFT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: { raw }
      })
    });

    const draftJson = (await response.json()) as {
      id?: string;
      message?: { id?: string };
      error?: {
        code?: number;
        message?: string;
        status?: string;
        details?: unknown;
        errors?: unknown;
      };
    };

    if (!response.ok || !draftJson.id) {
      const error = new Error("Gmail draft creation failed.") as Error & {
        status?: number;
        code?: string | number;
        providerMessage?: string;
        details?: unknown;
        body?: unknown;
      };
      error.status = response.status;
      error.code = draftJson.error?.code ?? response.status;
      error.providerMessage = draftJson.error?.message ?? draftJson.error?.status;
      error.details = draftJson.error?.details ?? draftJson.error?.errors ?? null;
      error.body = draftJson;
      throw error;
    }

    return {
      draftId: draftJson.id,
      messageId: draftJson.message?.id ?? null
    };
  } catch (error) {
    logGmailDraftError(error);

    if (error instanceof Error && error.message === "GMAIL_NOT_CONNECTED") {
      throw new Error("Bitte verbinden Sie zuerst Gmail, bevor Sie einen Entwurf erstellen.");
    }

    throw new Error("Der Gmail-Entwurf konnte derzeit nicht erstellt werden. Bitte versuchen Sie es erneut.");
  }
}
