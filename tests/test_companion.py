"""Tests use a HID transport double; never open a physical USB device."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('bridge', Path(__file__).parents[1] / 'companion/bridge.py')
if SPEC and SPEC.loader and Path(SPEC.origin).exists():
    module = importlib.util.module_from_spec(SPEC)
    SPEC.loader.exec_module(module)
    Bridge = module.Bridge
else:
    Bridge = None


def packet(*prefix):
    return list(prefix) + [0] * (64 - len(prefix))


class FakeHID:
    def __init__(self, identity=(16, 3, 11)):
        self.identity = identity
        self.serial = 'FAKE-SERIAL-1'
        self.stale = False
        self.writes = []
        self.keys = [[packet(3, 250, action, layer, 1) for action in range(1, 26)] for layer in range(1, 4)]
        self.corrupt_key_read = False
        self.responses = []
        self.lighting = [list(bytes.fromhex('03fa01') + bytes([layer + 1, 2, 3]) * 16 + bytes(13)) for layer in range(3)]
        self.closed = False
        self.fail_next_led_read = False
        self.corrupt_after_write = False
        self.before_config_write = None

    def enumerate(self):
        return [dict(path=b'fake-vendor', vendor_id=0x514c, product_id=0x8850,
                     product_string='Mini Keyboard', serial_number=self.serial, usage_page=0xff00, usage=1),
                dict(path=b'fake-keyboard', vendor_id=0x514c, product_id=0x8850,
                     product_string='Mini Keyboard', usage_page=1, usage=6)]

    def open_path(self, path):
        if path != b'fake-vendor':
            raise AssertionError('must open vendor channel only')
        return self

    def write(self, report):
        self.writes.append(list(report))
        if self.stale:
            return -1
        if len(report) != 65 or report[0] != 3:
            raise AssertionError('hidapi requires report ID + 64 bytes')
        if report[1:4] == [251, 251, 251]:
            self.responses.append(packet(3, 251, *self.identity))
        elif report[1:3] == [250, 176]:
            if self.fail_next_led_read:
                self.fail_next_led_read = False
                self.responses.append([])
            else:
                self.responses.append(self.lighting[report[3]][:])
        elif report[1] == 250:
            count, layer = report[2], report[4]
            records = [record[:] for record in self.keys[layer - 1][:count]]
            if self.corrupt_key_read:
                records[0][9] ^= 255
            self.responses.extend(records)
        elif report[1:3] == [254, 176]:
            layer = report[3]
            self.lighting[layer] = [3, 250, report[4], *report[5:53], *([0] * 13)]
            if self.corrupt_after_write:
                self.corrupt_after_write = False
                self.lighting[layer][3] ^= 255
        elif report[1] == 253 and report[2:4] != [254, 255]:
            self.keys[report[3] - 1][report[2] - 1] = [3, 250, *report[2:51], *([0] * 13)]
            if self.before_config_write:
                self.before_config_write()
        return len(report)

    def read(self, size, timeout):
        return self.responses.pop(0) if self.responses else []

    def close(self):
        self.closed = True


class ReplugTransport:
    def __init__(self):
        self.current = FakeHID()
        self.path = b'fake-vendor'
        self.opens = []
        self.duplicate = False

    def enumerate(self):
        info = self.current.enumerate()[0]
        info['path'] = self.path
        return [info, dict(info, path=b'duplicate')] if self.duplicate else [info]

    def open_path(self, path):
        if path != self.path:
            raise AssertionError('unexpected selected path')
        self.opens.append(path)
        return self.current

    def replug(self, path=b'fake-vendor', serial='FAKE-SERIAL-1', identity=(16, 3, 11)):
        old = self.current
        old.stale = True
        self.current = FakeHID(identity)
        self.current.serial = serial
        self.current.lighting = [layer[:] for layer in old.lighting]
        self.path = path
        return old


class CompanionTests(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(Bridge, 'companion bridge is not implemented')
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.hid = FakeHID()
        self.bridge = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0)

    def command(self, command, **values):
        return self.bridge.handle(dict(command=command, **values))

    def open(self):
        return self.command('open')

    def rule(self, **changes):
        return dict(source='manual', state='working', layer=0, mode=1, color='#aabbcc', **changes)

    def test_vendor_selection_identification_and_raw_framing(self):
        self.assertEqual(len(self.command('list')), 1)
        info = self.open()
        self.assertEqual(info['identity'], [16, 3, 11])
        result = self.command('exchange', reportId=3, data=packet(251, 251, 251))
        self.assertEqual(result['reports'][0]['data'][:4], [251, 16, 3, 11])
        self.assertEqual(len(result['reports'][0]['data']), 63)

    def test_whitelist_rejects_model_firmware_and_unleased_writes(self):
        self.open()
        for data in [packet(252), packet(254, 176, 0, 1), packet(253, 1, 1), packet(170, 170), packet(250, 26, 3, 1), packet(251, 251, 251, 1)]:
            with self.assertRaises(ValueError):
                self.command('exchange', reportId=3, data=data)
        self.assertEqual(len(self.hid.writes), 1)

    def test_all_original_records_are_durable_before_first_write(self):
        self.open()
        self.command('begin', lease='transaction-1')
        def inspect_backup():
            files = list(Path(self.temp.name).glob('keys-*.json'))
            self.assertEqual(len(files), 1)
            saved = json.loads(files[0].read_text())
            self.assertEqual([len(layer) for layer in saved['layers']], [25, 25, 25])
            self.assertTrue(all(len(raw) == 128 for layer in saved['layers'] for raw in layer))
        self.hid.before_config_write = inspect_backup
        self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='transaction-1')
        self.assertTrue(self.command('status')['keyBackupStored'])
        self.assertEqual(len([w for w in self.hid.writes if w[1] == 250]), 3)
        self.command('exchange', reportId=3, data=packet(253, 2, 1, 1), lease='transaction-1')
        self.assertEqual(len(list(Path(self.temp.name).glob('keys-*.json'))), 1)

    def test_backup_failure_prevents_configuration_write(self):
        self.open()
        self.command('begin', lease='x')
        invalid = Path(self.temp.name) / 'not-a-directory'
        invalid.write_text('blocked')
        self.bridge.backup_dir = invalid
        with self.assertRaises(OSError):
            self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='x')
        self.assertFalse(any(w[1] == 253 for w in self.hid.writes))

    def test_unknown_legacy_firmware_cannot_write(self):
        self.hid.identity = (16, 3, 1)
        self.open()
        self.command('begin', lease='x')
        with self.assertRaises(ValueError):
            self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='x')
        self.assertFalse(self.command('status')['capabilities']['keyWrites'])

    def test_disabled_rules_preview_without_hid(self):
        self.command('configure', rules=[self.rule()], enabled=False)
        result = self.command('state', event=dict(version=1, source='manual', state='working'))
        self.assertTrue(result['preview'])
        self.assertEqual(result['desired']['colors'], ['#aabbcc'] * 16)
        self.assertEqual(self.hid.writes, [])

    def test_rule_match_respects_app_id_and_event_schema(self):
        self.command('configure', rules=[self.rule(appId='com.example.editor')], enabled=False)
        self.assertFalse(self.command('state', event=dict(version=1, source='manual', appId='com.example.other', state='working'))['matched'])
        for event in [dict(version=2, source='manual', state='working'), dict(version=1, source='manual'), dict(version=1, source='manual', state='working', occurredAt='bad')]:
            with self.assertRaises(ValueError):
                self.command('state', event=event)
        self.assertTrue(self.command('state', event=dict(version=1, source='manual', appId='com.example.editor', state='working'))['matched'])

    def test_write_has_original_baseline_readback_and_duplicate_suppression(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        event = dict(version=1, source='manual', state='working')
        first = self.command('state', event=event)
        self.assertTrue(first['verified'])
        saved = json.loads(Path(self.command('status')['baselinePath']).read_text())
        self.assertEqual(len(saved['raw']), 3)
        self.assertEqual(saved['raw'][0][:12], '03fa01010203')
        before = len(self.hid.writes)
        second = self.command('state', event=event)
        self.assertFalse(second['changed'])
        self.assertEqual(len(self.hid.writes), before)
        self.assertEqual(self.hid.lighting[0][2:6], [1, 170, 187, 204])

    def test_readback_failure_restores_original_and_disables_automation(self):
        self.open()
        original = self.hid.lighting[0][:]
        self.command('configure', rules=[self.rule()], enabled=True)
        self.hid.corrupt_after_write = True
        with self.assertRaisesRegex(ValueError, 'restored'):
            self.command('state', event=dict(version=1, source='manual', state='working'))
        self.assertEqual(self.hid.lighting[0], original)
        self.assertFalse(self.command('status')['rulesEnabled'])

    def test_key_lease_queues_latest_state_until_end(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('begin', lease='x')
        before = len(self.hid.writes)
        self.assertTrue(self.command('state', event=dict(version=1, source='manual', state='working'))['queued'])
        self.assertEqual(len(self.hid.writes), before)
        with self.assertRaises(ValueError):
            self.command('exchange', reportId=3, data=packet(251, 251, 251))
        result = self.command('end', lease='x')
        self.assertTrue(result['queuedResult']['verified'])
        self.assertFalse(self.command('status')['leaseActive'])

    def test_restore_lighting_verifies_all_layers_and_disables(self):
        self.open()
        original = [layer[:] for layer in self.hid.lighting]
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        result = self.command('restoreLighting')
        self.assertTrue(result['verified'])
        self.assertEqual(self.hid.lighting, original)
        self.assertFalse(self.command('status')['rulesEnabled'])

    def test_end_preserves_successful_key_transaction_when_queued_led_fails(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('begin', lease='x')
        self.command('state', event=dict(version=1, source='manual', state='working'))
        self.hid.corrupt_after_write = True
        result = self.command('end', lease='x')
        self.assertIn('error', result['queuedResult'])
        self.assertFalse(result['leaseActive'])

    def test_close_restores_modified_lighting_and_reports_failed_restore(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        self.hid.corrupt_after_write = True
        result = self.command('close')
        self.assertFalse(result['lightingRestored'])
        self.assertIn('restorationError', result)
        self.assertTrue(Path(result['baselinePath']).exists())
        self.assertTrue(self.hid.closed)
        self.assertFalse(self.command('status')['connected'])

    def test_led_baseline_failure_prevents_led_write(self):
        self.open()
        invalid = Path(self.temp.name) / 'not-a-directory'
        invalid.write_text('blocked')
        self.bridge.backup_dir = invalid
        self.command('configure', rules=[self.rule()], enabled=True)
        with self.assertRaises(OSError):
            self.command('state', event=dict(version=1, source='manual', state='working'))
        self.assertFalse(any(w[1] == 254 for w in self.hid.writes))

    def test_failed_or_duplicate_key_capture_blocks_writes(self):
        self.open()
        self.command('begin', lease='x')
        original_write = self.hid.write
        def duplicate(report):
            result = original_write(report)
            if report[1] == 250:
                self.hid.responses[-1] = self.hid.responses[-2][:]
            return result
        self.hid.write = duplicate
        with self.assertRaises(ValueError):
            self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='x')
        self.assertFalse(any(w[1] == 253 for w in self.hid.writes))

    def test_unverified_identity_cannot_write_lighting(self):
        self.hid.identity = (12, 3, 11)
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        with self.assertRaises(ValueError):
            self.command('state', event=dict(version=1, source='manual', state='working'))
        self.assertFalse(any(w[1] == 254 for w in self.hid.writes))

    def test_expired_orphan_can_recover_but_live_lease_is_protected(self):
        now = [0.0]
        self.bridge = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0,
                             lease_timeout=10, clock=lambda: now[0])
        self.open()
        self.command('begin', lease='owner')
        with self.assertRaises(ValueError):
            self.command('recover')
        with self.assertRaises(ValueError):
            self.command('abort', lease='other-tab')
        now[0] = 8
        self.command('exchange', reportId=3, data=packet(251, 251, 251), lease='owner')
        now[0] = 11
        self.assertFalse(self.command('status')['recoveryAvailable'])
        now[0] = 19
        self.assertTrue(self.command('status')['recoveryAvailable'])
        result = self.command('recover')
        self.assertFalse(result['leaseActive'])
        self.assertFalse(any(w[1] == 253 for w in self.hid.writes))
        self.open()

    def test_abort_rolls_back_durable_key_baseline_before_releasing(self):
        self.open()
        original = json.loads(json.dumps(self.hid.keys))
        self.command('begin', lease='owner')
        self.command('exchange', reportId=3, data=packet(253, 1, 1, 1, 0, 1, 0, 0, 7), lease='owner')
        self.assertNotEqual(self.hid.keys, original)
        self.assertTrue(self.command('status')['keyWritePending'])
        result = self.command('abort', lease='owner')
        self.assertTrue(result['keyRestored'])
        self.assertEqual(self.hid.keys, original)
        self.assertFalse(self.command('status')['leaseActive'])
        self.assertEqual(self.command('abort', lease='owner'), result)

    def test_abort_primes_timing_and_inactive_entries_for_media_baseline(self):
        self.open()
        self.hid.keys[1][19][4:7] = [2, 1, 2]
        original = json.loads(json.dumps(self.hid.keys))
        write = self.hid.write
        def firmware(report):
            if report[1] != 253 or report[2:4] == [254, 255]:
                return write(report)
            old = self.hid.keys[report[3] - 1][report[2] - 1][:]
            result = write(report)
            record = self.hid.keys[report[3] - 1][report[2] - 1]
            if record[4] != 1:
                record[5] = old[5]
            end = 7 + record[6] * 3
            record[end:51] = old[end:51]
            return result
        self.hid.write = firmware
        self.command('begin', lease='owner')
        self.command('exchange', reportId=3, data=packet(253, 20, 2, 1, 0, 1, 0, 0, 5), lease='owner')
        self.assertEqual(self.hid.keys[1][19][5], 0)
        self.assertTrue(self.command('abort', lease='owner')['keyRestored'])
        self.assertEqual(self.hid.keys, original)

    def test_failed_key_rollback_keeps_lease_and_backup_for_retry(self):
        self.open()
        self.command('begin', lease='owner')
        self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='owner')
        self.hid.corrupt_key_read = True
        with self.assertRaisesRegex(ValueError, 'rollback'):
            self.command('abort', lease='owner')
        status = self.command('status')
        self.assertTrue(status['leaseActive'])
        self.assertTrue(Path(status['keyBackupPath']).exists())
        self.hid.corrupt_key_read = False
        self.assertTrue(self.command('abort', lease='owner')['keyRestored'])

    def test_end_ack_retry_is_idempotent_without_disturbing_new_owner(self):
        self.open()
        self.command('begin', lease='first')
        result = self.command('end', lease='first')
        self.assertEqual(self.command('end', lease='first'), result)
        self.command('begin', lease='second')
        with self.assertRaises(ValueError):
            self.command('end', lease='first')
        self.assertTrue(self.command('status')['leaseActive'])
        self.command('abort', lease='second')
        self.assertFalse(self.command('abort', lease='unknown-not-accepted')['leaseActive'])

    def test_close_with_owner_token_and_shutdown_restore_unfinished_keys(self):
        for shutdown in (False, True):
            with self.subTest(shutdown=shutdown):
                self.open()
                original = json.loads(json.dumps(self.hid.keys))
                self.command('begin', lease='owner-' + str(shutdown))
                self.command('exchange', reportId=3, data=packet(253, 1, 1, 1, 0, 1, 0, 0, 8), lease='owner-' + str(shutdown))
                with self.assertRaises(ValueError):
                    self.command('close')
                result = self.bridge.close() if shutdown else self.command('close', lease='owner-' + str(shutdown))
                self.assertTrue(result['keyRestored'])
                self.assertEqual(self.hid.keys, original)
                self.assertTrue(self.hid.closed)

    def test_failed_led_close_can_reopen_and_restore_original_baseline(self):
        self.open()
        original = [layer[:] for layer in self.hid.lighting]
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        self.hid.corrupt_after_write = True
        self.assertFalse(self.command('close')['lightingRestored'])
        self.open()
        self.assertTrue(self.command('status')['lightingRecoveryRequired'])
        self.command('restoreLighting')
        self.assertEqual(self.hid.lighting, original)

    def test_restarted_daemon_requires_restoring_pending_led_baseline(self):
        self.open()
        original = [layer[:] for layer in self.hid.lighting]
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        # Simulate loss of the daemon without its graceful close/finally.
        self.bridge = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0)
        self.open()
        self.assertTrue(self.command('status')['lightingRecoveryRequired'])
        self.command('configure', rules=[self.rule()], enabled=True)
        before = len(self.hid.writes)
        with self.assertRaisesRegex(ValueError, 'restoreLighting'):
            self.command('state', event=dict(version=1, source='manual', state='working'))
        self.assertEqual(len(self.hid.writes), before)
        self.command('restoreLighting')
        self.assertEqual(self.hid.lighting, original)

    def test_corrupt_durable_key_backup_blocks_abort_writes(self):
        self.open()
        self.command('begin', lease='owner')
        self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='owner')
        path = Path(self.command('status')['keyBackupPath'])
        saved = json.loads(path.read_text())
        saved['layers'][2][24] = 'invalid'
        path.write_text(json.dumps(saved))
        writes = len(self.hid.writes)
        with self.assertRaisesRegex(ValueError, 'rollback'):
            self.command('abort', lease='owner')
        self.assertEqual(len(self.hid.writes), writes)
        self.assertTrue(self.command('status')['leaseActive'])

    def test_pending_lighting_is_bound_to_serial_number(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        self.hid.serial = 'DIFFERENT-DEVICE'
        other = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0)
        other.handle({'command': 'open'})
        self.assertFalse(other.handle({'command': 'status'})['lightingRecoveryRequired'])
        with self.assertRaisesRegex(ValueError, 'no lighting baseline'):
            other.handle({'command': 'restoreLighting'})
        self.hid.serial = 'FAKE-SERIAL-1'
        resumed = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0)
        resumed.handle({'command': 'open'})
        self.assertTrue(resumed.handle({'command': 'status'})['lightingRecoveryRequired'])

    def test_device_without_serial_cannot_start_led_writes(self):
        self.hid.serial = ''
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        with self.assertRaisesRegex(ValueError, 'serial'):
            self.command('state', event=dict(version=1, source='manual', state='working'))
        self.assertFalse(any(w[1] == 254 for w in self.hid.writes))

    def test_direct_lighting_apply_preserves_rules_and_enabled_setting(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        rules = self.bridge.rules[:]
        result = self.command('setLighting', layer=2, mode=4, color='#123456')
        self.assertTrue(result['verified'])
        self.assertEqual(self.hid.lighting[2][2:6], [4, 18, 52, 86])
        self.assertEqual(self.bridge.rules, rules)
        self.assertTrue(self.command('status')['rulesEnabled'])
        self.assertIsNone(self.command('status')['lastEvent'])
        self.assertTrue(Path(self.command('status')['baselinePath']).exists())

    def test_direct_lighting_is_lease_guarded_and_validates_before_hid(self):
        self.open()
        before = len(self.hid.writes)
        for values in [dict(layer=3, mode=1, color='#123456'), dict(layer=0, mode=6, color='#123456'), dict(layer=0, mode=1, colors=['#123456'])]:
            with self.assertRaises(ValueError):
                self.command('setLighting', **values)
        self.command('begin', lease='owner')
        with self.assertRaises(ValueError):
            self.command('setLighting', layer=0, mode=1, color='#123456')
        self.assertEqual(len(self.hid.writes), before)

    def profile_layer(self, layer=0, mode=1, color='#123456'):
        return {'layer': layer, 'mode': mode, 'colors': [color] * 16}

    def test_profile_led_batch_validates_every_entry_before_hid(self):
        self.open()
        before = len(self.hid.writes)
        valid = self.profile_layer()
        for layers in [[], [valid, self.profile_layer(3)], [valid, valid], [dict(valid, unexpected=True)], [dict(valid, colors=['#123456'])]]:
            with self.assertRaises(ValueError):
                self.command('saveProfileLighting', layers=layers)
        with self.assertRaises(ValueError):
            self.command('saveProfileLighting', layers=[valid], color='#123456')
        self.command('begin', lease='owner')
        with self.assertRaises(ValueError):
            self.command('saveProfileLighting', layers=[valid])
        self.assertEqual(len(self.hid.writes), before)

    def test_profile_led_save_survives_close_while_other_state_layer_restores(self):
        self.open()
        original = [layer[:] for layer in self.hid.lighting]
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        rules = self.bridge.rules[:]
        old_path = self.bridge.baseline_path
        result = self.command('saveProfileLighting', layers=[self.profile_layer(1, 2, '#112233')])
        self.assertTrue(result['persisted'])
        self.assertTrue(result['verified'])
        self.assertEqual(self.bridge.modified_layers, {0})
        self.assertEqual(self.bridge.rules, rules)
        self.assertTrue(self.bridge.enabled)
        self.assertTrue(Path(old_path).exists())
        self.assertNotEqual(old_path, self.bridge.baseline_path)
        self.command('close')
        self.assertEqual(self.hid.lighting[0], original[0])
        self.assertEqual(self.hid.lighting[1][2:6], [2, 17, 34, 51])
        self.assertEqual(self.hid.lighting[2], original[2])

    def test_profile_led_promotes_already_applied_temporary_layer(self):
        self.open()
        self.command('setLighting', layer=0, mode=1, color='#123456')
        self.command('saveProfileLighting', layers=[self.profile_layer()])
        self.assertEqual(self.bridge.modified_layers, set())
        self.command('close')
        self.assertEqual(self.hid.lighting[0][2:6], [1, 18, 52, 86])

    def test_profile_led_batch_failure_restores_immediate_before_and_rules(self):
        self.open()
        self.command('configure', rules=[self.rule()], enabled=True)
        self.command('state', event=dict(version=1, source='manual', state='working'))
        before = [layer[:] for layer in self.hid.lighting]
        old_path = self.bridge.baseline_path
        write = self.hid.write
        def fail_second_layer(report):
            if report[1:4] == [254, 176, 1] and report[5:8] == [68, 85, 102]:
                self.hid.corrupt_after_write = True
            return write(report)
        self.hid.write = fail_second_layer
        with self.assertRaisesRegex(ValueError, 'batch.*restored'):
            self.command('saveProfileLighting', layers=[self.profile_layer(0, 2), self.profile_layer(1, 2, '#445566')])
        self.assertEqual(self.hid.lighting, before)
        self.assertEqual(self.bridge.baseline_path, old_path)
        self.assertEqual(self.bridge.modified_layers, {0})
        self.assertFalse(self.bridge.lighting_recovery_required)
        self.assertTrue(self.bridge.enabled)

    def test_profile_led_durable_promotion_failure_rolls_back_before_cleanup(self):
        self.open()
        self.command('setLighting', layer=2, mode=1, color='#aabbcc')
        before = [layer[:] for layer in self.hid.lighting]
        original_persist = self.bridge._persist
        lighting_files = [0]
        def fail_promotion(kind, value):
            if kind == 'lighting':
                lighting_files[0] += 1
                if lighting_files[0] == 2:
                    raise OSError('disk failure during promotion')
            return original_persist(kind, value)
        self.bridge._persist = fail_promotion
        with self.assertRaisesRegex(ValueError, 'disk failure'):
            self.command('saveProfileLighting', layers=[self.profile_layer()])
        self.assertEqual(self.hid.lighting, before)
        self.assertEqual(self.bridge.modified_layers, {2})

    def test_profile_led_pending_journal_reopen_preserves_saved_and_restores_temporary(self):
        self.open()
        original = [layer[:] for layer in self.hid.lighting]
        self.command('setLighting', layer=2, mode=1, color='#aabbcc')
        self.command('saveProfileLighting', layers=[self.profile_layer(0, 3, '#112233')])
        self.bridge = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0)
        self.open()
        self.assertTrue(self.bridge.lighting_recovery_required)
        self.command('restoreLighting')
        self.assertEqual(self.hid.lighting[0][2:6], [3, 17, 34, 51])
        self.assertEqual(self.hid.lighting[2], original[2])

    def test_profile_led_promotion_keeps_original_raw_tail_bytes(self):
        self.open()
        self.hid.lighting[0][51:] = list(range(13))
        self.command('saveProfileLighting', layers=[self.profile_layer()])
        raw = bytes.fromhex(self.bridge.baseline['raw'][0])
        self.assertEqual(raw[51:], bytes(range(13)))

    def test_profile_led_journal_commit_failure_never_clears_cleanup_flags(self):
        self.open()
        self.command('setLighting', layer=2, mode=1, color='#aabbcc')
        before = [layer[:] for layer in self.hid.lighting]
        original_path = self.bridge.baseline_path
        save = self.bridge._save_lighting_journal
        failed = [False]
        def fail_commit(**kwargs):
            if kwargs.get('pending_layers') == {2} and kwargs.get('baseline_path') != original_path and not failed[0]:
                self.assertEqual(self.bridge.modified_layers, {0, 2})
                self.assertEqual(self.bridge.batch_session_baseline[1], original_path)
                failed[0] = True
                raise OSError('journal promotion failed')
            return save(**kwargs)
        self.bridge._save_lighting_journal = fail_commit
        with self.assertRaisesRegex(ValueError, 'journal promotion failed'):
            self.command('saveProfileLighting', layers=[self.profile_layer()])
        self.assertEqual(self.hid.lighting, before)
        self.assertEqual(self.bridge.baseline_path, original_path)
        self.assertEqual(self.bridge.modified_layers, {2})
        self.assertFalse(self.bridge.lighting_recovery_required)

    def test_profile_led_failed_rollback_reopen_retains_original_session_recovery(self):
        self.open()
        original = [layer[:] for layer in self.hid.lighting]
        self.command('setLighting', layer=0, mode=1, color='#aabbcc')
        write = self.hid.write
        def fail_batch_and_rollback(report):
            if report[1:4] == [254, 176, 1] and report[5:8] == [68, 85, 102]:
                self.hid.corrupt_after_write = True
            if report[1:4] == [254, 176, 0] and report[5:8] == [170, 187, 204]:
                self.hid.corrupt_after_write = True
            return write(report)
        self.hid.write = fail_batch_and_rollback
        with self.assertRaisesRegex(ValueError, 'recovery required'):
            self.command('saveProfileLighting', layers=[self.profile_layer(0, 2), self.profile_layer(1, 2, '#445566')])
        self.assertTrue(self.bridge.lighting_recovery_required)
        self.hid.write = write
        self.bridge = Bridge(transport=self.hid, backup_dir=self.temp.name, delay=0)
        self.open()
        self.assertTrue(self.bridge.lighting_recovery_required)
        self.assertIsNotNone(self.bridge.batch_session_baseline)
        self.command('restoreLighting')
        self.assertEqual(self.hid.lighting, original)
        self.assertIsNone(self.bridge.batch_session_baseline)

    def test_profile_led_expected_device_rejects_mismatch_before_hid(self):
        self.open()
        binding = dict(vendorId=0x514c, productId=0x8850, identity=[16, 3, 11], serialNumber='FAKE-SERIAL-1')
        before = len(self.hid.writes)
        for expected in [None, dict(binding, serialNumber='OTHER'), dict(binding, serialNumber=''),
                         dict(binding, identity=[16, '3', 11]), dict(binding, vendorId='20812'),
                         dict(binding, pathHex='unexpected'), dict(binding, identity=[16, 3, True])]:
            with self.subTest(expected=expected):
                with self.assertRaises(ValueError):
                    self.command('saveProfileLighting', layers=[self.profile_layer()], expectedDevice=expected)
        self.assertEqual(len(self.hid.writes), before)
        result = self.command('saveProfileLighting', layers=[self.profile_layer()], expectedDevice=binding)
        self.assertTrue(result['persisted'])
        self.assertTrue(result['verified'])

    def test_begin_expected_device_validates_atomically_before_lease(self):
        self.open()
        binding = dict(vendorId=0x514c, productId=0x8850, identity=[16, 3, 11], serialNumber='FAKE-SERIAL-1')
        before = len(self.hid.writes)
        for expected in [None, dict(binding, serialNumber='OTHER'), dict(binding, identity=[16, 3, True]), dict(binding, extra=True)]:
            with self.subTest(expected=expected):
                with self.assertRaises(ValueError):
                    self.command('begin', lease='owner', expectedDevice=expected)
                self.assertFalse(self.bridge.status()['leaseActive'])
        self.assertEqual(len(self.hid.writes), before)
        result = self.command('begin', lease='owner', expectedDevice=binding)
        self.assertTrue(result['leaseActive'])
        self.assertEqual(len(self.hid.writes), before)
        self.command('end', lease='owner')

    def test_begin_expected_device_supports_empty_serial_for_generic_key_devices(self):
        self.hid.serial = ''
        self.open()
        binding = dict(vendorId=0x514c, productId=0x8850, identity=[16, 3, 11], serialNumber='')
        before = len(self.hid.writes)
        self.assertTrue(self.command('begin', lease='owner', expectedDevice=binding)['leaseActive'])
        self.assertEqual(len(self.hid.writes), before)
        self.command('end', lease='owner')
        with self.assertRaises(ValueError):
            self.command('begin', lease='other', expectedDevice=dict(binding, serialNumber=None))
        self.assertFalse(self.bridge.status()['leaseActive'])

    def test_idle_open_probes_healthy_handle_and_reopens_stale_same_device(self):
        for path in (b'fake-vendor', b'new-vendor-path'):
            with self.subTest(path=path):
                transport = ReplugTransport()
                bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
                bridge.handle({'command': 'open'})
                before = len(transport.current.writes)
                bridge.handle({'command': 'open'})
                self.assertEqual(len(transport.current.writes), before + 1)
                self.assertEqual(len(transport.opens), 1)
                old = transport.replug(path=path)
                info = bridge.handle({'command': 'open'})
                self.assertEqual(info['pathHex'], path.hex())
                self.assertEqual(info['identity'], [16, 3, 11])
                self.assertTrue(old.closed)
                self.assertEqual(len(transport.opens), 2)
                self.assertTrue(all(report[1:4] == [251, 251, 251] for report in transport.current.writes))

    def test_stale_reopen_rejects_other_serial_identity_or_duplicate_interface(self):
        for change in ('serial', 'identity', 'duplicate', 'empty_serial'):
            with self.subTest(change=change):
                transport = ReplugTransport()
                bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
                if change == 'empty_serial':
                    transport.current.serial = ''
                bridge.handle({'command': 'open'})
                transport.replug(serial='OTHER' if change == 'serial' else 'FAKE-SERIAL-1',
                                 identity=(12, 3, 11) if change == 'identity' else (16, 3, 11))
                transport.duplicate = change == 'duplicate'
                with self.assertRaises(ValueError):
                    bridge.handle({'command': 'open'})
                self.assertFalse(bridge.status()['connected'])
                self.assertFalse(any(report[1] in (253, 254) for report in transport.current.writes))

    def test_stale_reopen_keeps_original_led_recovery_and_rules(self):
        transport = ReplugTransport()
        bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
        bridge.handle({'command': 'open'})
        bridge.handle({'command': 'configure', 'enabled': True, 'rules': [self.rule()]})
        bridge.handle({'command': 'state', 'event': {'version': 1, 'source': 'manual', 'state': 'working'}})
        baseline, baseline_path = bridge.baseline, bridge.baseline_path
        journal = bridge._journal_path().read_text()
        transport.replug(path=b'new-vendor-path')
        bridge.handle({'command': 'open'})
        self.assertEqual(bridge.baseline, baseline)
        self.assertEqual(bridge.baseline_path, baseline_path)
        self.assertEqual(bridge._journal_path().read_text(), journal)
        self.assertTrue(bridge.lighting_recovery_required)
        self.assertTrue(bridge.enabled)
        self.assertEqual(bridge.rules[0]['state'], 'working')
        with self.assertRaisesRegex(ValueError, 'restoreLighting'):
            bridge.handle({'command': 'setLighting', 'layer': 0, 'mode': 1, 'color': '#112233'})
        self.assertFalse(any(report[1] == 254 for report in transport.current.writes))
        bridge.handle({'command': 'restoreLighting'})
        self.assertEqual(transport.current.lighting[0][3:6], [1, 2, 3])

    def test_open_never_rebinds_active_or_uncertain_key_transaction(self):
        self.open()
        before = len(self.hid.writes)
        self.command('begin', lease='owner')
        with self.assertRaises(ValueError):
            self.open()
        self.command('end', lease='owner')
        self.bridge.key_write_pending = True
        with self.assertRaises(ValueError):
            self.open()
        self.assertEqual(len(self.hid.writes), before)

    def test_configuration_failure_does_not_reopen_or_replay_on_new_handle(self):
        transport = ReplugTransport()
        bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
        bridge.handle({'command': 'open'})
        bridge.handle({'command': 'setLighting', 'layer': 0, 'mode': 1, 'color': '#123456'})
        transport.replug()
        with self.assertRaises(ValueError):
            bridge.handle({'command': 'setLighting', 'layer': 0, 'mode': 2, 'color': '#aabbcc'})
        self.assertEqual(len(transport.opens), 1)
        self.assertEqual(transport.current.writes, [])
        self.assertTrue(bridge.lighting_recovery_required)

    def test_closed_handle_exception_rebinds_but_identity_mismatch_does_not(self):
        transport = ReplugTransport()
        bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
        bridge.handle({'command': 'open'})
        old = transport.replug(path=b'new-vendor-path')
        def closed_write(report):
            raise ValueError('device not open')
        old.write = closed_write
        self.assertEqual(bridge.handle({'command': 'open'})['pathHex'], b'new-vendor-path'.hex())
        self.assertEqual(len(transport.opens), 2)
        self.assertFalse(any(report[1] in (253, 254) for report in transport.current.writes))
        transport.current.identity = (12, 3, 11)
        with self.assertRaisesRegex(ValueError, 'identity changed'):
            bridge.handle({'command': 'open'})
        self.assertEqual(len(transport.opens), 2)
        self.assertFalse(bridge.status()['connected'])

    def test_failed_stale_rebind_retains_recovery_until_original_device_returns(self):
        transport = ReplugTransport()
        bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
        bridge.handle({'command': 'open'})
        bridge.handle({'command': 'setLighting', 'layer': 0, 'mode': 1, 'color': '#123456'})
        baseline_path = bridge.baseline_path
        transport.replug(serial='OTHER')
        with self.assertRaises(ValueError):
            bridge.handle({'command': 'open'})
        status = bridge.status()
        self.assertFalse(status['connected'])
        self.assertFalse(status['capabilities']['lightingWrite'])
        self.assertTrue(status['lightingRecoveryRequired'])
        self.assertEqual(status['baselinePath'], baseline_path)
        result = bridge.handle({'command': 'close'})
        self.assertFalse(result['lightingRestored'])
        self.assertEqual(result['baselinePath'], baseline_path)
        transport.replug(path=b'original-returned')
        bridge.handle({'command': 'open'})
        self.assertTrue(bridge.lighting_recovery_required)
        bridge.handle({'command': 'restoreLighting'})
        self.assertEqual(transport.current.lighting[0][3:6], [1, 2, 3])

    def test_status_uses_one_enumeration_without_hid_probe(self):
        self.open()
        enumerations = []
        enumerate_devices = self.hid.enumerate
        def enumerate_once():
            enumerations.append(True)
            return enumerate_devices()
        def no_hid(*args):
            raise AssertionError('status must not issue HID commands')
        self.hid.enumerate = enumerate_once
        self.hid.write = no_hid
        self.hid.read = no_hid
        self.assertTrue(self.bridge.status()['connected'])
        self.assertEqual(len(enumerations), 1)

    def test_status_detects_unplug_without_hid_and_requires_explicit_reopen(self):
        transport = ReplugTransport()
        bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
        original = bridge.handle({'command': 'open'}).copy()
        first = bridge.status()
        old = transport.current
        writes = len(old.writes)
        enumerate_devices = transport.enumerate
        transport.enumerate = lambda: []
        lost = bridge.status()
        self.assertFalse(lost['connected'])
        self.assertFalse(lost['devicePresent'])
        self.assertEqual(lost['connectionState'], 'disconnected')
        self.assertGreater(lost['connectionRevision'], first['connectionRevision'])
        self.assertEqual(lost['device'], original)
        self.assertEqual(len(old.writes), writes)
        self.assertTrue(old.closed)
        self.assertEqual(bridge.status()['connectionRevision'], lost['connectionRevision'])
        transport.enumerate = enumerate_devices
        transport.replug(path=b'new-path')
        self.assertFalse(bridge.status()['connected'])
        self.assertFalse(bridge.status()['devicePresent'])
        self.assertEqual(transport.current.writes, [])
        bridge.handle({'command': 'open'})
        restored = bridge.status()
        self.assertTrue(restored['connected'])
        self.assertTrue(restored['devicePresent'])
        self.assertGreater(restored['connectionRevision'], lost['connectionRevision'])
        self.assertTrue(all(report[1:4] == [251, 251, 251] for report in transport.current.writes))

    def test_status_rejects_same_path_with_changed_vendor_product_or_serial(self):
        for field, value in [('vendor_id', 0x1189), ('product_id', 0x8830), ('serial_number', 'OTHER')]:
            with self.subTest(field=field):
                hid = FakeHID()
                bridge = Bridge(transport=hid, backup_dir=self.temp.name, delay=0)
                original = bridge.handle({'command': 'open'}).copy()
                info = hid.enumerate()[0]
                hid.enumerate = lambda: [dict(info, **{field: value})]
                before = len(hid.writes)
                status = bridge.status()
                self.assertFalse(status['connected'])
                self.assertFalse(status['devicePresent'])
                self.assertEqual(status['device'], original)
                self.assertEqual(len(hid.writes), before)
                self.assertFalse(status['capabilities']['keyWrites'])
                self.assertFalse(status['capabilities']['lightingWrite'])

    def test_status_unplug_preserves_active_key_and_led_recovery(self):
        self.open()
        self.command('setLighting', layer=0, mode=1, color='#112233')
        self.command('begin', lease='owner')
        self.command('exchange', reportId=3, data=packet(253, 1, 1, 1), lease='owner')
        baseline, key_backup = self.bridge.baseline_path, self.bridge.key_backup_path
        journal = self.bridge._journal_path().read_bytes()
        self.hid.enumerate = lambda: []
        before = len(self.hid.writes)
        status = self.bridge.status()
        self.assertFalse(status['connected'])
        self.assertTrue(status['leaseActive'])
        self.assertTrue(status['keyWritePending'])
        self.assertTrue(status['keyBackupStored'])
        self.assertTrue(status['lightingRecoveryRequired'])
        self.assertEqual(status['baselinePath'], baseline)
        self.assertEqual(status['keyBackupPath'], key_backup)
        self.assertTrue(Path(key_backup).exists())
        self.assertEqual(self.bridge._journal_path().read_bytes(), journal)
        self.assertEqual(self.bridge.modified_layers, {0})
        self.assertEqual(len(self.hid.writes), before)
        with self.assertRaises(ValueError):
            self.open()
        with self.assertRaises(ValueError):
            self.command('abort', lease='owner')
        self.assertTrue(self.bridge.status()['leaseActive'])
        self.assertTrue(self.bridge.status()['keyWritePending'])

    def test_explicit_key_recovery_rebinds_original_after_unplug(self):
        for recovery in ('abort', 'recover'):
            with self.subTest(recovery=recovery):
                transport = ReplugTransport()
                now = [0.0]
                bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0,
                                lease_timeout=10, clock=lambda: now[0])
                bridge.handle({'command': 'open'})
                original = json.loads(json.dumps(transport.current.keys))
                bridge.handle({'command': 'begin', 'lease': 'owner'})
                bridge.handle({'command': 'exchange', 'reportId': 3,
                               'data': packet(253, 1, 1, 1, 0, 1, 0, 0, 7), 'lease': 'owner'})
                changed = json.loads(json.dumps(transport.current.keys))
                backup = bridge.key_backup_path
                enumerate_devices = transport.enumerate
                transport.enumerate = lambda: []
                self.assertFalse(bridge.status()['connected'])
                transport.enumerate = enumerate_devices
                transport.replug(path=b'returned-original')
                transport.current.keys = changed
                # Neither another tab nor an early expiry recovery may reopen USB.
                with self.assertRaises(ValueError):
                    bridge.handle({'command': 'abort', 'lease': 'other'})
                with self.assertRaises(ValueError):
                    bridge.handle({'command': 'recover'})
                self.assertEqual(transport.current.writes, [])
                if recovery == 'recover':
                    now[0] = 11
                result = bridge.handle({'command': recovery, **({'lease': 'owner'} if recovery == 'abort' else {})})
                self.assertTrue(result['keyRestored'])
                self.assertFalse(bridge.status()['leaseActive'])
                self.assertFalse(bridge.key_write_pending)
                self.assertEqual(transport.current.keys, original)
                self.assertEqual(bridge.device['pathHex'], b'returned-original'.hex())
                self.assertEqual(result['keyBackupPath'], backup)
                self.assertEqual(transport.current.writes[0][1:4], [251, 251, 251])
                self.assertFalse(any(report[1] == 254 for report in transport.current.writes))

    def test_explicit_key_recovery_handles_fast_same_path_replug_without_status(self):
        for recovery, closed_exception in [('abort', False), ('recover', False), ('abort', True)]:
            with self.subTest(recovery=recovery, closed_exception=closed_exception):
                transport = ReplugTransport()
                now = [0.0]
                bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0,
                                lease_timeout=10, clock=lambda: now[0])
                bridge.handle({'command': 'open'})
                original = json.loads(json.dumps(transport.current.keys))
                bridge.handle({'command': 'begin', 'lease': 'owner'})
                bridge.handle({'command': 'exchange', 'reportId': 3,
                               'data': packet(253, 1, 1, 1, 0, 1, 0, 0, 7), 'lease': 'owner'})
                changed = json.loads(json.dumps(transport.current.keys))
                old = transport.replug()
                transport.current.keys = changed
                if closed_exception:
                    def not_open(report):
                        raise ValueError('device not open')
                    old.write = not_open
                # No absent status observation: enumeration still sees the old path.
                self.assertIs(bridge.handle_device, old)
                if recovery == 'recover':
                    now[0] = 11
                result = bridge.handle({'command': recovery, **({'lease': 'owner'} if recovery == 'abort' else {})})
                self.assertTrue(result['keyRestored'])
                self.assertEqual(transport.current.keys, original)
                self.assertFalse(bridge.lease)
                self.assertEqual(len(transport.opens), 2)
                self.assertEqual(transport.current.writes[0][1:4], [251, 251, 251])

    def test_fast_replug_rollback_rejects_wrong_identity_without_configuration(self):
        transport = ReplugTransport()
        bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
        bridge.handle({'command': 'open'})
        bridge.handle({'command': 'begin', 'lease': 'owner'})
        bridge.handle({'command': 'exchange', 'reportId': 3, 'data': packet(253, 1, 1, 1), 'lease': 'owner'})
        transport.replug(identity=(12, 3, 11))
        with self.assertRaisesRegex(ValueError, 'identity'):
            bridge.handle({'command': 'abort', 'lease': 'owner'})
        self.assertTrue(bridge.lease)
        self.assertTrue(bridge.key_write_pending)
        self.assertFalse(any(report[1] in (253, 254) for report in transport.current.writes))

    def test_explicit_key_recovery_rejects_replacement_and_retains_retry(self):
        for mismatch in ('serial', 'identity'):
            with self.subTest(mismatch=mismatch):
                transport = ReplugTransport()
                bridge = Bridge(transport=transport, backup_dir=self.temp.name, delay=0)
                bridge.handle({'command': 'open'})
                bridge.handle({'command': 'begin', 'lease': 'owner'})
                bridge.handle({'command': 'exchange', 'reportId': 3, 'data': packet(253, 1, 1, 1), 'lease': 'owner'})
                backup = bridge.key_backup_path
                enumerate_devices = transport.enumerate
                transport.enumerate = lambda: []
                bridge.status()
                transport.enumerate = enumerate_devices
                transport.replug(path=b'replacement', serial='OTHER' if mismatch == 'serial' else 'FAKE-SERIAL-1',
                                 identity=(12, 3, 11) if mismatch == 'identity' else (16, 3, 11))
                with self.assertRaisesRegex(ValueError, 'rollback failed'):
                    bridge.handle({'command': 'abort', 'lease': 'owner'})
                self.assertTrue(bridge.lease)
                self.assertTrue(bridge.key_write_pending)
                self.assertEqual(bridge.key_backup_path, backup)
                self.assertFalse(any(report[1] in (253, 254) for report in transport.current.writes))
                transport.replug(path=b'original-again')
                self.assertTrue(bridge.handle({'command': 'abort', 'lease': 'owner'})['keyRestored'])

    def test_status_enumeration_failure_is_unknown_and_never_claims_connected(self):
        self.open()
        before = len(self.hid.writes)
        enumerate_devices = self.hid.enumerate
        def fail_enumeration():
            raise OSError('USB enumeration failed')
        self.hid.enumerate = fail_enumeration
        status = self.bridge.status()
        self.assertFalse(status['connected'])
        self.assertIsNone(status['devicePresent'])
        self.assertEqual(status['connectionState'], 'unknown')
        self.assertIn('enumeration', status['connectionError'])
        self.assertEqual(len(self.hid.writes), before)
        self.assertFalse(status['capabilities']['lightingRead'])
        self.hid.enumerate = enumerate_devices
        self.assertTrue(self.bridge.status()['connected'])
        self.assertEqual(len(self.hid.writes), before)

    def test_daemon_output_one_response_per_input_without_logs(self):
        source = io.StringIO('{"id":1,"command":"status"}\n{"id":2,"command":"invalid"}\nnot json\n')
        output = io.StringIO()
        module.serve(self.bridge, source, output)
        responses = [json.loads(line) for line in output.getvalue().splitlines()]
        self.assertEqual(len(responses), 3)
        self.assertEqual(set(responses[0]), {'id', 'ok', 'result'})
        self.assertFalse(responses[1]['ok'])
        self.assertIsNone(responses[2]['id'])


if __name__ == '__main__':
    unittest.main()
