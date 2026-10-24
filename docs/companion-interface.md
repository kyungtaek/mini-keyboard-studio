# Local companion interface

The web editor and a local Python process share one HID owner. `companion/bridge.py`
is a development daemon for macOS, not a packaged or notarized menu bar app. It
contains **no app observers or app-specific adapters**. A future VS Code, terminal,
agent, or foreground-app adapter can submit the same normalized event contract.
The source name is a routing label, not evidence that an app's state was observed.

Run with `.venv/bin/python companion/bridge.py`; install the pinned dependency from
`companion/requirements.txt` into that virtual environment. The daemon reads one
JSON object per stdin line and flushes exactly one JSON response per stdout line.
Diagnostics go to stderr. It does not listen on HTTP. The local Node gateway owns
browser authentication, Origin checks, HTTP routing, and request serialization.

```json
{"id":1,"command":"status"}
{"id":1,"ok":true,"result":{"connected":false,"device":null,"rulesEnabled":false}}
```

The result above is abbreviated. Failures use
`{"id":1,"ok":false,"error":"human-readable message"}`. A malformed JSON line
receives an error with `id:null`. IDs are echoed without interpretation. Commands
are sequential; clients must await responses and must not concurrently open the
same vendor interface through WebHID or the original MINI_KEYBOARD application.

## Device and transaction commands

| Command | Input fields | Result |
| --- | --- | --- |
| `list` | none | Array of candidate vendor interfaces; no device is opened |
| `open` | optional `pathHex` | Selected device descriptor with its freshly read `identity` |
| `close` | matching `lease` if a transaction is active | `{connected:false,lightingRestored:boolean,restoration?,restorationError?,baselinePath?}` |
| `exchange` | `reportId:3`, `data:[64 bytes]`, optional `lease` | `{reports:[{reportId:3,data:[63 bytes]}]}` |
| `begin` | nonempty `lease` string | `{leaseActive:true}` |
| `end` | matching `lease` | `{leaseActive:false,queuedResult?:object}` |
| `abort` | owner `lease` | Verified key rollback, then `{leaseActive:false,aborted:true,keyRestored:true,keyBackupPath}` |
| `recover` | none | Abort an expired orphan lease; refuses an unexpired lease |
| `status` | none | In-memory connection, rule, baseline, lease, and capability status; no HID requests |

A descriptor contains `vendorId`, `productId`, `productName`, `pathHex`,
`serialNumber`, and `collections:[{usagePage:65280,usage:1}]`. `open` adds `identity`, such as
`[16,3,11]`. Only VID `1189` or `514c`, PID `8830`, `8831`, `8832`, `8833`, `8840`,
`8842`, `8850`, or `8851`, and vendor usage `ff00:0001` are candidates. These USB
IDs indicate discovery candidates, not verified hardware support. Without a path,
exactly one candidate is required. `pathHex` must select one of the enumerated
vendor interfaces; arbitrary filesystem paths cannot be opened.

`exchange.data` excludes the report ID. The daemon writes exactly 65 HID bytes:
report ID `03` followed by the supplied 64 bytes. Native reads must be exactly
64 bytes beginning with `03`; the daemon removes that byte and returns the
remaining 63 bytes without padding or inventing unknown bytes. The browser's
existing `normalizeInput()` reconstructs the 64-byte native representation.

The raw exchange whitelist is deliberately narrow:

- `FB FB FB`, then zero padding: identify, one response.
- `FA <action-count> <encoder-count> <layer 1..3>`, then zero padding: key read.
  Counts must match the identified geometry. Supported FD65 devices return one
  response per action; a legacy response is limited to one report.
- `FA B0 <layer 0..2>`, then zero padding: one LED read, restricted to the verified
  VID/PID/identity below.
- `FD <action-id> <layer 1..3> ...`: at most the existing 49 record bytes after
  `FD`; remaining payload padding must be zero.
- `AA AA` or `FD FE FF`, then zero padding: the existing separator/commit sequence.

Raw `FE` LED writes are **not** exposed. `FC` model selection, firmware commands,
and all other raw commands are rejected. Record writes, separators, and commits
require an active matching lease and a recognized FD65 identity. Firmware variants
10 or newer with a known key/encoder geometry are supported; `514c:8850` identity
`[15,3,0]` is the explicit public-reference exception. Other legacy identities
remain read-only. LED writes require exactly `514c:8850` identity `[16,3,11]`.

