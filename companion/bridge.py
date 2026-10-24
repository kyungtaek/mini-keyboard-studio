#!/usr/bin/env python3
"""Local HID owner and normalized state interface. Stdout is JSON-lines only."""
import json
import hashlib
import os
from pathlib import Path
import re
import signal
import sys
import time
from datetime import datetime, timezone
from uuid import uuid4

VENDORS = (0x1189, 0x514C)
PRODUCTS = (0x8830, 0x8831, 0x8832, 0x8833, 0x8840, 0x8842, 0x8850, 0x8851)
MODELS = {(16, 3), (3, 1), (6, 1), (6, 2), (12, 2), (12, 3), (12, 4), (9, 2)}
HEX_COLOR = re.compile(r'#[0-9a-fA-F]{6}\Z')


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def text_field(value, name, maximum=128):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f'{name} must be a non-empty string of at most {maximum} characters')
    return value


def padded(*prefix):
    return list(prefix) + [0] * (64 - len(prefix))


class HIDTransport:
    """Import hidapi lazily so disconnected previews need no USB dependency."""
    def enumerate(self):
        import hid
        return hid.enumerate()

    def open_path(self, path):
        import hid
        device = hid.device()
        device.open_path(path)
        return device


class Bridge:
    def __init__(self, transport=None, backup_dir=None, delay=0.03, lease_timeout=120, clock=time.monotonic):
        self.transport = transport or HIDTransport()
        self.backup_dir = Path(backup_dir or Path(__file__).parent / 'backups')
        self.delay = delay
        self.clock, self.lease_timeout = clock, lease_timeout
        self.lease_deadline = None
        self.finished_leases = {}
        self.key_write_pending = False
        self.lighting_recovery_required = False
        self.handle_device = None
        self.device = None
        self.lease = None
        self.key_backup_stored = False
        self.key_backup_path = None
        self.rules = []
        self.enabled = False
        self.last_event = None
        self.last_result = None
        self.queued_event = None
        self.baseline = None
        self.baseline_path = None
        self.modified_layers = set()
        self.applied = {}

    def handle(self, request):
        if not isinstance(request, dict):
            raise ValueError('request must be an object')
        command = request.get('command')
        if command == 'list':
            return [self._info(item) for item in self._enumerate()]
        if command == 'open':
            return self.open(request.get('pathHex'))
        if command == 'close':
            if self.lease is not None:
                self._lease_matches(request.get('lease'), allow_expired=True)
            return self.close()
        if command == 'exchange':
            return self.exchange(request)
        if command == 'begin':
            self._connected()
            lease = text_field(request.get('lease'), 'lease')
            if self.lease is not None:
                raise ValueError('a transaction lease is already active')
            if lease in self.finished_leases:
                raise ValueError('use a fresh lease token for each transaction')
            self.lease = lease
            self.lease_deadline = self.clock() + self.lease_timeout
            self.key_write_pending = False
            self.key_backup_stored = False
            self.key_backup_path = None
            return {'leaseActive': True}
        if command == 'abort':
            return self.abort(request.get('lease'))
        if command == 'recover':
            if self.lease is None:
                return {'leaseActive': False, 'recovered': False}
            if self.clock() < self.lease_deadline:
                raise ValueError('the active lease has not expired; only its owner may abort')
            return self.abort(self.lease)
        if command == 'end':
            lease = text_field(request.get('lease'), 'lease')
            previous = self._finished(lease)
            if previous is not None:
                return previous
            self._lease_matches(lease)
            self.lease = None
            self.lease_deadline = None
            self.key_write_pending = False
            queued, self.queued_event = self.queued_event, None
            result = {'leaseActive': False}
            if queued is not None:
                try:
                    result['queuedResult'] = self.state(queued)
                except Exception as error:
                    result['queuedResult'] = {'error': str(error)}
            self._remember(lease, result)
            return result
        if command == 'configure':
            return self.configure(request)
        if command == 'state':
            return self.state(request.get('event'))
        if command == 'readLighting':
            self._unleased()
            return self.read_lighting()
        if command == 'restoreLighting':
            self._unleased()
            return self.restore_lighting()
        if command == 'status':
            return self.status()
        raise ValueError('unknown command')

    def _enumerate(self):
        return [item for item in self.transport.enumerate()
                if item.get('vendor_id') in VENDORS and item.get('product_id') in PRODUCTS
                and item.get('usage_page') == 0xFF00 and item.get('usage') == 1]

    def _info(self, item):
        path = item['path']
        if isinstance(path, str):
            path = path.encode()
        return {'vendorId': item['vendor_id'], 'productId': item['product_id'],
                'productName': item.get('product_string') or 'Mini Keyboard',
                'pathHex': bytes(path).hex(), 'serialNumber': item.get('serial_number') or '', 'collections': [{'usagePage': 0xFF00, 'usage': 1}]}

    def open(self, path_hex=None):
        self._unleased()
        if self.handle_device is not None:
            if path_hex is None or path_hex == self.device['pathHex']:
                return self.device
            raise ValueError('close the selected device before selecting another')
        candidates = self._enumerate()
        if path_hex is not None:
            if not isinstance(path_hex, str) or not re.fullmatch(r'(?:[0-9a-fA-F]{2})+', path_hex):
                raise ValueError('pathHex must encode an enumerated device path')
            candidates = [item for item in candidates if self._info(item)['pathHex'] == path_hex.lower()]
        if len(candidates) != 1:
            raise ValueError('select exactly one vendor interface using its pathHex')
        item = candidates[0]
        self.handle_device = self.transport.open_path(item['path'])
        self.device = self._info(item)
        try:
            response = self._wire(padded(251, 251, 251), 1)[0]
            if len(response) != 64 or response[:2] != [3, 251]:
                raise ValueError('invalid identify response')
            self.device['identity'] = response[2:5]
            self._load_lighting_journal()
            return self.device
        except Exception:
            self.handle_device.close()
            self.handle_device, self.device = None, None
            raise

    def _connected(self):
        if self.handle_device is None:
            raise ValueError('no device is connected')

    def _unleased(self):
        if self.lease is not None:
            raise ValueError('a key transaction lease is active')

    def _lease_matches(self, lease, allow_expired=False):
        if self.lease is None or lease != self.lease:
            raise ValueError('the active transaction lease is required')
        if not allow_expired and self.clock() >= self.lease_deadline:
            raise ValueError('the transaction lease expired; abort or recover it before continuing')

    def _finished(self, lease):
        if self.lease is not None and self.lease != lease:
            raise ValueError('a different transaction lease is active')
        return self.finished_leases.get(lease)

    def _remember(self, lease, result):
        self.finished_leases[lease] = result
        if len(self.finished_leases) > 16:
            del self.finished_leases[next(iter(self.finished_leases))]

    def abort(self, lease):
        lease = text_field(lease, 'lease')
        previous = self._finished(lease)
        if previous is not None:
            return previous
        if self.lease is None:
            return {'leaseActive': False, 'aborted': False, 'keyRestored': True}
        self._lease_matches(lease, allow_expired=True)
        self.enabled = False
        self.queued_event = None
        if self.key_write_pending:
            try:
                self._restore_keys()
            except Exception as error:
                raise ValueError(f'key rollback failed; lease and durable backup retained: {error}') from error
        result = {'leaseActive': False, 'aborted': True, 'keyRestored': True,
                  'keyBackupPath': self.key_backup_path}
        self.lease, self.lease_deadline = None, None
        self.key_write_pending = False
        self._remember(lease, result)
        return result

    def _restore_keys(self):
        # The durable file, rather than a mutable in-memory copy, is authoritative.
        saved = json.loads(Path(self.key_backup_path).read_text(encoding='utf-8'))
        if saved.get('format') != 'companion-key-baseline' or saved.get('version') != 1 or saved.get('device') != self.device:
            raise ValueError('key backup belongs to a different selected device')
        count, encoders, supported = self._key_geometry()
        layers = saved.get('layers')
        if not supported or not isinstance(layers, list) or len(layers) != 3:
            raise ValueError('invalid key backup geometry')
        parsed = []
        for layer, records in enumerate(layers, 1):
            if not isinstance(records, list) or len(records) != count:
                raise ValueError('incomplete key backup')
            raw = []
            for action, value in enumerate(records, 1):
                if not isinstance(value, str) or not re.fullmatch(r'[0-9a-fA-F]{128}', value):
                    raise ValueError('invalid saved key report')
                record = list(bytes.fromhex(value))
                if record[:4] != [3, 250, action, layer]:
                    raise ValueError('invalid saved key action/layer')
                raw.append(record)
            parsed.append(raw)
        response = self._wire(padded(251, 251, 251), 1)[0]
        if response[:5] != [3, 251, *self.device['identity']]:
            raise ValueError('device identity changed before key rollback')
        for layer, records in enumerate(parsed, 1):
            for record in records:
                # Prime inactive triples and timing before the final type/count.
                stage = record.copy()
                stage[4], stage[6] = 1, 14
                self._wire(padded(253, *stage[2:51]), 0)
                if record[4] != 1 or record[6] != 14:
                    self._wire(padded(253, *record[2:51]), 0)
            for command in ((170, 170), (253, 254, 255), (170, 170)):
                self._wire(padded(*command), 0)
            if self.delay:
                time.sleep(0.12)
            actual = self._wire(padded(250, count, encoders, layer), count)
            actual.sort(key=lambda record: record[2])
            if any(record[:4] != [3, 250, action + 1, layer] or record[2:51] != records[action][2:51]
                   for action, record in enumerate(actual)):
                raise ValueError(f'key rollback readback mismatch on layer {layer}')

    def _key_geometry(self):
        self._connected()
        keys, encoders, variant = self.device['identity']
        reference = (self.device['vendorId'], self.device['productId'], keys, encoders, variant) == (0x514C, 0x8850, 15, 3, 0)
        if reference:
            keys = 16
        supported = (keys, encoders) in MODELS and (variant >= 10 or reference)
        return keys + encoders * 3, encoders, supported

    def _lighting_supported(self):
        return self.device is not None and (self.device['vendorId'], self.device['productId'], self.device['identity']) == (0x514C, 0x8850, [16, 3, 11])

    def _wire(self, data, count):
        self._connected()
        report = [3, *data]
        written = self.handle_device.write(report)
        if written != 65:
            raise ValueError(f'incomplete HID write ({written}/65 bytes)')
        if self.delay:
            time.sleep(self.delay)
        reports = []
        for _ in range(count):
            raw = list(self.handle_device.read(64, 2500))
            if len(raw) != 64 or raw[0] != 3 or not all(integer(x, 0, 255) for x in raw):
                raise ValueError('HID response timeout or invalid 64-byte report')
            reports.append(raw)
        return reports

    def exchange(self, request):
        self._connected()
        data = request.get('data')
        if request.get('reportId') != 3 or type(request.get('reportId')) is not int:
            raise ValueError('only report ID 3 is allowed')
        if not isinstance(data, list) or len(data) != 64 or not all(integer(x, 0, 255) for x in data):
            raise ValueError('data must contain exactly 64 unsigned bytes without the report ID')
        if self.lease is not None:
            self._lease_matches(request.get('lease'))
        elif request.get('lease') is not None:
            raise ValueError('there is no active transaction lease')
        count, encoders, writable = self._key_geometry()
        expected = 0
        config_write = False
        if data == padded(251, 251, 251):
            expected = 1
        elif data[0] == 250 and data[1] == 176 and integer(data[2], 0, 2) and not any(data[3:]):
            if not self._lighting_supported():
                raise ValueError('lighting reads are limited to the verified identity')
            expected = 1
        elif data[0] == 250 and data[1] == count and data[2] == encoders and integer(data[3], 1, 3) and not any(data[4:]) and count <= 60:
            expected = count if writable else 1
        elif data == padded(170, 170) or data == padded(253, 254, 255):
            self._lease_matches(request.get('lease'))
            config_write = True
        elif data[0] == 253 and integer(data[1], 1, count) and integer(data[2], 1, 3) and not any(data[50:]):
            self._lease_matches(request.get('lease'))
            config_write = True
        else:
            raise ValueError('command is outside the bounded read/FD-record/commit whitelist; model and firmware commands are prohibited')
        if config_write:
            if not writable:
                raise ValueError('configuration writes are disabled for unknown or legacy firmware')
            if not self.key_backup_stored:
                self._backup_keys()
            self.key_write_pending = True
        reports = self._wire(data, expected)
        if self.lease is not None:
            self.lease_deadline = self.clock() + self.lease_timeout
        if data[0] == 251:
            if reports[0][:2] != [3, 251] or reports[0][2:5] != self.device['identity']:
                raise ValueError('device identity changed; reconnect before continuing')
        return {'reports': [{'reportId': 3, 'data': raw[1:]} for raw in reports]}

    def _persist(self, kind, value):
        self.backup_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        path = self.backup_dir / f'{kind}-{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")}-{uuid4().hex}.json'
        descriptor = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
            json.dump(value, output, separators=(',', ':'))
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        directory = os.open(self.backup_dir, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
        return str(path.resolve())

    def _backup_keys(self):
        count, encoders, writable = self._key_geometry()
        if not writable:
            raise ValueError('key backup requires a supported FD65 identity')
        layers = []
        for layer in range(1, 4):
            raw = self._wire(padded(250, count, encoders, layer), count)
            raw.sort(key=lambda record: record[2])
            if any(record[:4] != [3, 250, index + 1, layer] for index, record in enumerate(raw)):
                raise ValueError('cannot back up incomplete, duplicate, or invalid key records')
            layers.append([bytes(record).hex() for record in raw])
        self.key_backup_path = self._persist('keys', {'format': 'companion-key-baseline', 'version': 1,
                                                   'device': self.device, 'layers': layers})
        self.key_backup_stored = True

    def _normalize_rule(self, rule):
        if not isinstance(rule, dict):
            raise ValueError('each rule must be an object')
        normalized = {'source': text_field(rule.get('source'), 'source', 80),
                      'state': text_field(rule.get('state'), 'state', 80)}
        if 'appId' in rule:
            normalized['appId'] = text_field(rule['appId'], 'appId', 255)
        if not integer(rule.get('layer'), 0, 2) or not integer(rule.get('mode'), 0, 5):
            raise ValueError('rule layer must be 0..2 and mode must be 0..5')
        colors = rule.get('colors')
        if colors is None and isinstance(rule.get('color'), str):
            colors = [rule['color']] * 16
        if not isinstance(colors, list) or len(colors) != 16 or not all(isinstance(c, str) and HEX_COLOR.fullmatch(c) for c in colors):
            raise ValueError('a rule requires color #rrggbb or exactly 16 colors')
        normalized.update(layer=rule['layer'], mode=rule['mode'], colors=[color.lower() for color in colors])
        return normalized

    def configure(self, request):
        if type(request.get('enabled')) is not bool or not isinstance(request.get('rules'), list) or len(request['rules']) > 128:
            raise ValueError('configure requires enabled:boolean and at most 128 rules')
        rules = [self._normalize_rule(rule) for rule in request['rules']]
        keys = [(r['source'], r['state'], r.get('appId')) for r in rules]
        if len(set(keys)) != len(keys):
            raise ValueError('duplicate source/state/appId rules are ambiguous')
        self.rules, self.enabled = rules, request['enabled']
        return {'enabled': self.enabled, 'rules': self.rules}

    def _event(self, event):
        if not isinstance(event, dict) or type(event.get('version')) is not int or event['version'] != 1:
            raise ValueError('event.version must be 1')
        normalized = {'version': 1, 'source': text_field(event.get('source'), 'source', 80),
                      'state': text_field(event.get('state'), 'state', 80)}
        if 'appId' in event:
            normalized['appId'] = text_field(event['appId'], 'appId', 255)
        if 'occurredAt' in event:
            stamp = event['occurredAt']
            if not isinstance(stamp, str) or len(stamp) > 64:
                raise ValueError('occurredAt must be an ISO timestamp with timezone')
            try:
                parsed = datetime.fromisoformat(stamp.replace('Z', '+00:00'))
            except ValueError as error:
                raise ValueError('occurredAt must be an ISO timestamp with timezone') from error
            if parsed.tzinfo is None:
                raise ValueError('occurredAt must include a timezone')
            normalized['occurredAt'] = stamp
        return normalized

    def state(self, event):
        event = self._event(event)
        self.last_event = event
        rules = [rule for rule in self.rules if rule['source'] == event['source'] and rule['state'] == event['state']
                 and ('appId' not in rule or rule['appId'] == event.get('appId'))]
        # An app-specific match overrides the source-wide fallback.
        rules.sort(key=lambda rule: 'appId' in rule, reverse=True)
        if not rules:
            self.last_result = {'matched': False, 'changed': False}
            if self.lease is not None:
                self.queued_event = event
            return self.last_result
        rule = rules[0]
        desired = {key: rule[key] for key in ('layer', 'mode', 'colors')}
        result = {'matched': True, 'queued': False, 'preview': not self.enabled, 'desired': desired, 'changed': False}
        if self.lease is not None:
            self.queued_event = event
            result['queued'] = True
        elif self.enabled:
            result.update(self._apply_lighting(desired))
        self.last_result = result
        return result

    def read_lighting(self):
        self._connected()
        if not self._lighting_supported():
            raise ValueError('lighting reads require the verified 514c:8850 identity [16,3,11]')
        raw = [self._wire(padded(250, 176, layer), 1)[0] for layer in range(3)]
        if any(record[:2] != [3, 250] for record in raw):
            raise ValueError('invalid lighting response header')
        layers = [{'mode': record[2], 'colors': ['#' + bytes(record[i:i + 3]).hex() for i in range(3, 51, 3)]}
                  for record in raw]
        return {'layers': layers, 'raw': [bytes(record).hex() for record in raw]}

    def _binding(self):
        if not self.device or not self.device.get('serialNumber'):
            return None
        return {key: self.device[key] for key in ('vendorId', 'productId', 'identity', 'serialNumber')}

    def _journal_path(self):
        binding = self._binding()
        if binding is None:
            raise ValueError('persistent lighting recovery requires a device serial number')
        digest = hashlib.sha256(json.dumps(binding, sort_keys=True).encode()).hexdigest()
        return self.backup_dir / f'led-recovery-{digest}.json'

    def _save_lighting_journal(self):
        if self.baseline is None:
            return
        value = {'format': 'companion-lighting-recovery', 'version': 1, 'device': self._binding(),
                 'baselineFile': Path(self.baseline_path).name, 'pendingLayers': sorted(self.modified_layers)}
        temporary = self._persist('journal-temp', value)
        os.replace(temporary, self._journal_path())
        descriptor = os.open(self.backup_dir, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)

    def _load_lighting_journal(self):
        self.baseline, self.baseline_path = None, None
        self.modified_layers.clear()
        self.applied.clear()
        self.lighting_recovery_required = False
        if self._binding() is None or not self._journal_path().exists():
            return
        journal = json.loads(self._journal_path().read_text(encoding='utf-8'))
        pending = journal.get('pendingLayers')
        if journal.get('format') != 'companion-lighting-recovery' or journal.get('version') != 1 or journal.get('device') != self._binding():
            raise ValueError('lighting recovery journal does not match the selected device')
        if not isinstance(pending, list) or not all(integer(layer, 0, 2) for layer in pending):
            raise ValueError('invalid lighting recovery layers')
        if not pending:
            return
        filename = journal.get('baselineFile')
        if not isinstance(filename, str) or not re.fullmatch(r'lighting-[0-9]{8}T[0-9]{6}-[0-9a-f]{32}\.json', filename):
            raise ValueError('lighting recovery baseline is not a managed backup')
        path = self.backup_dir / filename
        saved = json.loads(path.read_text(encoding='utf-8'))
        saved_device = saved.get('device', {})
        if saved.get('format') != 'companion-lighting-baseline' or saved.get('version') != 1 or any(saved_device.get(key) != value for key, value in self._binding().items()):
            raise ValueError('saved lighting baseline does not match device identity and serial')
        raw = saved.get('raw')
        if not isinstance(raw, list) or len(raw) != 3 or not all(isinstance(value, str) and re.fullmatch(r'[0-9a-fA-F]{128}', value) for value in raw):
            raise ValueError('invalid saved lighting reports')
        reports = [list(bytes.fromhex(value)) for value in raw]
        if any(report[:2] != [3, 250] for report in reports):
            raise ValueError('invalid saved lighting headers')
        layers = [{'mode': report[2], 'colors': ['#' + bytes(report[i:i + 3]).hex() for i in range(3, 51, 3)]} for report in reports]
        self.baseline, self.baseline_path = {'layers': layers, 'raw': raw}, str(path.resolve())
        self.modified_layers = set(pending)
        self.lighting_recovery_required = True

    def _baseline(self):
        if self.baseline is None:
            value = self.read_lighting()
            path = self._persist('lighting', {'format': 'companion-lighting-baseline', 'version': 1,
                                               'device': self.device, **value})
            self.baseline, self.baseline_path = value, path
        return self.baseline

    def _write_lighting(self, layer, value):
        rgb = list(bytes.fromhex(''.join(color[1:] for color in value['colors'])))
        self._wire(padded(254, 176, layer, value['mode'], *rgb), 0)
        actual = self._wire(padded(250, 176, layer), 1)[0]
        if actual[:3] != [3, 250, value['mode']] or actual[3:51] != rgb:
            raise ValueError('lighting readback did not match mode and all RGB bytes')
        self.applied[layer] = {'mode': value['mode'], 'colors': value['colors'][:]}

    def _apply_lighting(self, desired):
        self._connected()
        if not self._lighting_supported():
            raise ValueError('lighting writes require the verified 514c:8850 identity [16,3,11]')
        if self.lighting_recovery_required:
            raise ValueError('pending original lighting recovery requires restoreLighting before new state writes')
        if self._binding() is None:
            raise ValueError('lighting writes require a serial number for durable device-bound recovery')
        layer = desired['layer']
        value = {'mode': desired['mode'], 'colors': desired['colors']}
        if self.applied.get(layer) == value:
            return {'changed': False, 'verified': True}
        baseline = self._baseline()
        if layer not in self.applied and baseline['layers'][layer] == value:
            self.applied[layer] = value
            return {'changed': False, 'verified': True}
        self.modified_layers.add(layer)
        self._save_lighting_journal()
        try:
            self._write_lighting(layer, value)
        except Exception as error:
            self.enabled = False
            try:
                self._write_lighting(layer, baseline['layers'][layer])
                self.modified_layers.discard(layer)
                self._save_lighting_journal()
                outcome = 'original restored and readback verified'
            except Exception as restore_error:
                self.lighting_recovery_required = True
                outcome = f'original restoration failed: {restore_error}'
            self.last_result = {'matched': True, 'changed': False, 'verified': False, 'error': str(error), 'restoration': outcome}
            raise ValueError(f'{error}; {outcome}; automation disabled') from error
        return {'changed': True, 'verified': True}

    def restore_lighting(self):
        self._connected()
        self.enabled = False
        if self.baseline is None:
            raise ValueError('no lighting baseline exists in this device session')
        failures = []
        for layer in range(3):
            self.modified_layers.add(layer)
            try:
                self._save_lighting_journal()
                self._write_lighting(layer, self.baseline['layers'][layer])
                self.modified_layers.discard(layer)
                self._save_lighting_journal()
            except Exception as error:
                failures.append(f'layer {layer}: {error}')
        if failures:
            self.lighting_recovery_required = True
            raise ValueError('lighting restoration not verified: ' + '; '.join(failures))
        self.lighting_recovery_required = False
        return {'restored': True, 'verified': True, 'rulesEnabled': False}

    def status(self):
        writable = self._key_geometry()[2] if self.device else False
        lighting = self._lighting_supported()
        return {'connected': self.handle_device is not None, 'device': self.device,
                'rulesEnabled': self.enabled, 'lastEvent': self.last_event, 'lastResult': self.last_result,
                'leaseActive': self.lease is not None, 'keyBackupStored': self.key_backup_stored,
                'leaseExpiresInMs': max(0, int((self.lease_deadline - self.clock()) * 1000)) if self.lease is not None else 0,
                'recoveryAvailable': self.lease is not None and self.clock() >= self.lease_deadline,
                'keyWritePending': self.key_write_pending, 'keyBackupPath': self.key_backup_path,
                'lightingRecoveryRequired': self.lighting_recovery_required,
                'baselinePath': self.baseline_path,
                'capabilities': {'keyWrites': writable, 'lightingRead': lighting, 'lightingWrite': lighting and self._binding() is not None,
                                 'modeVisualSemanticsVerified': False}}

    def close(self):
        self.enabled = False
        result = {'connected': False, 'lightingRestored': True, 'keyRestored': True}
        if self.lease is not None:
            # An explicit close checks its owner in handle(); daemon shutdown owns cleanup.
            result['keyRecovery'] = self.abort(self.lease)
        if self.handle_device is not None:
            try:
                if self.modified_layers:
                    result['restoration'] = self.restore_lighting()
            except Exception as error:
                result.update(lightingRestored=False, restorationError=str(error), baselinePath=self.baseline_path)
            finally:
                try:
                    self.handle_device.close()
                finally:
                    self.handle_device, self.device = None, None
                    self.lease, self.lease_deadline, self.queued_event = None, None, None
                    self.key_backup_stored, self.key_backup_path = False, None
                    if result['lightingRestored']:
                        self.baseline, self.baseline_path = None, None
                        self.modified_layers.clear()
                        self.lighting_recovery_required = False
                    self.applied.clear()
        return result


def serve(bridge, source=sys.stdin, output=sys.stdout):
    for line in source:
        request_id = None
        try:
            request = json.loads(line)
            if isinstance(request, dict):
                request_id = request.get('id')
            result = bridge.handle(request)
            response = {'id': request_id, 'ok': True, 'result': result}
        except Exception as error:
            response = {'id': request_id, 'ok': False, 'error': str(error)}
        output.write(json.dumps(response, separators=(',', ':')) + '\n')
        output.flush()


def main():
    bridge = Bridge(backup_dir=os.environ.get('MINI_KEYBOARD_BACKUP_DIR'))
    def terminate(signum, frame):
        raise SystemExit(128 + signum)
    signal.signal(signal.SIGTERM, terminate)
    try:
        serve(bridge)
    finally:
        try:
            result = bridge.close()
            if not result['lightingRestored']:
                print('Companion exit restoration failed: ' + result['restorationError'], file=sys.stderr)
                raise SystemExit(1)
        except Exception as error:
            print(f'Companion exit restoration failed: {error}', file=sys.stderr)
            if bridge.handle_device is not None:
                bridge.handle_device.close()
            raise SystemExit(1)


if __name__ == '__main__':
    main()
