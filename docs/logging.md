# Diagnostic logs

Mini Keyboard Studio stores diagnostic events under the app's user data directory:

- `logs/studio.jsonl`: current file
- `logs/studio.1.jsonl`: previous file
- `logs/studio.2.jsonl`: oldest retained file

Choose **로그 폴더 열기** in the app or tray menu, or **파일·공유 → 진단 로그 폴더 열기**. Each file is limited to approximately 2 MiB; the oldest file is removed during rotation. Files use mode `0600`, and a newly created log directory uses `0700`. Logs persist across app restarts. They are local and are not uploaded automatically. Existing legacy `desktop.log` files are not migrated into this rotation.

Each line is JSON with `timestamp` (UTC ISO format), `level`, `component`, `message`, and optional `details`. Concurrent writes are serialized. Fatal process diagnostics use a synchronous append so the record can survive process termination; the normal Node crash behavior remains enabled. Disk failures do not prevent the app's normal error reporting.

The main process records startup, application errors, helper command failures and their stacks, renderer console output, renderer process exits, uncaught exceptions, and unhandled promise rejections. Helper IPC arguments, results, raw keymaps, HID reports, and serial numbers are never intentionally recorded. Helper stderr is not copied wholesale; failed helper requests are recorded at the gateway call boundary. Renderer workflow events add the operation phase and outcome without device payloads.

## Renderer API

```js
await window.miniKeyboardDesktop.log({
  level: 'info', // info | warn | error
  component: 'device',
  message: 'Apply verification completed',
  details: {phase: 'verify', count: 12}
});
await window.miniKeyboardDesktop.openLogs();
```

Both return `Promise<boolean>` and can reject if unavailable or the request fails. Callers should catch logging failures so a diagnostics failure cannot interrupt a device operation. In a regular browser the desktop API is absent.

Only the Studio main frame can invoke these IPC handlers, using the same sender and origin validation as companion requests. Opening logs accepts no path: the main process always opens its own fixed `logs` directory. Log events accept only `level`, `component`, `message`, and optional object `details`; the complete incoming JSON must fit within 4 KiB. `component` allows 1–64 ASCII letters, digits, periods, underscores, and hyphens. `message` must contain 1–2048 characters.

Strings, nesting, arrays, object entries, and the stored event are bounded. Credential patterns (including Bearer credentials, GitHub tokens and common credential assignments) are redacted. Detail property names indicating credentials, serial numbers, keymaps, payloads, raw data, reports, or bindings are redacted recursively. This is a defensive filter, not a license to submit secrets or arbitrary device data: messages must describe the operation, and details must contain only non-sensitive metadata such as phase, count, elapsed time, and error category. Do not log IPC arguments, responses, clipboard contents, key sequences, device dumps, or shared keymap links.

UI error toasts record a static `ui.operation.failed` diagnostic instead of their displayed text: JSON parser errors can contain source snippets. Device workflow and readback errors have bounded, structured phase/ID/offset diagnostics.