Before the first configuration write within **each lease**, the daemon reads and
validates all three key layers, sorts and checks every action ID, and saves their
original 64-byte reports in a private `companion/backups/keys-*.json` file. The
verified 16-key/3-encoder board has 75 records. Files use exclusive creation,
mode `0600`, flush, file fsync, and directory fsync. Any backup failure prevents
the write. This additional raw baseline does not replace the editor's portable
backup, transaction readback, or key rollback.

A lease expires after 120 seconds without a completed matching exchange. This
uses the process's monotonic clock. Each successful matching exchange renews the
idle deadline. Expiry prevents further raw exchanges or normal `end`; it does not
silently release the lock or discard the baseline. Only the owner token can
`abort` a live lease. Any authenticated client can `recover` an expired orphan.
This permits browser reload recovery while protecting another tab's active work.
`status` exposes the remaining time and recovery availability without the token.

`abort`, expired-lease `recover`, owner `close`, and graceful daemon shutdown
restore any possibly written key transaction from its durable key backup before
releasing the lease. The daemon validates all saved records and selected device
metadata, freshly checks identity, writes all original records through the same
bounded FD/commit path, and freshly reads each layer to compare record bytes
2..50. It disables state automation and drops queued LED work during abort.
A failed rollback keeps the lease, pending flag, and backup available for retry;
no new transaction can overwrite them. Key rollback follows the existing writable
record contract; untouched response padding is preserved in the backup.

Normal `end` means the caller's key transaction and readback completed. The last
16 completed lease results are cached, allowing repeated `end` or `abort` after a
lost HTTP acknowledgement. Retrying an old token while a different lease is
active fails without affecting the current owner. Begin requires a fresh token.
An `abort` for a lease that was never accepted safely acknowledges an already
unlocked daemon. Browser clients retain their lease until an acknowledgement.

All raw exchanges during a lease must carry that lease, including reads. Outside
a lease, reads are allowed. Other `begin`, `open`, `close`, `readLighting`, and
`restoreLighting` operations cannot interrupt a key lease. Owner `close` accepts
its matching token and aborts first. Rules and state events remain configurable. The latest state event is queued until `end`. If its LED
application fails, `end` still succeeds and returns `queuedResult:{error:...}` so
the completed key transaction is not reported as failed.

## Normalized state and lighting

```json
{"id":2,"command":"configure","enabled":false,"rules":[{"source":"manual","state":"working","layer":0,"mode":1,"color":"#2878ff"}]}
{"id":3,"command":"state","event":{"version":1,"source":"manual","state":"working","occurredAt":"2026-10-24T19:00:00+09:00"}}
```

`configure` replaces the in-memory rules and explicit `enabled` flag. It defaults
to disabled at process start and never persists an enabled flag. There are at
most 128 rules. A rule requires `source`, `state`, `layer:0..2`, `mode:0..5`, and
either a single `color:"#rrggbb"` or exactly sixteen `colors`. Optional `appId`
limits the rule to that exact app ID. Source and state are nonempty strings of
at most 80 characters; app IDs allow 255 characters. Duplicate
source/state/appId combinations are rejected. App-specific rules take precedence
over the source/state fallback. No fuzzy state or app matching is performed.

Events require `version:1`, `source`, and `state`; optional `appId` uses the same
matching rules. Optional `occurredAt` is an ISO timestamp with a timezone. States
such as `working`, `attention`, `done`, and `error` are useful conventions, not an
enumerated requirement. Unknown states match no rule and do not change lighting.
No rule means `{matched:false,changed:false}`.

A matched event returns:

```json
{"matched":true,"queued":false,"preview":true,"desired":{"layer":0,"mode":1,"colors":["#2878ff"]},"changed":false}
```

The example abbreviates `colors`; actual output always includes all sixteen.
Disabled configuration previews desired output without opening HID or sending
any commands. During a lease, `queued:true` means only the latest event is kept.
An enabled, connected application returns `changed:true,verified:true` after
readback. A repeated desired value returns `changed:false,verified:true` without
HID traffic. There are no timers, animations, or app-driven keymap rewrites.

| Command | Result |
| --- | --- |
| `setLighting` with `layer:0..2`, `mode:0..5`, `color` or `colors` | `{desired:{layer,mode,colors},changed,verified:true}` |
| `readLighting` | `{layers:[{mode,colors:[16 hex colors]} x3],raw:[3 native-report hex strings]}` |
| `restoreLighting` | `{restored:true,verified:true,rulesEnabled:false}` after all layers verify |

