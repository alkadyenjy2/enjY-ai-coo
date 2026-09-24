# JARVIS Voice + BrowserSkill Integration

## Target architecture

BrowserSkill is a browser adapter, not a replacement for the JARVIS execution core.

Voice input/output
    |
    v
JARVIS command boundary (/api/agent/command)
    |
    +--> intent / policy / approval / duplicate guard
    |
    +--> BrowserSkill adapter (only when browser capability is selected)
    |
    +--> evidence verification
    |
    v
OperationalExecutionRecord / durable audit

The existing Browser Use adapter remains intact. BrowserSkill is registered as a separate local/OSS browser capability so the runtime can choose it without coupling the core to the BrowserSkill implementation.

## Phase 1.2 — BrowserSkill

### Required local components

- Windows x64 bsk CLI/daemon.
- Chrome or Edge Chromium 125+.
- BrowserSkill extension installed in the intended browser profile.
- Local browser connection enabled in the extension.
- bsk doctor passing.
- A real browser task producing evidence.

### Evidence gate

Do not mark BrowserSkill as operational merely because the package or registry entry exists. The minimum behavioral evidence is:

1. bsk --version returns successfully.
2. bsk doctor reports the browser connection as healthy.
3. bsk session start --no-focus --json returns a session id.
4. bsk navigate https://example.com --session <id> succeeds.
5. bsk observe --session <id> returns page state.
6. The session is stopped.
7. The resulting evidence is attached to the JARVIS execution record.

## Phase 1.3 — Voice benchmark

Voice is kept transport-level and provider-agnostic. The benchmark must compare:

- speech-to-text latency,
- transcription accuracy on Arabic/English mixed commands,
- command handoff latency,
- interruption/barge-in behavior,
- text-to-speech first-audio latency,
- failure recovery,
- evidence that the spoken command reached the same JARVIS command boundary as text input.

The EthanPlusAI JARVIS repository is used only as a reference for voice UX and session-watching patterns. Its macOS/AppleScript runtime and required Fish Audio dependency are not imported into the Windows JARVIS core.

## Safety boundary

Browser tasks can operate with the permissions of the selected logged-in browser profile. Human-only steps such as login, verification, CAPTCHA, or sensitive confirmation remain user-gated. Destructive actions must continue through the existing JARVIS approval/evidence controls.

## Source references

- Tencent BrowserSkill: https://github.com/Tencent/BrowserSkill
- BrowserSkill install guide: https://raw.githubusercontent.com/Tencent/BrowserSkill/main/AGENT_INSTALL.md
- EthanPlusAI JARVIS reference: https://github.com/ethanplusai/jarvis
- ENJY AI COO: https://github.com/alkadyenjy2/enjY-ai-coo