# 앱별 자동 키맵 전환과 LED 제어 검토

검토일: 2026-10-24. 이 문서는 읽기 전용 조사 결과와 구현 후보를 기록한다. 이 검토에서는 기능 구현, 원본 앱 실행, 장치 설정 변경, LED 명령 전송을 하지 않았다.

**macOS 앱별 자동 전환은 작은 네이티브 보조 앱을 추가하면 가능하다. 설치 없는 웹앱만으로는 OS의 현재 앱을 식별할 수 없다. 사용자의 `[16, 3, 11]` 장치에서 세 레이어 LED의 모드·RGB 읽기는 확인했다. LED 쓰기·복원·시각 효과·전원 유지는 아직 물리 검증하지 않았다.**

## 확인 수준

| 기능 | 정적 확인 | 실제 장치 확인 | 판단 |
| --- | --- | --- | --- |
| 3레이어의 75개 키·다이얼 동작 읽기 | 원본 앱과 현재 웹 구현에 경로 있음 | 실제 USB 장치와 Chrome WebHID에서 확인 | 현재 지원 |
| 동작 레코드 쓰기·commit·재읽기·원본 복원 | 원본 앱과 현재 웹 구현에 경로 있음 | 레이어 3 / 동작 25의 단일 키 변경과 웹 복원 후 원본 75개 레코드 일치 확인 | 확인한 경로 지원. 모든 동작 실행·전원 재연결 검증과 구분 |
| 웹 페이지 자신의 포커스·표시 상태 | 표준 `hasFocus`, `visibilityState` | 이번 조사에서 별도 실측하지 않음 | 웹만으로 가능 |
| 웹만으로 다른 macOS 앱의 이름·bundle ID 감지 | 표준 페이지 API에 해당 정보 없음 | 없음 | 현재 웹 구조로 불가 |
| 네이티브 보조 앱의 활성 앱 감지 | AppKit `NSWorkspace` API 있음 | 보조 앱 구현·실측 없음 | 구현 가능 |
| 앱별로 장치의 실제 키맵 자동 교체 | 현재 apply 경로 재사용 후보 | 자동 전환 검증 없음 | 보조 앱과 전환 정책 설계 필요 |
| 소프트웨어로 장치의 활성 레이어 선택 | 조사한 `SendLayer`는 편집 레이어/UI 갱신, 조건부 LED 읽기 | 없음 | 활성 레이어 명령은 확인되지 않음 |
| LED 모드와 색상 읽기 | 원본 앱에 별도 경로 있음 | `[16,3,11]`에서 3레이어의 64바이트 응답 확인. 모드 `[1,0,0]`, 레이어당 48바이트 RGB | 이 장치의 읽기 확인 |
| LED 모드와 색상 쓰기·복원 | 원본 앱과 companion에 별도 경로 있음 | 없음 | 코드 구현과 실제 지원을 구분. 물리 검증 필요 |
| LED 밝기·속도·개별 다이얼 조명·전원 유지 | 이번에 확인한 프로토콜에서 독립 항목 미확인 | 없음 | 미확인 |

## 1. 앱 포커스에 따른 자동 전환

### 웹과 macOS의 경계

