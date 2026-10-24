# Electron Packaging Implementation Plan

**Goal:** 단일 macOS 앱에서 편집기, HID, 메뉴 막대, 자동 실행을 제공한다.
**Spec:** [electron-design.md](electron-design.md)
**Architecture:** sandbox renderer + preload IPC + existing gateway + bundled HID executable. Stable custom origin and userData backups. Optional loopback API shares gateway.
**Execution:** User authorized implementation in this session. No Git repository exists; keep working in the supplied project directory.

## Tasks

- [x] 1. Test packaged gateway runtime selection, invalid IPC origins/commands, static path confinement, graceful helper shutdown; extend gateway and Python backup directory selection.
- [x] 2. Implement Electron main/preload/custom protocol, tray/lifecycle/login and optional API; test pure policy and real runtime without HID mutation.
- [x] 3. Adapt renderer to IPC, seed samples on first desktop run, share links, desktop connection; preserve browser behavior and run suites.
- [x] 4. Build standalone HID and signed Apple Silicon .app/ZIP; install, run UI and device read checks, verify menus/restart persistence/login registration.
- [x] 5. Independent review; repair important findings, final tests and record evidence/limitations.

## Review focus

Renderer sender validation; no private backups or development runtime in package; helpers exit after safe recovery; local API cannot interrupt an active owner; localStorage and original backup survive app upgrade/restart; login item points to installed app; deep links do not navigate to external content.
