# 샘플 키맵과 단축키 출처

확인 날짜: 2026-10-24. 여섯 시작 템플릿을 실제 입력값으로 채웠다. 모두 `mini-16x3` 모델의 16키 + 3다이얼, 3개 레이어이며 **각 레이어 25개, 각 프로필 75개가 활성 동작**이다. 전체 슬롯 설명은 450개다. `preserve`만 들어 있는 완성도 표시용 자리표시자는 없다. 문서·스키마·인코딩 확인과 실제 앱/게임/키패드 동작 검증은 구분한다. 가져오기만으로 장치에 기록하지 않는다.

## 여섯 시작 템플릿

| 대상 / 가져오기 파일 | 레이어 1 | 레이어 2 | 레이어 3 | 사용 조건 |
| --- | --- | --- | --- | --- |
| [VS Code Mac](../presets/sample-vscode-mac.json) | 코드 편집 | 파일·탐색 | 공통 편집·미디어 | 공식 기본 키, 사용자 키맵 확인 |
| [Codex 앱 Mac](../presets/sample-codex-mac.json) | 앱 명령 | 내장 브라우저 | 공통 편집·미디어 | CLI와 구분, 해당 화면 포커스 |
| [Claude 앱 Mac](../presets/sample-claude-mac.json) | 빠른 입력·작성 | 아티팩트·Slides | 공통 편집·미디어 | 먼저 앱에서 Option+Space 선택 |
| [Modern Warfare 4 PC](../presets/sample-modern-warfare4-pc.json) | 게임 바인딩 제안 | 표준 키 탐색 | PC 편집·OS 미디어 | **사용자 지정 바인딩 추천 초안**, 게임에서 키를 맞춰야 함 |
| [Forza Horizon 4 PC](../presets/sample-forza-horizon4-pc.json) | 운전 바인딩 제안 | 표준 키 탐색 | PC 편집·OS 미디어 | **사용자 지정 바인딩 추천 초안**, 게임에서 키를 맞춰야 함 |
| [Mac 기본 탐색·미디어](../presets/sample-system-mac.json) | 방향·페이지·미디어 | Safari·창 탐색 | 공통 편집·미디어 | 브라우저별 앞뒤 키 차이 확인 |

데이터와 출처는 [색인](../data/shortcuts/index.json)에서 여섯 경로로 연결된다. JSON 프로필은 기존 `validateProfile`의 v2 형식(`modelId: mini-16x3`, `rotation: 0`)을 따른다. 슬롯별 이름·문맥·근거는 별도 `data/shortcuts/*.json`에 두어 프로필 스키마에 출처 항목을 섞지 않았다.

주요 다이얼 배치는 다음과 같다. 각 표기의 순서는 반시계 / 누름 / 시계다.

| 프로필·레이어 | 다이얼 1 | 다이얼 2 | 다이얼 3 |
| --- | --- | --- | --- |
| VS Code 편집 | 이전 위치 / 정의 / 다음 위치 | 이전 편집기 / 분할 / 다음 편집기 | 내어쓰기 / 저장 / 들여쓰기 |
| VS Code 탐색 | 이전 문제 / 문제 패널 / 다음 문제 | 위 스크롤 / 닫은 편집기 / 아래 스크롤 | 편집기 그룹 1 / 2 / 3 |
| Codex 앱 | 이전 채팅 / 채팅·탭 전환 / 다음 채팅 | 이전 검색 / 찾기 / 다음 검색 | 글자 작게 / 초기화 / 크게 |
| Claude 작성 | 이전 단어 / 모두 선택 / 다음 단어 | Page Up / 복사 / Page Down | 볼륨 낮춤 / 음소거 / 높임 |
| 게임 레이어 1·공통 미디어 | 볼륨 낮춤 / 음소거 / 높임 | 이전 트랙 / 재생·일시 정지 / 다음 트랙 | 이전 트랙 / 정지 / 다음 트랙 |
| 표준 탐색 레이어 | Page Up / Enter / Page Down | 왼쪽 / Tab / 오른쪽 | 볼륨 낮춤 / 음소거 / 높임 |