`document.hasFocus()`는 해당 문서로 키 이벤트가 전달되는지를, `document.visibilityState`는 페이지의 표시 상태를 알려 준다. 포커스를 잃었을 때 VS Code, Terminal, 게임 중 어느 앱이 앞에 있는지는 반환하지 않는다. PWA 설치나 WebHID 권한도 OS의 활성 앱 목록을 제공하는 권한은 아니다. 이 결론은 웹 표준 API의 노출 범위에서 도출한 판단이다. [HTML 포커스 API](https://html.spec.whatwg.org/multipage/interaction.html#focus-management-apis), [페이지 표시 상태](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility)

WebHID에서는 사용자가 선택해 허용한 장치를 `getDevices()`로 찾고 `open()`한 뒤 보고서를 교환한다. 최초 장치 선택은 사용자 동작을 포함한 권한 흐름이 필요하다. 연결 이후의 `sendReport`마다 장치 선택 창이 필요한 것은 아니지만, **백그라운드 통신 가능성과 OS 활성 앱 감지는 서로 다른 기능**이다. 페이지의 생명주기·종료·장치 분리도 처리해야 한다. 브라우저 탭을 macOS 상주 서비스처럼 보장할 수는 없다. [Chrome WebHID](https://developer.chrome.com/docs/capabilities/hid), [페이지 생명주기](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)

Chrome 확장의 service worker는 WebHID 연결로 수명을 유지할 수 있지만, 장치 선택은 확장 페이지에서 해야 한다. 이것은 일반 웹 페이지의 service worker와 다른 기능이다. 확장만 추가해도 macOS의 다른 앱을 알 수 있게 되는 것은 아니며, OS 정보는 여전히 네이티브 측에서 받아야 한다. [확장에서의 WebHID](https://developer.chrome.com/docs/extensions/how-to/web-platform/webhid)

### 작은 macOS 보조 앱

후보는 메뉴 막대 보조 앱이 `NSWorkspace.shared.notificationCenter`의 `didActivateApplicationNotification`을 구독하고, 시작 시 `frontmostApplication`으로 현재 앱을 확인하는 구조다. 알림의 `applicationUserInfoKey`로 `NSRunningApplication`을 얻고 `bundleIdentifier`를 프로필 ID에 연결한다. 앱 표시 이름보다 bundle ID를 사용하고, 값이 없는 앱과 보조 창·잠금·사용자 세션 변경의 기본 동작을 정해야 한다. [앱 활성화 알림](https://developer.apple.com/documentation/appkit/nsworkspace/didactivateapplicationnotification), [현재 앱](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication), [bundle ID](https://developer.apple.com/documentation/appkit/nsrunningapplication/bundleidentifier)

단순한 `NSWorkspace` 앱 활성화 관찰은 키 입력 감시나 다른 앱의 UI 조작과 다르며, 이 경로 때문에 Accessibility 또는 Input Monitoring 권한부터 요구할 필요는 없다. 이번에는 보조 앱을 실행해 권한 흐름을 시험하지 않았으므로 실제 배포 형태에서 확인할 항목으로 남긴다. 창 제목·UI 요소를 읽는 Accessibility 기능, 전역 키 입력 감시, 키 이벤트 주입을 추가하면 각각의 API·권한을 별도 검토해야 한다. Apple 문서는 `NSEvent` 전역 키 감시의 Accessibility 조건을 설명하며, 현대 `CGEventTap`의 listen-only 경로에는 Input Monitoring 권한을 설명한다. 모든 기능을 하나의 ‘접근성 권한’으로 묶으면 안 된다. [NSEvent 감시](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/MonitoringEvents/MonitoringEvents.html), [Apple DTS의 Input Monitoring 설명](https://developer.apple.com/forums/thread/811443)

웹 편집기를 유지하려면 보조 앱과 승인된 로컬 통신 경로가 필요하다. 선택지는 보조 앱이 HID 작업까지 소유하는 로컬 브릿지, 또는 브라우저 확장과 Native Messaging이다. Native Messaging은 확장과 설치된 호스트 사이의 기능이며 일반 웹 페이지에서 직접 호출하는 API가 아니다. 로컬 브릿지 후보는 loopback 바인딩, Origin 확인·연결 토큰, 단일 장치 소유권을 설계해야 한다. 현재 웹의 CSP는 `connect-src 'self'`이므로 별도 포트 브릿지도 현재 상태에서 바로 연결되지는 않는다. [Chrome Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

### 전환 방식 비교

| 방식 | 장점 | 확인할 제약 |
| --- | --- | --- |
| 보조 앱이 포커스 변화마다 장치 레코드 교체 | 실제 키보드가 선택한 프로필을 출력. 기존 인코더 활용 가능 | 쓰기·commit 지연, 실패·복원, 빠른 앱 전환, 저장 매체 수명·원자성 미확인 |
| 앱별 설정을 3개 레이어에 미리 넣고 활성 레이어만 선택 | 지원된다면 전환당 키맵 전체 쓰기 감소 | **호스트의 활성 레이어 선택 명령이 아직 없음.** 현재는 이 방식을 전제할 수 없음 |
| 장치는 고정된 식별 키를 출력하고 네이티브에서 앱별 재매핑 | 설정 저장을 반복하지 않고 호스트 메모리에서 전환 가능 | 입력 캡처·억제·재주입, 권한, 키를 누른 채 앱 전환, 게임 호환성, 다른 키보드와 구분 검증 필요 |

WebHID가 장치 설정용 vendor collection에 접근한다는 사실만으로 일반 키보드 입력을 전역 가로채고 바꿀 수 있는 것은 아니다. Chrome은 일반 키보드·마우스의 보호된 collection 보고서를 차단한다. 따라서 마지막 방식은 별도의 네이티브 입력 경로가 필요하다. [WebHID 보호 usage](https://developer.chrome.com/docs/capabilities/hid#security_and_privacy)

**현재 `apply(profile)`를 포커스 알림에 바로 연결하는 것은 권하지 않는다.** `preserve`는 해당 슬롯의 ‘지금 장치에 있는 값 유지’다. A 앱에서 바꾼 슬롯을 B 프로필이 preserve하면 A 값이 남는다. 자동 전환에는 세션 시작의 원본 75개 레코드를 기준으로 각 앱 프로필을 합성해, 이전 앱과 무관한 완전한 목표 상태를 만들어야 한다. 원본 복귀도 같은 기준을 사용해야 한다.

또한 현재 apply는 변경 시마다 브라우저 백업을 추가한다. 상주 전환에서는 세션 원본과 복구 지점을 구분하고 무제한 백업 증가를 막아야 한다. 상태가 동일하면 쓰지 않고, 실행 중 전환 요청을 하나로 합쳐 최신 앱만 처리하며, 실패 시 자동 전환을 중지해야 한다. 디바운스 시간과 키를 누른 채 전환할 때의 정책은 아직 결정·측정하지 않았다.

`03 FD FE FF` 등의 commit 경로는 확인했지만, 펌웨어의 EEPROM/flash 종류, endurance, 매번 비휘발성 쓰기 여부, RAM 전용 설정 명령, 전원 차단 원자성은 확인하지 못했다. ‘EEPROM을 사용한다’고 단정할 수 없고, 반대로 포커스가 바뀔 때마다 반복 commit해도 괜찮다고 보장할 수도 없다. 자동 기록 전에 이 구분부터 확인해야 한다.

## 2. LED 등 추가 장치 제어

### 원본 앱에서 확인한 별도 LED 경로

대상은 `/Applications/MINI_KEYBOARD.app/Contents/MacOS/MINI_KEYBOARD`이며 재계산한 SHA-256은 `6f330a43fc9493d8f76e112b08c054d7c896a0d628d2e41bbfd701dbedfd6f4f`로 기존 REA 기록과 일치한다. Qt x86_64/hidapi 앱이다. REA `inspect_macho` 증거 ID는 `ev_1298bb7113dbebf208dec6184961f7471559ed51be8aeea2542be9878a75606f`이다. 심볼·의존성 확인과 아래 어셈블리의 수동 해석을 구분한다. 디컴파일 결과나 장치 펌웨어 분석 결과는 아니다. [REA 원본 증거](../evidence/rea-evidence.json), [원본 식별](../evidence/original-identity.json)

`Widget::HID_write()`의 `0x10003db98–0x10003dc85`에는 `_RgbLED_Change_Flag` 분기 후 다음 패킷 후보를 65바이트 `hid_write`로 보내는 코드가 있다. 표기는 hidapi 버퍼처럼 report ID를 포함한다. **조사 기록용이며 아직 전송하도록 승인·검증한 명령표가 아니다.** [보관된 어셈블리](../evidence/__ZN6Widget9HID_writeEv.asm)

| 바이트 | 정적 코드에서 관찰한 값 |
| --- | --- |
| 0 | report ID `03` |
| 1–2 | `FE B0` |
| 3 | LED 레이어 인덱스 `00`, `01`, `02` |
| 4 | 각 레이어의 `_RGB_LED_Md` 값 |
| 5–52 | 각 레이어의 `_KeyBoard_KeyLed` 48바이트 |
| 53–64 | 이 경로에서 초기화된 나머지 패딩 |

48바이트는 16개 × 3바이트 크기다. 전체 `otool -tvV` 출력의 `0x100097b7d–0x100097bf0`에서는 선택 키 번호로 `3 × (key − 1)` 위치에 `QColor.red/green/blue`를 순서대로 저장하므로, 원본 앱의 메모리 표현은 RGB 순서라고 해석할 수 있다. 실제 LED의 물리 위치 순서, 다이얼에 조명이 있는지, 사용자의 보드에서 같은 표현을 쓰는지는 별도 확인이 필요하다.

`Widget::Read_RgbLed_DataDsp()`의 `0x10003ec70–0x10003ecb4`는 `03 FA B0 <선택 레이어 0..2>`로 시작하는 요청 버퍼를 만들어 `hid_write(...,65)` 후 `hid_read(...,64)`한다. `0x10003ed4d–0x10003ed87`은 수신 버퍼 오프셋 2를 모드로, 3–50을 48바이트 색상으로 복사한다. 이후 루트 작업의 실제 읽기 전용 probe가 이 구조를 뒷받침했다. 세 요청은 65바이트로 패딩한 `03 FA B0 00/01/02`였고, 응답은 모두 64바이트 `03 FA <mode> <48 RGB> <13 remaining bytes>`였다. 모드는 `[1,0,0]`이며 세 레이어의 RGB 원본과 요청·응답 전체를 [LED 읽기 증거](../evidence/led-read-only.json)에 보관했다. `ledWritesSent:false`, `visualStateTested:false`다. 이것은 hidapi 읽기의 검증이며 WebHID LED 왕복이나 쓰기·효과의 검증은 아니다.

같은 함수의 `0x10003edf9`는 모드 값 0–5의 UI 분기를 가진다. 이는 원본 앱의 여섯 상태 처리 증거이며, 사용자 보드가 여섯 효과를 지원한다는 증거는 아니다. 효과 이름·속도·밝기·off 값의 정확한 의미는 확정하지 않았다. 문자열 `Screen brightness+/-`는 호스트 화면 밝기용 동작이며, 키보드 LED 밝기 명령의 증거로 사용하지 않는다.

`Read_CurKeyBoard_Data()`의 `0x10003e4b6–0x10003e4c8`은 특정 모드 조건에서 이 LED 읽기 함수를 호출한다. `SendLayer()`의 `0x1000368b0–0x100036cc3`는 편집 레이어 변수·버튼 스타일·표시 내용을 바꾸고 조건부 LED 읽기를 한다. 함수 이름만으로 실제 장치의 활성 레이어 변경 명령이라고 볼 수 없다. 전체 어셈블리의 조사 위치는 `/tmp/minikeyboard-original.asm`이며, 임시 파일이 없어져도 위 바이너리 해시·함수·주소와 `otool -tvV`로 재현할 수 있다.

### 현재 백업과 구현의 범위

현재 `capture()`와 `createBackup()`은 `FA` 키 레코드 3 × 25개만 보관한다. 프로필 JSON도 75개 키·다이얼 동작만 표현한다. **현재 ‘전체 백업’은 모든 키 동작의 백업이며 LED·펌웨어·기타 장치 상태의 전체 이미지가 아니다.** LED 원본 상태를 복원하는 데 이 파일만 사용해서는 안 된다. [현재 장치 캡처](../src/device.js), [백업 형식](../src/protocol.js)

기존 물리 canary는 키 동작 하나의 변경·재읽기·복원을 확인했다. 웹의 apply/restore 뒤 독립 hidapi 재읽기도 원래 75개 키 레코드와 차이가 없음을 확인했다. LED 읽기 원본은 별도 증거 파일에 있으며 production 키 백업에 자동 포함되지는 않는다. LED 쓰기·복원·전원 유지·밝기·효과·다른 펌웨어는 물리 검증 범위에 포함하지 않는다. [물리 canary](../evidence/physical-canary.json), [WebHID 변경의 독립 재읽기](../evidence/webhid-apply-independent-readback.json), [75개 키 원본 복원의 독립 확인](../evidence/webhid-restore-independent-readback.json)

LED 후보 구현의 선행 조건은 다음과 같다.

1. 사용자 보드의 LED **읽기만** 수행한 단계는 루트 작업에서 완료했다. `[16,3,11]`의 세 레이어 원본 모드·RGB·raw 응답을 별도로 보관했다. 다른 모델과 펌웨어에는 이 결과를 일반화하지 않는다.
2. 버전이 있는 백업/프로필에 LED를 선택 항목으로 추가하되, 기존 v1 파일은 LED 유지로 해석한다. 알 수 없는 모드는 원본 바이트를 유지한다.
3. 이후 별도 승인된 최소 변경에서 단일 LED/모드만 바꾸고 재읽기·원본 복원·물리 관찰·전원 재연결을 각각 검증한다. LED만 바꿀 때 commit이 필요한지와 인덱스가 키 레코드와 다른 점도 확인한다.
4. 확인된 모델·모드만 UI에 공개한다. LED가 없는 하드웨어는 지원 불가로 표시하고, 밝기·속도·다이얼 조명은 증거가 생긴 범위에서만 추가한다.

## 권장 순서

LED 읽기 원본은 확보했다. 이후 구현된 Python companion은 공통 상태 이벤트·HID 소유권·LED 쓰기 후보와 복구 경로를 제공하지만, 원본 읽기만 실제 장치에서 증명된 상태다. 앱별 전환은 활성 bundle ID와 목표 프로필만 표시하는 읽기 전용 POC부터 시작하는 것이 좋다. 그 다음 RAM 전환 명령 존재 여부와 호스트 재매핑 비용을 비교해 실제 자동화 방식을 선택한다. 현재의 영구 저장 경로를 앱 전환마다 바로 호출하는 설계는 보류한다. [Companion 현재 인터페이스](companion-interface.md)

이 문서의 조사는 읽기 전용이다. 이후 별도 구현된 companion과 실제 LED 읽기 증거를 반영했으며, 자동 앱 전환과 LED 쓰기·복원의 물리 성공을 주장하지 않는다. 여러 모델의 USB 후보와 키 동작 코덱 검증도 구분해야 한다. 구형 `FE` 계열과 신형 `FD65` 레코드를 동일하다고 가정해 기록해서는 안 되며, 조사되지 않은 방언은 쓰기를 잠근다.
