# USB reconnect and LED off — 2026-10-25

The installed 0.5.1 log repeatedly reported `incomplete HID write (-1/65 bytes)` during `readLighting` after physical USB reconnect. The old daemon's `open` returned its cached descriptor whenever a handle object existed, without checking whether that native handle still worked. The renderer then retained the old USB path. This failed during LED preflight reads, before a new mode was written.

0.5.2 refreshes the connection before device work. An explicit idle open first identifies the existing handle; a transport failure permits one fresh open of a uniquely matching vendor/product/nonempty serial, followed by exact identity validation. A serial/model change is rejected. This is a connection/read retry, never a replay of configuration writes. An active or uncertain key transaction blocks reopen. LED journals/baselines and pending restoration gates are preserved. Offline close cannot report unrecovered LED changes as restored.

The renderer only adopts the refreshed descriptor after checking serial and identity. Remaining HID write/read failures receive an actionable Korean USB message rather than an Electron invocation wrapper. Keyboard/LED drafts are preserved.

The selected-key LED palette now has15colors plus black/off with a power icon, replacing the redundant dark-red swatch. Old v4 dark-red files remain import-compatible. Knob actions and keyboard rotation are unaffected.

Verification: app JS120/120, Python49/49; catalog16/16 plus6profiles/450actions/6datasets validation. Fake tests cover stale same/new paths, closed-handle exceptions, serial/identity mismatches, duplicate matches, transaction/recovery retention and no write replay. A live device test deliberately closed the native handle, reopened the same device, and confirmed all75key records and raw LED replies matched with zero configuration writes. This simulates an invalid native handle; a physical unplug/replug of the packaged fix has not yet been observed. Evidence is under ignored device-backups/usb-reopen-live/.