## 실제 게임 초안의 배치

다음 키는 찾아낸 기본값이 아니라 **이 프로젝트가 제안한 단일 키 대응표**다. 게임의 키보드 바인딩을 각 키에 맞춰야 한다. 같은 동작으로 이미 설정되어 있어도 기본값을 검증했다는 뜻은 아니다. 게임에 저장된 바인딩·모드·사용 문맥이 우선한다. 게임 동작 연속 실행, 자동 반복, 타이밍 시퀀스는 없다. 노브에는 운전/전투 동작 연속 실행을 넣지 않았다.

| 물리 행 | Modern Warfare 4 PC, 왼쪽→오른쪽 | Forza Horizon 4 PC, 왼쪽→오른쪽 |
| --- | --- | --- |
| 맨 위 | 재장전 R / 상호작용 F / 근접 V / 다음 무기 2 | 기어 내림 Q / 올림 E / 핸드브레이크 Space / 클러치 Shift |
| 두 번째 | 전술 Q / 살상 E / 필드 업그레이드 X / 방탄판 G(해당 모드) | 왼쪽 A / 가속 W / 브레이크·후진 S / 오른쪽 D |
| 세 번째 | 왼쪽 A / 전진 W / 후진 S / 오른쪽 D | 카메라 C / 뒤 보기 R / 경적 H / 되감기 Backspace |
| 맨 아래 | 달리기 Shift / 점프·맨틀 Space / 앉기 C / 엎드리기 Ctrl | 지도 M / 포토 P / 일반 Enter / 일반 Esc |

가속·조향·브레이크와 이동처럼 길게 누르는 동작은 실제 키패드의 누름/뗌 이벤트를 게임에서 확인해야 한다. 디지털 키패드가 아날로그 휠이나 페달이 되는 것은 아니다. 수동 변속·클러치는 게임의 해당 주행 설정이 필요하다. 미디어 키는 OS/플레이어로 전달하며 게임 내 라디오 곡 넘김으로 표시하지 않는다.