`setLighting` directly applies one selected layer without changing configured
state rules, their enabled flag, or the last source event. It uses the same
original baseline, recovery journal, identity/serial guard, and strict readback
as state-driven changes. Key leases reject direct settings rather than queueing
them. A failed direct write uses the existing restoration path and disables
state automation. These settings last for this companion session: graceful app
exit restores the original LED baseline. They are not advertised as permanent
keyboard configuration or verified persistence across power cycles.

Before the first LED write, the daemon reads all three LED layers and durably
saves `companion/backups/lighting-*.json`, containing raw responses and interpreted
mode/RGB values. Before each possible mutation it also atomically replaces and
fsyncs a managed recovery journal. The journal binds the original baseline to
VID, PID, identity, and the device's nonempty serial number; LED writes are refused
without a serial number. The journal points only to a validated baseline filename
inside the managed backup directory; there is no arbitrary file-load API. It does not derive LED state from a key backup. Native response
layout is `03 FA <mode> <48 RGB bytes> <13 remaining bytes>`, corroborated by
[evidence/led-read-only.json](../evidence/led-read-only.json). Writes use
`03 FE B0 <layer> <mode> <48 RGB bytes> <zero padding>`, followed by a fresh
`03 FA B0 <layer>` read. Mode and every RGB byte must match.

A failed LED write/readback disables automation, attempts to restore the affected
layer from the original baseline, and reports whether restoration verified.
`restoreLighting` explicitly writes and verifies all three original layers and
disables automation even if restoration fails. Unknown baseline mode bytes are
preserved for restoration; new requested modes are restricted to 0..5.
`close`, stdin EOF, SIGINT, and SIGTERM attempt baseline restoration if this session
actually modified lighting, then close HID. A forced kill, power loss, or device
disconnect cannot guarantee restoration; the durable baseline remains on disk.
`close` reports a restoration failure together with its saved baseline path.
A failed close keeps the original baseline recoverable. On `open`, including in
a restarted daemon, a pending journal for that exact VID/PID/identity/serial is
loaded. `status.lightingRecoveryRequired` becomes true and new state LED writes
are blocked until explicit `restoreLighting` succeeds. Restoration verifies all
three layers and clears journal pending state only after verified progress.
Different serial numbers cannot load or restore each other's original baseline.
SIGKILL or power loss during a key transaction can still prevent graceful key
rollback; the original key backup remains on disk for explicit recovery.

`status` includes `connected`, `device`, `rulesEnabled`, `lastEvent`, `lastResult`,
`leaseActive`, `leaseExpiresInMs`, `recoveryAvailable`, `keyBackupStored`,
`keyWritePending`, `keyBackupPath`, `baselinePath`, `lightingRecoveryRequired`, and `capabilities` with
`keyWrites`, `lightingRead`, `lightingWrite`, and
`modeVisualSemanticsVerified:false`. It never exposes the lease token.

Reading back mode/RGB bytes proves the protocol exchange. It does not prove the
visible LED effect, physical index ordering, persistence across power cycles,
brightness, animation speed, mode names, or support on other firmware. Modes
0..5 currently preserve the original application's numeric range only. App-state
extraction and packaged macOS deployment remain separate work.

## Verification

`.venv/bin/python -m unittest discover -s tests -p 'test_companion.py'` uses an
in-memory HID transport and temporary private backups. It covers vendor selection,
framing and command rejection, durable key and LED backup gates, complete key
capture validation, preview and matching, lease queuing, duplicate suppression,
LED verification and restoration, expired orphan recovery, owner protection, durable
key rollback, lost-acknowledgement retries, device-bound LED restart recovery,
and JSON-lines response behavior. These tests
never issue hardware commands and are not a physical E2E claim.

### App-window input diagnostics

The Device → 키 입력 진단 tool reads all three key-action layers without writing the device. Explicitly start measurement, choose the expected on-screen position, then press the physical key. KeyboardEvent physical codes and modifier flags are compared against single-key actions in the snapshot for the diagnostic layer selector. Blue positions and result text contain only that selected layer; duplicates within it are reported together. They do not prove a physical scan-code identity or the active hardware layer. Macros, media events, OS remapping, and OS-reserved shortcuts may not match. Events cannot distinguish the mini keyboard from another keyboard.

In Electron, armed `before-input-event` handling suppresses page input and native app menu accelerators while the app window has focus. Blur, hide, navigation, renderer loss, and quit disarm measurement. This is not a global keyboard hook and does not suppress input delivered to other apps or OS-reserved commands. Raw events remain in a bounded 200-event in-memory session and are never sent to persistent diagnostic logs; the user may explicitly save a JSON measurement file containing the session settings and observed events.

