import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";

const port = Number(process.env.GMAIL_OAUTH_PORT || 53682);
const redirectUri = process.env.GMAIL_REDIRECT_URI || `http://localhost:${port}/oauth2callback`;
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET before running this script.");
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
  ],
});

console.log("\n🔐 Gmail OAuth setup");
console.log("1. Open this URL in your browser:\n");
console.log(authUrl);
console.log(`\n2. Authorize the Google account used by JARVIS.`);
console.log(`3. Google will redirect to ${redirectUri}. Keep this terminal running.\n`);

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", redirectUri);
    if (requestUrl.pathname !== new URL(redirectUri).pathname) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    if (error) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`OAuth failed: ${error}`);
      server.close();
      return;
    }
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Missing OAuth code");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error("Google returned no refresh token. Revoke the app grant and run again with prompt=consent.");
    }

    console.log("\n✅ OAuth complete. Store this refresh token as GMAIL_REFRESH_TOKEN (do not commit it):\n");
    console.log(tokens.refresh_token);
    console.log("\nYou can now close this terminal.\n");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>JARVIS Gmail OAuth complete</h1><p>You can close this tab and return to the terminal.</p>");
    server.close();
  } catch (err) {
    console.error("❌ OAuth exchange failed:", err instanceof Error ? err.message : err);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OAuth exchange failed. Check the terminal for details.");
    server.close();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Listening for OAuth callback on ${redirectUri}`);
});
