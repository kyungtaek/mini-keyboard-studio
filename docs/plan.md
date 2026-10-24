# 구현 계획

1. 설치 앱을 REA로 열어 식별 및 구조를 기록하고, HID 읽기·기록·commit과 동작 인코딩을 분석한다. 분석 엔진이 없으면 지원되는 정적 조사 결과를 보관하고 디컴파일 미확인 영역을 표시한다.
2. `src/profile.js`: 3레이어×25동작 JSON 스키마, 검증, 로컬 보관함, 공유 링크. `tests/profile.test.mjs`로 입력 손상과 왕복을 검증한다.
3. `src/protocol.js`, `src/device.js`: 바이너리 레코드와 WebHID 분리. `tests/protocol.test.mjs`, `tests/device.test.mjs`에서 프레이밍, 읽기 완전성, 원본 보존, 검증 실패와 롤백을 확인한다.
4. `index.html`, `src/app.js`, `src/styles.css`: 물리 레이아웃, 키/다이얼 편집, 레이어, 프로필 파일·공유·보관함, 연결·적용·백업 복원 UI를 만든다.
5. 정적 서버를 시작해 브라우저 흐름을 확인한다. 실제 장치가 없으면 쓰기 성공을 주장하지 않는다. `docs/research.md`, README에 확인된 범위와 재현 명령을 기록한다.
