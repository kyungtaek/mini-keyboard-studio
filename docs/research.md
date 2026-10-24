# 원본 앱과 장치 통신 조사

대상 `/Applications/MINI_KEYBOARD.app/Contents/MacOS/MINI_KEYBOARD`의 SHA-256은 `6f330a43fc9493d8f76e112b08c054d7c896a0d628d2e41bbfd701dbedfd6f4f`다. Qt 기반 x86_64 Mach-O이며 hidapi를 통해 설정용 인터페이스를 연다.

## REA 증거

REA `open_binary`와 `inspect_macho`를 사용했다. Mach-O 전체 관찰은 `ev_1298bb7113dbebf208dec6184961f7471559ed51be8aeea2542be9878a75606f`, 요약은 `ev_2df38a2b924548a335803574765dba6c72e9c67269a96c8df7607a0bd74df9f5`다. [보관된 증거](../evidence/rea-evidence.json)에 의존성·심볼·세그먼트 정보를 보관했다.

네이티브 디컴파일 요청은 엔진 미설치로 `provider_unavailable`이었다. Hopper 설치와 REA 설정 변경의 구체적 계획을 제시했으나 승인되지 않아 실행하지 않았다. 설정 파일·설치 앱은 수정하지 않았다. 아래 함수 본문은 `otool -tvV`의 어셈블리를 수동 해석한 결과이며 REA 디컴파일 결과로 표시하지 않는다. 원본 앱은 실행하지 않았다.

## 설정 구조

| 위치 | 관찰 |
|---|---|
| `Widget::Read_KeyBoard_KeyNum` `0x10003de10` | `03 FB FB FB` 식별, 65바이트 출력·64바이트 읽기 |
| `Widget::read_Hidkey_Data` `0x10003e610` | `03 FA` 레이어 읽기, 버전에 따른 레코드 처리 |
| `Widget::HID_write` `0x10003d590` | 원본 레코드 전송·마무리 명령·별도 RGB 경로 |
| `Widget::SetBasicKey` `0x100046370` | 새 형식에서 3바이트 엔트리의 키 사용값 저장 |
| `Widget::SetFunKey` `0x100046590` | 수정 키와 특수 키 처리 |
| `Widget::SetMousePage` `0x100046ed0` | 버튼·휠·이동 입력 저장 |
| `Widget::Set_Keyboard_Ver_SLOT` `0x10003cf40` | 영구 모델 선택 `03 FC FC ...`; 재구현에서 전송 금지 |

어셈블리 발췌는 `evidence/*.asm`에 있다. 식별·레이어·전체 레코드 보존·commit의 가설은 [MicroKey Mapper 프로토콜](https://github.com/PseudoRAM/microkey-mapper/blob/main/Documentation/PROTOCOL.md)과 [k8850_4x4 원본 드라이버](https://github.com/yawor/ch57x-keyboard-tool/blob/k8850_4x4/src/keyboard/k8850_4x4.rs)를 교차 확인한 뒤 실제 장치에서 시험했다. 코드는 독립 작성했으며 벤더 UI·아이콘·폰트를 복사하지 않았다.

WebHID는 report ID를 별도로 전달하므로 `sendReport(3,payload64)`를 쓴다. hidapi는 ID를 포함한 65바이트를 보낸다. 입력도 WebHID의 분리된 ID를 복원해 동일한 64바이트 레코드로 정규화한다. [Chrome WebHID 계약](https://developer.chrome.com/docs/capabilities/hid)

## 실제 장치 증거

1. USB `514C:8850`, serial은 로컬 원본 백업에 기록했다. 현재 모델은 `03 FB 10 03 0B`로 재확인했다.
2. 3개 레이어의 25개 레코드씩 75개를 로컬 원본 파일에 저장했다.
3. 모델 변경 없이 레이어 3 / 동작 25를 Y(`1C`)에서 F13(`68`)으로 바꿨다가 원복했다. [일회성 진단 증거](../evidence/physical-canary.json)
4. 실제 Chrome 웹 UI에서도 동일한 변경·재읽기·백업 복원을 수행했다. 별도 Python 읽기는 변경 바이트가 해당 동작의 usage 한 바이트뿐임을 확인했다. [독립 변경 검증](../evidence/webhid-apply-independent-readback.json)
5. 복원 후 독립 읽기로 원본 75개 레코드의 저장 영역 2..50이 모두 일치함을 확인했다. [독립 복원 검증](../evidence/webhid-restore-independent-readback.json)
6. LED는 쓰기 전 별도 읽기만 수행해 레이어별 모드 `[1,0,0]`과 각 16개 RGB 값을 받았다. [읽기 원본](../evidence/led-read-only.json)

각 앱 단축키의 실제 앱 내 실행, 동시 키 누름, LED의 눈으로 보는 효과·전원 유지와 기록 매체 수명은 위 설정 재읽기 증거와 다르다. 해당 검증 전에는 전체 기능 동등성이나 모든 HID 모델 호환을 주장하지 않는다.

## Physical position correction — 2026-10-24

The previous 16-key base grid `[[4,8,12,16],[3,7,11,15],[2,6,10,14],[1,5,9,13]]` was an unverified position assumption. With the editor rotated 270°, the user pressed its displayed positions 16→1 once each. The supplied log tail contains nine non-modifier keyDown chords. In chronological order their unique layer-1 action matches are `[15,2,6,10,14,1,5,9,13]`, corresponding to the old displayed positions 9→1. The user separately confirmed that the bottom-right displayed Enter (old ID1) physically emits Backspace (device layer1 ID13).

These nine measurements fit a uniform 90° correction: the base firmware ID layout is row-major, and its rotated 270° grid is `[[4,8,12,16],[3,7,11,15],[2,6,10,14],[1,5,9,13]]`. The later full second pass (23:23:02–23:23:15) was exported locally before updating, and confirms all 16 positions in order: `[4,8,12,16,3,7,11,15,2,6,10,14,1,5,9,13]`. The raw session stays in the user’s Downloads folder, outside the repository. `tests/physical-layout.test.mjs` retains both the original nine-position tail and full 16-position second pass as regressions. The fix changes display/position lookup only, preserving stored action IDs, profile content, and device settings. Retesting all positions remains the physical acceptance step. The diagnostic layer selector compares only its selected layer. Other layers do not appear in blue highlights or matching results.
