import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIREBASE_PROJECT_ID = "table-ordering-app-74046";

interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    type: "order" | "buzzer";
    orderId?: string;
    tableNumber?: string;
  };
}

// Send FCM notification to all registered devices
async function sendNotification(payload: NotificationPayload) {
  // Get all FCM tokens from database
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: tokens, error } = await supabase
    .from("fcm_tokens")
    .select("token");

  if (error) {
    console.error("Error fetching FCM tokens:", error);
    throw error;
  }

  if (!tokens || tokens.length === 0) {
    console.log("No FCM tokens found");
    return { success: true, message: "No devices to notify" };
  }

  // Get Firebase service account
  const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}");

  // Get access token using service account
  const jwtHeader = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, "");
  const claimSetB64 = btoa(JSON.stringify(jwtClaimSet)).replace(/=/g, "");
  const unsignedToken = `${headerB64}.${claimSetB64}`;

  // Import private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${unsignedToken}.${base64Signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Send notification to each token
  const results = await Promise.all(
    tokens.map(async ({ token }) => {
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title: payload.title,
                  body: payload.body,
                },
                data: payload.data || {},
                android: {
                  priority: "high",
                  notification: {
                    sound: "default",
                    channel_id: "orders",
                    default_sound: false,
                    default_vibrate_timings: false,
                  },
                },
              },
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error(`Failed to send to token ${token}:`, result);

          // If token is invalid, remove it from database
          if (result.error?.code === "INVALID_ARGUMENT" || result.error?.code === "NOT_FOUND") {
            await supabase.from("fcm_tokens").delete().eq("token", token);
            console.log(`Removed invalid token: ${token}`);
          }

          return { success: false, token, error: result };
        }

        return { success: true, token, result };
      } catch (error) {
        console.error(`Error sending to token ${token}:`, error);
        return { success: false, token, error };
      }
    })
  );

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return {
    success: true,
    totalTokens: tokens.length,
    successCount,
    failCount,
    results,
  };
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();

    console.log("Sending FCM notification:", payload);

    const result = await sendNotification(payload);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-fcm-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
