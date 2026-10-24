# Development

This guide is for building Mini Keyboard Studio from source. For installation and everyday use, see the [app introduction](../README.md) and [latest release](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest).

## Requirements

- macOS on Apple Silicon for the packaged desktop app.
- Node.js 22 or later and npm.
- Python 3 and a virtual environment for the HID companion and packaging.

## Run from source

```sh
npm install
python3 -m venv .venv
.venv/bin/python -m pip install -r companion/build-requirements.txt
npm run desktop
```

The desktop app bundles the editor and starts one HID companion. It does not require a separately running web server.

For browser development:

```sh
./scripts/start.sh
```

Open [localhost:4173](http://localhost:4173). Direct browser USB access uses WebHID in desktop Chrome or Edge. The packaged app uses its bundled companion instead. Browser mode includes built-in samples; the authenticated GitHub catalog is a desktop feature.

## Test and package

```sh
npm test
.venv/bin/python -m unittest discover -s tests -p 'test_companion.py'
npm run package:mac
```

Build output is written to `dist/`. Source packaging configuration determines targets and signing; a successful local build alone does not establish Developer ID signing or notarization. Do not package personal profiles, credentials, device backups or research evidence.

Automated tests exercise validation, codecs, device simulations, recovery and app boundaries. They are separate from physical USB operation, visible lighting effects and power-cycle checks. Do not run hardware writes merely to check documentation changes.

## Project references

- [Function editor and profile v4](function-editor.md): labels, per-key lighting and migration.
- [Device compatibility](device-compatibility-research.md): model and protocol boundaries.
- [Companion interface](companion-interface.md): local status and control integration.
- [Shortcut sources](shortcut-sources.md): reference material and application-specific limits.
- [Logging](logging.md): diagnostics and redaction.
- [LED observations](led-visible-investigation.md) and [USB reconnect handling](usb-reconnect-fix.md).

## Local data

The desktop app stores its data under `~/Library/Application Support/Mini Keyboard Studio/`. Original HID backups live in `companion-backups/`, and diagnostic logs live in `logs/`. Browser profiles can be moved with JSON export and import.

Device keys and LED settings have separate backups. A key backup is not a firmware image. Keep `device-backups/`, `companion/backups/`, credentials and raw evidence out of source control. Consult the relevant recovery documentation before changing device I/O.