The direct LED editor holds the same app device-work lock as key writes and LED restoration. Opening it only reads status/LED records; it does not replace or disable state rules. Numeric modes 0–5 are exposed without unverified effect names. Direct LED changes retain the existing session restoration behavior: quitting the app restores the original LED baseline.

The diagnostic board includes the encoder strip and configured angle, inheriting `profile.rotation` from the editor without a separate direction preference. Encoder placement and key coordinates use the same clockwise rotation convention as the editor. Observations freeze the angle and selected expected position when input arrives. Displayed match IDs remain device-record IDs; accompanying row/column coordinates are computed for the recorded angle. This display change does not remap or write keys.

### Editor slots versus USB records (0.4.4 — withdrawn in 0.4.5)

Profile action indices are logical editor slots. For the calibrated `514c:8850` identity `[16,3,11]`, the JS controller converts key slots to firmware scan IDs at apply, and reverses that conversion for device snapshots/profile imports. Do not additionally rotate data according to profile.rotation: rotation affects the editor placement, while this calibration is a fixed base offset. Raw backups and restore commands remain firmware-ID ordered. Encoders and uncalibrated device identities use unchanged IDs. Existing keymap content and displayed arrangement are preserved; reapplying the profile installs the corrected physical placement. Diagnostic sessions mark `actionSpace: editor-logical` and include the actual `wireId` with matching observations.

### Direct IDs established by ordered measurement (0.4.5)

The 0.4.4 90-degree calibration was incorrect and is removed. Explicit physical top-left-to-bottom-right input, paired with an independent raw read, resolves the last eight positions at 270° to raw IDs `[2,6,10,14,1,5,9,13]`, exactly matching the rotated editor grid. Profile IDs and raw USB IDs therefore remain identical. Apply/snapshot/import retain validated identity array boundaries; rotation affects geometry only. Existing profile content does not migrate or rotate. Reapplying a profile corrects records written by 0.4.4. Raw backup/restore behavior stays unchanged.

## Persistent keymap lighting (0.5.0)

`saveProfileLighting` accepts `{layers:[{layer,mode,colors}],expectedDevice?}`. Supply 1–3 unique layers (0–2), mode 0–5 and exactly 16 valid RGB hex colors per layer. The UI resolves nullable profile patches against a fresh read before calling. `expectedDevice`, supplied by the combined apply path, is the exact `{vendorId,productId,identity:[3 bytes],serialNumber}` binding; a mismatch is rejected before HID access. This command requires an idle lease, supported serial-bearing 514c:8850 / [16,3,11], and no pending LED recovery.

The daemon saves a durable immediate checkpoint, applies and strictly reads back every selected layer, and restores that checkpoint on failure. On success only selected layers become the new persistent baseline; unrelated temporary state layers still restore at close. Unknown raw report tails are preserved. The result includes `persisted:true`, `verified:true`, changed count, layers and checkpoint paths. Journal write/reopen failures retain recovery gates. This operation deliberately persists keymap LED settings beyond normal app quit, unlike temporary state LED events.

The renderer checks device path and serial before key apply, sends the expected binding for LED apply, and checks again before a key rollback. Key transactions also validate the opened binding atomically when acquiring a lease. Keys and LED are sequential verified operations, not a single power-loss-atomic transaction.

### Visible activation observed on 2026-10-25

The vendor-saved mode4 and our mode1/all-blue profile were visually observed after USB power reconnect; their raw saved replies and 75 key records survived the cycle exactly. Restoring the prior colors while mode1 was active changed the visible colors immediately without reconnect. A universal reconnect requirement is therefore false. Mode activation latching is a hypothesis, not established firmware internals. The app records `lightingModeChanged` relative to fresh stored-mode readback, not a probe of the active effect. Only mode-change feedback conditionally suggests reconnect if the visible effect does not change. Readback verification continues to describe stored bytes, not current light output.

### USB handle refresh (0.5.2)

An explicit idle `open` probes the existing native handle with identification. On a transport failure it closes the stale handle and re-enumerates exactly one matching VID/PID/nonempty serial, then verifies the original identity. USB path changes are allowed only after this binding check. It never replays a failed configuration command. A changed identity response is rejected without switching devices. Active/uncertain key writes block reopening. LED baselines, rules and journal evidence survive reopen; pending modified LED layers require explicit recovery. Offline close does not claim unrecovered LEDs were restored.

The renderer refreshes before device work and LED control, adopts a new path only after matching serial and identity, and presents actionable USB reconnect errors instead of the Electron invocation wrapper. The palette includes black/off plus15colors, retaining the former dark-red choice for existing v4 file imports only.
