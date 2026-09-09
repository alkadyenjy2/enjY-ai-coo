# Gmail Tool — JARVIS AI COO

## Scope

The Gmail tool provides three server-side operations:

- `sendEmail(to, subject, body)` — sends a real Gmail message.
- `verifyEmailSent(messageId)` — reads the message metadata and requires the `SENT` label.
- `listRecentEmails(limit)` — lists recent Gmail message IDs.

The tool is intentionally opt-in for live sending and never stores OAuth secrets in source control.

## Google Cloud setup

1. Open Google Cloud Console.
2. Create/select a project.
3. Enable the Gmail API.
4. Configure an OAuth consent screen for the account/project.
5. Create an OAuth 2.0 Desktop/Web client whose redirect URI includes `http://localhost:53682/oauth2callback`.

## Local configuration

Set these environment variables locally or in the deployment secret store:

```bash
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_REDIRECT_URI=http://localhost:53682/oauth2callback
```

Never commit the values above.

## Generate a refresh token

```bash
npx tsx scripts/gmail-oauth.ts
```

Open the printed Google authorization URL. After consent, the local callback exchanges the authorization code and prints the refresh token once. Store it as `GMAIL_REFRESH_TOKEN`.

## Live test

Live sending is explicitly disabled by default.

```bash
GMAIL_LIVE_TEST=true GMAIL_TEST_TO=your-test-inbox@example.com npm run test:gmail-tool
```

The test sends one email, fetches it back by message ID, checks the `SENT` label, and fails if verification is not confirmed.

## JARVIS integration contract

The command router should expose Gmail only for an explicit email-send intent. Sending is a side effect and must remain behind the existing sensitive-action / human-approval governance. Every successful or failed send should be represented in the existing operational execution record with message ID and verification status.

Bulk sending must require explicit human approval and should not be implemented as an unbounded loop.

## Security

- Gmail OAuth is server-side only.
- Refresh tokens must be stored as secrets, never in Git.
- Recipient, subject, and body are validated before dispatch.
- The tool does not use a service account or service-role credential.
- Live tests are opt-in.