정확한 대상은 **Call of Duty: Modern Warfare 4 (2026)**이며 CoD4(2007), MW(2019), MWII, MWIII의 기본값을 전용하지 않았다. [Activision 공식 지원](https://support.activision.com/uk/en/modern-warfare-4), [공식 게임플레이 설명](https://www.callofduty.com/blog/2026/08/call-of-duty-modern-warfare-4-next-highlights-multiplayer-gameplay-systems), [공식 장비 설명](https://www.callofduty.com/blog/2026/10/call-of-duty-modern-warfare-4-launch-multiplayer-operators-weapons-equipment-create-a-class)을 확인했다. 이들은 작품·게임플레이 문맥의 근거이며 제안 키의 기본값 근거가 아니다. 사용자 Namu Wiki 링크는 열리지 않았다.

Forza는 [Xbox Game Studios가 게시한 FH4 상품 페이지](https://store.steampowered.com/app/1293830/Forza_Horizon_4/)로 작품을 구분했다. 기존 지원 링크는 `support.forza.net`으로 이동하며 가져오지 못했고, 옛 포럼 링크도 현재 포럼 종료 안내로 이동한다. 검색에 남은 포럼 단편을 현재 공식 기본 키 표로 승격하지 않았다. **게임 기본 키 표는 두 작품 모두 미확인**이며 `proposed-remap` 레코드는 `sourceUrl: null`로 두어 작성자의 제안을 공식 단축키처럼 인용하지 않는다.

## 앱별 문맥과 공식 근거

- [Microsoft VS Code macOS 단축키](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf): 편집·파일·코드 탐색. 확장 키맵이나 사용자 `keybindings.json`이 우선할 수 있다.
- [OpenAI 공식 앱 명령](https://learn.chatgpt.com/docs/reference/commands): 통합 데스크톱 문서의 Codex 적용 항목을 사용했다. Codex CLI/IDE 확장 키를 섞지 않았다. 채팅, 패널, 파일, 리뷰와 내장 브라우저의 포커스 조건이 있다. 전체 대화 검색은 기본 단축키가 없어 임의로 만들지 않았다.
- [Claude Desktop 빠른 입력](https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac): 기본은 활성화 후 Option 두 번이다. 샘플은 문서가 제공하는 **Option+Space 옵션을 선행 설정하는 구성**이며 앱 설정은 변경하지 않는다. `configured-option`으로 구분했다. 두 번 누르기 타이밍과 기본 비활성 Caps Lock 음성은 활성 슬롯에 넣지 않았다. Enter는 빠른 입력의 현재 메시지를 보내므로 준비된 입력에서 사용한다.
- [Claude 아티팩트 키보드 탐색](https://support.claude.com/en/articles/17457950-use-artifacts-with-a-keyboard-or-screen-reader), [Slides 편집 키](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them): 레이어 2는 **아티팩트/Slides 편집기** 문맥이다. 일반 Claude 채팅의 전역 단축키가 아니다. 로컬 Claude 앱 메뉴는 확인하지 못했다.
- [Apple Mac 단축키](https://support.apple.com/en-us/102650), [Microsoft Windows 단축키](https://support.microsoft.com/en-us/accessibility/windows/keyboard-shortcuts-in-windows): 편집 키는 지원되는 입력 필드에서 사용한다. Mac은 META=Command, ALT=Option, Windows는 CTRL을 사용하고 다시 실행은 Ctrl+Y로 배치했다.
- [Safari 단축키](https://support.apple.com/guide/safari/keyboard-and-other-shortcuts-cpsh003/mac): Safari 방문 기록은 Command+[ / ]. 요청한 Command+좌/우는 OpenAI 문서의 **내장 브라우저 포커스** 문맥으로 표시했다. Mac 공통 앞뒤 동작으로 주장하지 않는다.
- [USB-IF HID Usage Tables 1.5](https://usb.org/sites/default/files/hut1_5.pdf): 표준 키와 Consumer 미디어 입력이다. Play/Pause CD, Stop B7, Next B5, Previous B6, Mute E2, Volume Up E9, Down EA(16진). Fn+F키로 대체하지 않았다. 플레이어 응답은 별도 검증이 필요하다.

## 데이터 상태와 물리 ID

각 `records`에는 `label`, 프로필용 `action`, `keys`, `platform`, `layer`, `actionId`, `status`, `confidence`, `sourceUrl`, `notes`가 있다. `actionId`는 1부터 시작하며 프로필 배열은 `actionId-1`이다. `keys: []`인 미디어는 `action.type`으로 구분한다. `setupInstructions`는 선행 앱/게임 설정을 설명한다.

| status | 의미 |
| --- | --- |
| `published-default` | 업체 문서의 키. 기능·포커스·사용자 변경을 확인해야 함 |
| `configured-option` | 문서에 있는 선택 옵션을 배치. 선행 앱 설정 필요 |
| `proposed-remap` | 작성한 사용자 지정 게임 바인딩 추천 초안. 기본 키 주장 없음 |
| `standard-hid` | 표준 입력값이며 특정 앱 동작을 입증하지 않음 |
| `os-convention` | 플랫폼 편집 관례, 입력 필드 문맥 필요 |
| `unsupported-timing` / `requires-app-configuration` | Claude의 비활성 참고 동작에만 사용. 활성 슬롯과 분리 |

```text
 4   8  12  16
 3   7  11  15
 2   6  10  14
 1   5   9  13

다이얼 1: 17 반시계 / 18 누름 / 19 시계
다이얼 2: 20 반시계 / 21 누름 / 22 시계
다이얼 3: 23 반시계 / 24 누름 / 25 시계
```

검증 범위: 여섯 JSON의 `validateProfile` 통과, 450개 슬롯 인코딩 통과, 슬롯별 데이터/프로필 일치, 공유 링크 인코딩·디코딩 왕복 일치. 대상 앱이나 게임에서의 실행, 장치 쓰기 및 물리 플레이 검증은 이 샘플 데이터 작업에 포함하지 않았다.
