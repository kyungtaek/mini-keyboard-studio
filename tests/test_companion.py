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
