// Korean is the source language. Each row supplies English, Japanese, Spanish,
// Simplified Chinese, and Traditional Chinese; placeholders preserve opaque data.
const table = `
원래 설정 유지|Keep original settings|元の設定を保持|Conservar ajustes originales|保留原设置|保留原設定
동작 없음|No action|動作なし|Sin acción|无操作|無動作
편집:|Draft:|編集中:|Borrador:|编辑：|編輯：
좌클릭|Left click|左クリック|Clic izquierdo|左键单击|左鍵點擊
우클릭|Right click|右クリック|Clic derecho|右键单击|右鍵點擊
중클릭|Middle click|中クリック|Clic central|中键单击|中鍵點擊
휠 ↑|Wheel ↑|ホイール ↑|Rueda ↑|滚轮 ↑|滾輪 ↑
휠 ↓|Wheel ↓|ホイール ↓|Rueda ↓|滚轮 ↓|滾輪 ↓
언어|Language|言語|Idioma|语言|語言
키맵 보관함|Keymap library|キーマップライブラリ|Biblioteca de mapas|键位库|鍵位庫
내 키맵|My keymaps|マイキーマップ|Mis mapas|我的键位|我的鍵位
새 키맵|New keymap|新しいキーマップ|Nuevo mapa|新建键位|新增鍵位
키맵 도구|Keymap tools|キーマップツール|Herramientas de mapas|键位工具|鍵位工具
키맵 이름|Keymap name|キーマップ名|Nombre del mapa|键位名称|鍵位名稱
작업 자동 보관|Draft autosave|下書きを自動保存|Guardado automático|自动保存草稿|自動儲存草稿
내 키맵에 저장|Save to my keymaps|マイキーマップに保存|Guardar en mis mapas|保存到我的键位|儲存至我的鍵位
저장|Save|保存|Guardar|保存|儲存
키보드 모델|Keyboard model|キーボードモデル|Modelo de teclado|键盘型号|鍵盤型號
놓는 방향|Orientation|配置の向き|Orientación|摆放方向|擺放方向
키보드 방향|Keyboard orientation|キーボードの向き|Orientación del teclado|键盘方向|鍵盤方向
왼쪽으로 회전|Rotate left|左に回転|Girar a la izquierda|向左旋转|向左旋轉
↶ 왼쪽|↶ Left|↶ 左|↶ Izquierda|↶ 向左|↶ 向左
오른쪽으로 회전|Rotate right|右に回転|Girar a la derecha|向右旋转|向右旋轉
오른쪽 ↷|Right ↷|右 ↷|Derecha ↷|向右 ↷|向右 ↷
방향 초기화|Reset orientation|向きをリセット|Restablecer orientación|重置方向|重設方向
초기화|Reset|リセット|Restablecer|重置|重設
현재 방향|Current orientation|現在の向き|Orientación actual|当前方向|目前方向
편집할 레이어|Layer to edit|編集するレイヤー|Capa para editar|编辑图层|編輯圖層
키패드|Keypad|キーパッド|Teclado numérico|小键盘|小鍵盤
다이얼 설정|Dial settings|ダイヤル設定|Ajustes de diales|旋钮设置|旋鈕設定
현재 레이어 복사|Copy current layer|現在のレイヤーをコピー|Copiar capa actual|复制当前图层|複製目前圖層
레이어 복사|Copy layer|レイヤーをコピー|Copiar capa|复制图层|複製圖層
붙여넣기|Paste|貼り付け|Pegar|粘贴|貼上
장치 연결 전|No device connected|デバイス未接続|Sin dispositivo conectado|设备未连接|裝置未連線
현재 키·다이얼 동작을 먼저 백업합니다.|Current key and dial actions are backed up first.|現在のキーとダイヤル動作を先にバックアップします。|Primero se respaldan las acciones actuales de teclas y diales.|先备份当前按键和旋钮操作。|先備份目前按鍵和旋鈕動作。
장치 연결|Connect device|デバイス接続|Conectar dispositivo|连接设备|連接裝置
장치에 적용|Apply to device|デバイスに適用|Aplicar al dispositivo|应用到设备|套用至裝置
적용|Apply|適用|Aplicar|应用|套用
키·다이얼 동작 백업 후 적용|Back up key and dial actions, then apply|キーとダイヤル動作をバックアップして適用|Respaldar acciones y aplicar|备份按键和旋钮后应用|備份按鍵和旋鈕後套用
동작 편집|Edit action|動作を編集|Editar acción|编辑操作|編輯動作
동작 편집 도움말|Action editor help|動作編集のヘルプ|Ayuda del editor de acciones|操作编辑帮助|動作編輯說明
원래 동작 유지: 장치에 저장된 동작을 그대로 둡니다. 레이어 선택은 편집할 설정을 바꾸며, 실제 레이어는 키보드에서 전환합니다.|Keep original action preserves the device setting. Layer selection changes the layer being edited; switch the actual layer on the keyboard.|元の動作を保持すると、デバイスの設定は変わりません。レイヤー選択は編集対象を変えます。実際のレイヤーはキーボードで切り替えてください。|Conservar la acción mantiene el ajuste del dispositivo. La capa seleccionada es la que se edita; la capa real se cambia en el teclado.|保留原操作不会更改设备设置。选择图层仅切换编辑内容；实际图层请在键盘上切换。|保留原動作不會變更裝置設定。選擇圖層僅切換編輯內容；實際圖層請在鍵盤上切換。
닫기|Close|閉じる|Cerrar|关闭|關閉
취소|Cancel|キャンセル|Cancelar|取消|取消
만들기|Create|作成|Crear|创建|建立
변경된 방향으로 키를 다시 설정할까요?|Rearrange keys for the new orientation?|新しい向きにキーを再配置しますか？|¿Reorganizar las teclas para la nueva orientación?|按新方向重新排列按键？|依新方向重新排列按鍵？
세 레이어의 키를 기존 화면 위치에 맞춰 옮깁니다.|Keys on all three layers move to match their screen positions.|3つのレイヤーのキーを画面上の位置に合わせて移動します。|Las teclas de las tres capas se mueven según su posición en pantalla.|按屏幕位置移动全部三个图层的按键。|依畫面位置移動全部三個圖層的按鍵。
노브 설정은 유지합니다.|Dial settings stay the same.|ダイヤル設定は維持されます。|Los ajustes de los diales se conservan.|旋钮设置保持不变。|旋鈕設定維持不變。
화면 방향만 변경|Change display orientation only|画面の向きのみ変更|Cambiar solo la orientación visual|仅更改显示方向|僅變更顯示方向
키 재배치·적용|Rearrange and apply|キーを再配置して適用|Reorganizar y aplicar|重排并应用|重排並套用
파일·공유|Files & sharing|ファイルと共有|Archivos y compartir|文件与分享|檔案與分享
키맵 파일 열기|Open keymap file|キーマップファイルを開く|Abrir archivo de mapa|打开键位文件|開啟鍵位檔案
JSON 파일에서 가져오기|Import from a JSON file|JSONファイルから読み込む|Importar desde JSON|从 JSON 文件导入|從 JSON 檔案匯入
가져오기|Import|読み込み|Importar|导入|匯入
내보내기|Export|書き出し|Exportar|导出|匯出
파일로 내보내기|Export to file|ファイルに書き出す|Exportar a archivo|导出到文件|匯出至檔案
현재 키맵 저장|Save current keymap|現在のキーマップを保存|Guardar mapa actual|保存当前键位|儲存目前鍵位
링크로 공유|Share by link|リンクで共有|Compartir por enlace|通过链接分享|透過連結分享
키맵이 담긴 링크 만들기|Create a link containing this keymap|キーマップを含むリンクを作成|Crear enlace con este mapa|创建包含键位的链接|建立包含鍵位的連結
장치 관리|Devices|デバイス管理|Dispositivos|设备管理|裝置管理
키보드|Keyboard|キーボード|Teclado|键盘|鍵盤
연결 방식|Connection method|接続方法|Método de conexión|连接方式|連線方式
브라우저 USB|Browser USB|ブラウザーUSB|USB del navegador|浏览器 USB|瀏覽器 USB
보조앱|Companion|補助アプリ|Aplicación auxiliar|辅助应用|輔助程式
키보드 연결|Connect keyboard|キーボード接続|Conectar teclado|连接键盘|連接鍵盤
연결 해제|Disconnect|切断|Desconectar|断开连接|中斷連線
보조앱 연결에서 사용|Available with companion connection|補助アプリ接続で利用可能|Disponible con la aplicación auxiliar|通过辅助应用连接后使用|透過輔助程式連線後使用
상태·LED|Status & LED|状態とLED|Estado y LED|状态与 LED|狀態與 LED
설정 읽기|Read settings|設定を読み込む|Leer ajustes|读取设置|讀取設定
키맵 링크 공유|Share keymap link|キーマップのリンク共有|Compartir enlace del mapa|分享键位链接|分享鍵位連結
키맵을 링크에 담았습니다. 링크를 받은 사람은 자신의 작업으로 열어 수정할 수 있습니다. 장치 백업은 포함하지 않습니다.|The link contains this keymap. Recipients can open and edit their own copy. Device backups are not included.|リンクにキーマップを含めました。受け取った人は自分のコピーを開いて編集できます。デバイスのバックアップは含まれません。|El enlace contiene este mapa. Quien lo reciba podrá editar su propia copia. No incluye copias de seguridad del dispositivo.|链接中包含此键位。接收者可打开并编辑自己的副本，不包含设备备份。|連結中包含此鍵位。接收者可開啟並編輯自己的副本，不包含裝置備份。
공유 링크|Share link|共有リンク|Enlace para compartir|分享链接|分享連結
링크에는 키 입력과 매크로가 그대로 들어갑니다. 비밀번호 등 민감한 내용을 넣지 마세요.|The link includes keystrokes and macros. Do not include passwords or sensitive information.|リンクにはキー入力とマクロがそのまま含まれます。パスワードなどの機密情報を含めないでください。|El enlace incluye pulsaciones y macros. No incluya contraseñas ni datos sensibles.|链接中直接包含按键和宏。请勿包含密码等敏感信息。|連結中直接包含按鍵和巨集。請勿包含密碼等敏感資訊。
링크 복사|Copy link|リンクをコピー|Copiar enlace|复制链接|複製連結
키맵 카탈로그|Keymap catalog|キーマップカタログ|Catálogo de mapas|键位目录|鍵位目錄
마음에 드는 키맵을 골라 내 키보드에 맞춰 보세요.|Choose a keymap and make it your own.|キーマップを選び、自分のキーボードに合わせて調整しましょう。|Elija un mapa y adáptelo a su teclado.|选择键位并按自己的键盘进行调整。|選擇鍵位並依自己的鍵盤調整。
키맵 출처|Keymap source|キーマップの取得元|Origen del mapa|键位来源|鍵位來源
GitHub 카탈로그|GitHub catalog|GitHubカタログ|Catálogo de GitHub|GitHub 目录|GitHub 目錄
기본 샘플|Bundled samples|付属サンプル|Ejemplos incluidos|内置示例|內建範例
연결 설정|Connection settings|接続設定|Ajustes de conexión|连接设置|連線設定
GitHub 연결 확인 전|GitHub connection not checked|GitHub接続は未確認|Conexión de GitHub sin comprobar|尚未检查 GitHub 连接|尚未檢查 GitHub 連線
새로고침|Refresh|更新|Actualizar|刷新|重新整理
키맵 검색|Search keymaps|キーマップを検索|Buscar mapas|搜索键位|搜尋鍵位
이름, 앱, 태그 검색|Search names, apps, tags|名前・アプリ・タグを検索|Buscar nombres, apps, etiquetas|搜索名称、应用、标签|搜尋名稱、應用程式、標籤
플랫폼 필터|Platform filter|プラットフォーム絞り込み|Filtro de plataforma|平台筛选|平台篩選
모든 플랫폼|All platforms|すべてのプラットフォーム|Todas las plataformas|所有平台|所有平台
공통|Any platform|共通|Cualquier plataforma|通用|通用
키보드 모델 필터|Keyboard model filter|キーボードモデル絞り込み|Filtro de modelo|键盘型号筛选|鍵盤型號篩選
모든 모델|All models|すべてのモデル|Todos los modelos|所有型号|所有型號
앱에 포함된 샘플입니다. 편집기로 열어 수정할 수 있습니다.|Samples included with the app. Open in the editor to customize.|アプリ付属のサンプルです。エディターで開いて編集できます。|Ejemplos incluidos en la app. Ábralos en el editor para personalizarlos.|应用内置示例，可在编辑器中打开并修改。|應用程式內建範例，可在編輯器中開啟並修改。
GitHub 연결|GitHub connection|GitHub接続|Conexión a GitHub|GitHub 连接|GitHub 連線
GitHub CLI에 로그인되어 있으면 그대로 사용할 수 있습니다. 토큰으로 연결하려면 이 저장소만 선택한 Fine-grained token에 Contents: Read-only 권한을 주세요. 비공개 저장소용 classic token은 repo 범위가 필요합니다.|If GitHub CLI is signed in, it is used automatically. Otherwise use a fine-grained token restricted to this repository with Contents: Read-only. A classic token for a private repository requires repo scope.|GitHub CLIでログイン済みならそのまま使えます。トークンの場合はこのリポジトリのみを選択し、Contents: Read-only権限を付与してください。非公開リポジトリ用のclassic tokenにはrepoスコープが必要です。|Si GitHub CLI tiene sesión iniciada, se usa automáticamente. Si no, use un token detallado limitado a este repositorio con Contents: Read-only. Un token clásico para un repositorio privado necesita el ámbito repo.|已登录 GitHub CLI 时会自动使用。否则请使用仅限此仓库且具有 Contents: Read-only 权限的细粒度令牌。私有仓库的经典令牌需要 repo 范围。|已登入 GitHub CLI 時會自動使用。否則請使用僅限此儲存庫且具有 Contents: Read-only 權限的細緻權杖。私人儲存庫的傳統權杖需要 repo 範圍。
GitHub 토큰|GitHub token|GitHubトークン|Token de GitHub|GitHub 令牌|GitHub 權杖
토큰 붙여넣기|Paste token|トークンを貼り付け|Pegar token|粘贴令牌|貼上權杖
토큰은 데스크톱 앱의 암호화 저장소에 보관합니다.|The token is kept in the desktop app's encrypted storage.|トークンはデスクトップアプリの暗号化ストレージに保存します。|El token se guarda en el almacenamiento cifrado de la app de escritorio.|令牌保存在桌面应用的加密存储中。|權杖儲存在桌面應用程式的加密儲存空間中。
저장한 토큰 삭제|Remove saved token|保存済みトークンを削除|Eliminar token guardado|删除已保存令牌|刪除已儲存權杖
연결|Connect|接続|Conectar|连接|連線
장치 백업|Device backups|デバイスのバックアップ|Copias del dispositivo|设备备份|裝置備份
적용 전 읽어 둔 장치의 키·다이얼 동작입니다. LED·펌웨어는 포함하지 않습니다. 복원할 때도 현재 키·다이얼 동작을 먼저 백업합니다.|Key and dial actions read before applying. LED settings and firmware are not included. Restoring also backs up current actions first.|適用前に読み込んだキーとダイヤル動作です。LEDとファームウェアは含みません。復元前にも現在の動作をバックアップします。|Acciones de teclas y diales leídas antes de aplicar. No incluye LED ni firmware. Al restaurar, también se respaldan primero las acciones actuales.|应用前读取的按键和旋钮操作，不含 LED 和固件。恢复前也会先备份当前操作。|套用前讀取的按鍵和旋鈕動作，不含 LED 和韌體。還原前也會先備份目前動作。
백업 파일 가져오기|Import backup file|バックアップファイルを読み込む|Importar copia de seguridad|导入备份文件|匯入備份檔案
앱의 실제 상태와 연동하지 않는 수동 이벤트 테스트입니다.|Manual event test, independent of the app's actual state.|実際のアプリ状態とは連動しない手動イベントテストです。|Prueba manual de eventos, independiente del estado real de la app.|手动事件测试，不与应用实际状态联动。|手動事件測試，不與應用程式實際狀態連動。
수동 이벤트|Manual events|手動イベント|Eventos manuales|手动事件|手動事件
앱 상태 연동 테스트|App state integration test|アプリ状態連動テスト|Prueba de integración de estado|应用状态联动测试|應用程式狀態連動測試
연결 확인 중|Checking connection|接続を確認中|Comprobando conexión|正在检查连接|正在檢查連線
켜고 상태를 누르면 해당 레이어의 장치 LED를 변경합니다. 변경 전 원본 LED를 백업하고 재읽기로 검증합니다.|Enable and select a state to change that layer's LED. Original LEDs are backed up first and changes are verified by readback.|有効にして状態を押すと、そのレイヤーのLEDを変更します。元のLEDをバックアップし、再読み込みで検証します。|Active y elija un estado para cambiar el LED de esa capa. Se respalda el original y se verifica mediante lectura.|启用后点击状态可更改对应图层的 LED。修改前备份原 LED，并通过重新读取验证。|啟用後點擊狀態可變更對應圖層的 LED。修改前備份原 LED，並透過重新讀取驗證。
장치 LED 사용|Use device LEDs|デバイスのLEDを使用|Usar LED del dispositivo|使用设备 LED|使用裝置 LED
미리보기|Preview|プレビュー|Vista previa|预览|預覽
장치 LED 읽기|Read device LEDs|デバイスLEDを読み込む|Leer LED del dispositivo|读取设备 LED|讀取裝置 LED
보조앱이 변경 전에 백업한 원래 LED로 복원하고 다시 읽어 확인합니다.|Restore original LEDs backed up by the companion, then verify by readback.|補助アプリが保存した元のLEDに復元し、再読み込みで確認します。|Restaura los LED originales respaldados por la app auxiliar y verifica su lectura.|恢复辅助应用备份的原始 LED，并重新读取确认。|還原輔助程式備份的原始 LED，並重新讀取確認。
원래 LED 복원|Restore original LEDs|元のLEDに復元|Restaurar LED originales|恢复原始 LED|還原原始 LED
작업 중|Working|作業中|Trabajando|工作中|工作中
확인 필요|Needs attention|確認が必要|Requiere atención|需要确认|需要確認
완료|Done|完了|Listo|完成|完成
오류|Error|エラー|Error|错误|錯誤
날짜 없음|No date|日付なし|Sin fecha|无日期|無日期
알 수 없는 동작|Unknown action|不明な動作|Acción desconocida|未知操作|未知動作
사용자 동작|User action|ユーザー動作|Acción del usuario|用户操作|使用者動作
매크로|Macro|マクロ|Macro|宏|巨集
연결 후 표시|Shown when connected|接続後に表示|Se muestra al conectar|连接后显示|連線後顯示
작업 보관 중…|Saving draft…|下書きを保存中…|Guardando borrador…|正在保存草稿…|正在儲存草稿…
작업 자동 보관됨|Draft saved|下書きを保存済み|Borrador guardado|草稿已保存|草稿已儲存
자동 보관 실패|Autosave failed|自動保存に失敗|Falló el guardado automático|自动保存失败|自動儲存失敗
키맵 삭제|Delete keymap|キーマップを削除|Eliminar mapa|删除键位|刪除鍵位
편집한 동작|Edited action|編集した動作|Acción editada|已编辑操作|已編輯動作
USB 검증|USB verified|USB検証済み|USB verificado|USB 已验证|USB 已驗證
실기 미검증|Hardware unverified|実機未検証|Sin verificar en hardware|实机未验证|實機未驗證
왼쪽 회전|Turn left|左に回す|Girar a la izquierda|向左旋转|向左旋轉
누르기|Press|押す|Pulsar|按下|按下
오른쪽 회전|Turn right|右に回す|Girar a la derecha|向右旋转|向右旋轉
지원하지 않는 앱|Unsupported app|未対応のアプリ|App no compatible|不支持的应用|不支援的應用程式
사전 설정 필요|Setup required|事前設定が必要|Requiere configuración|需要预先设置|需要預先設定
키 설정 방식|Key assignment method|キー設定方法|Método de asignación|按键设置方式|按鍵設定方式
기능 선택|Choose function|機能を選択|Elegir función|选择功能|選擇功能
직접 입력|Manual entry|直接入力|Entrada manual|手动输入|手動輸入
키 할당 삭제 · 사용 안 함|Clear assignment · disable|割り当てを削除・無効化|Quitar asignación · desactivar|清除分配 · 禁用|清除指派 · 停用
키 할당 삭제|Clear assignment|割り当てを削除|Quitar asignación|清除分配|清除指派
지원 앱|Supported app|対応アプリ|App compatible|支持的应用|支援的應用程式
기능 검색|Search functions|機能を検索|Buscar funciones|搜索功能|搜尋功能
기능 이름으로 검색|Search function names|機能名で検索|Buscar por nombre de función|按功能名称搜索|依功能名稱搜尋
기능 그룹|Function group|機能グループ|Grupo de funciones|功能分组|功能群組
모든 기능|All functions|すべての機能|Todas las funciones|所有功能|所有功能
동작 종류|Action type|動作の種類|Tipo de acción|操作类型|動作類型
원래 동작 유지|Keep original action|元の動作を保持|Conservar acción original|保留原操作|保留原動作
키 / 조합키|Key / shortcut|キー・組み合わせ|Tecla / combinación|按键 / 组合键|按鍵 / 組合鍵
순차 매크로|Sequential macro|順次マクロ|Macro secuencial|顺序宏|循序巨集
미디어|Media|メディア|Multimedia|媒体|媒體
마우스|Mouse|マウス|Ratón|鼠标|滑鼠
사용 안 함|Disabled|無効|Desactivado|禁用|停用
장치의 현재 동작|Current device action|デバイスの現在の動作|Acción actual del dispositivo|设备当前操作|裝置目前動作
장치의 동작 유지|Keep device action|デバイスの動作を保持|Conservar acción del dispositivo|保留设备操作|保留裝置動作
입력 없음|No input|入力なし|Sin entrada|无输入|無輸入
키 조합|Key combination|キーの組み合わせ|Combinación de teclas|组合键|組合鍵
예: CTRL + C|Example: CTRL + C|例: CTRL + C|Ejemplo: CTRL + C|例如：CTRL + C|例如：CTRL + C
복사|Copy|コピー|Copiar|复制|複製
실행 취소|Undo|元に戻す|Deshacer|撤销|復原
검색|Search|検索|Buscar|搜索|搜尋
동작 설정|Set action|動作を設定|Asignar acción|设置操作|設定動作
원래 동작 유지로 변경|Change to keep original action|元の動作を保持に変更|Cambiar a conservar acción original|改为保留原操作|改為保留原動作
순서대로 입력할 키|Keys to enter in order|順に入力するキー|Teclas en orden|按顺序输入的按键|依序輸入的按鍵
위에서 아래로 실행합니다. 보조키 포함 최대 14개 입력. 대기 시간은 지원하지 않습니다.|Runs from top to bottom. Up to 14 inputs including modifiers. Delays are not supported.|上から順に実行します。修飾キーを含め最大14入力。待機時間には対応しません。|Se ejecuta de arriba abajo. Hasta 14 entradas, incluidos modificadores. No admite pausas.|从上到下执行，含修饰键最多 14 次输入，不支持延迟。|由上而下執行，含修飾鍵最多 14 次輸入，不支援延遲。
한 줄에 한 동작 · 최대 14개 입력 ⓘ|One action per line · up to 14 inputs ⓘ|1行に1動作・最大14入力 ⓘ|Una acción por línea · hasta 14 entradas ⓘ|每行一个操作 · 最多 14 次输入 ⓘ|每行一個動作 · 最多 14 次輸入 ⓘ
미디어 동작|Media action|メディア操作|Acción multimedia|媒体操作|媒體動作
마우스 동작|Mouse action|マウス操作|Acción de ratón|鼠标操作|滑鼠動作
음량 높이기|Volume up|音量を上げる|Subir volumen|增大音量|提高音量
음량 낮추기|Volume down|音量を下げる|Bajar volumen|减小音量|降低音量
음소거|Mute|ミュート|Silenciar|静音|靜音
재생 / 일시 정지|Play / pause|再生・一時停止|Reproducir / pausar|播放 / 暂停|播放 / 暫停
다음 곡|Next track|次の曲|Pista siguiente|下一曲|下一首
이전 곡|Previous track|前の曲|Pista anterior|上一曲|上一首
재생 정지|Stop playback|再生を停止|Detener reproducción|停止播放|停止播放
왼쪽 클릭|Left click|左クリック|Clic izquierdo|左键单击|左鍵點擊
오른쪽 클릭|Right click|右クリック|Clic derecho|右键单击|右鍵點擊
가운데 클릭|Middle click|中クリック|Clic central|中键单击|中鍵點擊
위로 스크롤|Scroll up|上にスクロール|Desplazar arriba|向上滚动|向上捲動
아래로 스크롤|Scroll down|下にスクロール|Desplazar abajo|向下滚动|向下捲動
파일 내보내기|Export file|ファイルを書き出す|Exportar archivo|导出文件|匯出檔案
장치에 복원|Restore to device|デバイスに復元|Restaurar en dispositivo|恢复到设备|還原至裝置
삭제|Delete|削除|Eliminar|删除|刪除
키보드 연결됨|Keyboard connected|キーボード接続済み|Teclado conectado|键盘已连接|鍵盤已連線
수동 상태·LED|Manual status & LED|手動の状態とLED|Estado y LED manuales|手动状态与 LED|手動狀態與 LED
처리 중…|Working…|処理中…|Procesando…|处理中…|處理中…
동작 읽음|Actions read|動作を読み込み済み|Acciones leídas|已读取操作|已讀取動作
연결됨|Connected|接続済み|Conectado|已连接|已連線
연결됨 · 현재 동작 표시 중|Connected · showing current actions|接続済み・現在の動作を表示中|Conectado · mostrando acciones actuales|已连接 · 正在显示当前操作|已連線 · 正在顯示目前動作
실기 미검증 · 동작 읽음|Hardware unverified · actions read|実機未検証・動作を読み込み済み|Hardware sin verificar · acciones leídas|实机未验证 · 已读取操作|實機未驗證 · 已讀取動作
실기 미검증 · 연결됨|Hardware unverified · connected|実機未検証・接続済み|Hardware sin verificar · conectado|实机未验证 · 已连接|實機未驗證 · 已連線
보조앱 연결 전|Companion not connected|補助アプリ未接続|Aplicación auxiliar sin conectar|辅助应用未连接|輔助程式未連線
USB 연결 전|USB not connected|USB未接続|USB sin conectar|USB 未连接|USB 未連線
동작 읽는 중…|Reading actions…|動作を読み込み中…|Leyendo acciones…|正在读取操作…|正在讀取動作…
지원하지 않는 장치|Unsupported device|未対応のデバイス|Dispositivo no compatible|不支持的设备|不支援的裝置
지금 키를 눌러 주세요 · Esc로 취소|Press a key now · Esc to cancel|キーを押してください・Escでキャンセル|Pulse una tecla · Esc para cancelar|请按下按键 · Esc 取消|請按下按鍵 · Esc 取消
키 입력|Capture keys|キー入力|Capturar teclas|捕获按键|擷取按鍵
키·다이얼 동작을 읽고 있습니다…|Reading key and dial actions…|キーとダイヤル動作を読み込み中…|Leyendo acciones de teclas y diales…|正在读取按键和旋钮操作…|正在讀取按鍵和旋鈕動作…
바인딩 제안|Suggested bindings|割り当て案|Asignaciones sugeridas|建议绑定|建議綁定
편집기로 열기|Open in editor|エディターで開く|Abrir en editor|在编辑器中打开|在編輯器中開啟
다운로드·적용|Download & apply|ダウンロードして適用|Descargar y aplicar|下载并应用|下載並套用
데스크톱 앱에서 GitHub 연결 가능|Connect GitHub in the desktop app|GitHub接続はデスクトップアプリで利用可能|Conecte GitHub en la app de escritorio|在桌面应用中连接 GitHub|在桌面應用程式中連接 GitHub
저장한 토큰|Saved token|保存済みトークン|Token guardado|已保存令牌|已儲存權杖
GitHub 연결 필요|Connect to GitHub|GitHub接続が必要|Conexión a GitHub necesaria|需要连接 GitHub|需要連接 GitHub
카탈로그를 불러오는 중…|Loading catalog…|カタログを読み込み中…|Cargando catálogo…|正在加载目录…|正在載入目錄…
GitHub 카탈로그를 불러오는 중…|Loading GitHub catalog…|GitHubカタログを読み込み中…|Cargando catálogo de GitHub…|正在加载 GitHub 目录…|正在載入 GitHub 目錄…
조건에 맞는 키맵이 없습니다.|No keymaps match these filters.|条件に一致するキーマップはありません。|No hay mapas que coincidan.|没有符合条件的键位。|沒有符合條件的鍵位。
GitHub에 연결한 뒤 새로고침하세요. 기본 샘플도 바로 사용할 수 있습니다.|Connect GitHub and refresh. Bundled samples are available now.|GitHubに接続して更新してください。付属サンプルはすぐに使えます。|Conecte GitHub y actualice. Los ejemplos incluidos ya están disponibles.|连接 GitHub 后刷新，也可直接使用内置示例。|連接 GitHub 後重新整理，也可直接使用內建範例。
샘플을 불러오는 중…|Loading samples…|サンプルを読み込み中…|Cargando ejemplos…|正在加载示例…|正在載入範例…
상태 규칙 사용 중|State rules enabled|状態ルール有効|Reglas de estado activas|状态规则已启用|狀態規則已啟用
LED 설정 가능|LED settings available|LED設定が可能|LED configurables|可设置 LED|可設定 LED
읽기 전용|Read only|読み取り専用|Solo lectura|只读|唯讀
설정 확인 실패|Could not check settings|設定の確認に失敗|No se pudieron comprobar los ajustes|检查设置失败|檢查設定失敗
수동 LED 적용|Manual LED control|手動LED制御|Control LED manual|手动 LED 控制|手動 LED 控制
미리보기 모드|Preview mode|プレビューモード|Modo de vista previa|预览模式|預覽模式
미리보기 전용|Preview only|プレビューのみ|Solo vista previa|仅预览|僅預覽
설정 동기화 실패|Settings sync failed|設定の同期に失敗|Falló la sincronización|设置同步失败|設定同步失敗
장치 저장 확인|Device save verified|デバイスへの保存を確認|Guardado del dispositivo verificado|已确认设备保存|已確認裝置儲存
처리 대기|Queued|処理待ち|En espera|等待处理|等待處理
상태 확인|Checking status|状態を確認|Comprobando estado|检查状态|檢查狀態
원래 LED 복원 확인|Original LEDs restored|元のLEDへの復元を確認|LED originales restaurados|已确认原始 LED 恢复|已確認原始 LED 還原
복원 확인 대기|Awaiting restore verification|復元確認待ち|Esperando verificar restauración|等待恢复确认|等待還原確認
알 수 없음|Unknown|不明|Desconocido|未知|未知
장치 작업 중|Device operation in progress|デバイス処理中|Operación del dispositivo en curso|设备操作中|裝置操作中
키 입력 진단|Input diagnostics|キー入力診断|Diagnóstico de entrada|按键输入诊断|按鍵輸入診斷
설정 화면과 같은 노브 방향을 확인하고, 왼쪽 위부터 오른쪽으로 누르세요.|Check the dial orientation matches the editor, then press keys left to right from the top left.|設定画面とダイヤルの向きが同じか確認し、左上から右へキーを押してください。|Compruebe la orientación de los diales y pulse las teclas de izquierda a derecha desde arriba.|确认旋钮方向与设置界面一致，然后从左上方向右依次按键。|確認旋鈕方向與設定畫面一致，再從左上方向右依序按鍵。
진단 닫기|Close diagnostics|診断を閉じる|Cerrar diagnóstico|关闭诊断|關閉診斷
일시 정지|Paused|一時停止|En pausa|已暂停|已暫停
측정 시작|Start capture|測定を開始|Iniciar captura|开始测量|開始測量
진단 레이어|Diagnostic layer|診断レイヤー|Capa de diagnóstico|诊断图层|診斷圖層
설정 다시 읽기|Read settings again|設定を再読み込み|Volver a leer ajustes|重新读取设置|重新讀取設定
다이얼 방향|Dial orientation|ダイヤルの向き|Orientación de diales|旋钮方向|旋鈕方向
실제 입력|Observed input|実際の入力|Entrada observada|实际输入|實際輸入
키를 눌러 주세요|Press a key|キーを押してください|Pulse una tecla|请按下按键|請按下按鍵
파란색: 선택 레이어에서 일치하는 후보|Blue: matching candidates on the selected layer|青色：選択レイヤーで一致する候補|Azul: coincidencias en la capa seleccionada|蓝色：所选图层中匹配的候选项|藍色：所選圖層中相符的候選項
선택 레이어의 설정만 비교합니다. 실제 장치 레이어는 키보드에서 전환합니다.|Only the selected layer is compared. Switch the actual device layer on the keyboard.|選択したレイヤーの設定のみ比較します。実際のレイヤーはキーボードで切り替えます。|Solo se compara la capa seleccionada. La capa real se cambia en el teclado.|仅比较所选图层的设置，实际设备图层请在键盘上切换。|僅比較所選圖層的設定，實際裝置圖層請在鍵盤上切換。
입력 기록|Input history|入力履歴|Historial de entrada|输入记录|輸入紀錄
기록 지우기|Clear history|履歴を消去|Borrar historial|清除记录|清除紀錄
측정 파일 저장|Save capture file|測定ファイルを保存|Guardar captura|保存测量文件|儲存測量檔案
측정 중 이 앱의 입력 동작을 차단합니다. 다른 앱으로 이동하면 정지합니다. OS 예약 키·미디어 키는 감지되지 않을 수 있습니다. 일반 키보드 입력도 포함되며, 물리 장치 구분은 할 수 없습니다.|App input is blocked during capture. Switching apps pauses capture. OS shortcuts and media keys may not be detected. Input from other keyboards is included; physical devices cannot be distinguished.|測定中はこのアプリの入力動作を抑止します。別のアプリに移ると停止します。OS予約キーやメディアキーは検出できない場合があります。他のキーボード入力も含まれ、物理デバイスは区別できません。|Durante la captura se bloquea la entrada de esta app. Al cambiar de app se pausa. Puede que no se detecten atajos del sistema ni teclas multimedia. Se incluyen otros teclados y no se distingue el dispositivo físico.|测量时会阻止此应用的输入操作，切换到其他应用会暂停。系统保留键和媒体键可能无法检测。也包含其他键盘输入，无法区分物理设备。|測量時會阻止此應用程式的輸入動作，切換至其他應用程式會暫停。系統保留鍵和媒體鍵可能無法偵測。也包含其他鍵盤輸入，無法區分實體裝置。
오른쪽|Right|右|Derecha|右侧|右側
아래쪽|Bottom|下|Abajo|下方|下方
왼쪽|Left|左|Izquierda|左侧|左側
위쪽|Top|上|Arriba|上方|上方
● 입력 측정 중|● Capturing input|● 入力測定中|● Capturando entrada|● 正在测量输入|● 正在測量輸入
측정 정지|Stop capture|測定を停止|Detener captura|停止测量|停止測量
장치 설정을 읽으면 위치를 비교할 수 있습니다.|Read device settings to compare positions.|デバイス設定を読み込むと位置を比較できます。|Lea los ajustes del dispositivo para comparar posiciones.|读取设备设置后可比较位置。|讀取裝置設定後可比較位置。
장치 설정 읽는 중…|Reading device settings…|デバイス設定を読み込み中…|Leyendo ajustes del dispositivo…|正在读取设备设置…|正在讀取裝置設定…
모델 불일치|Model mismatch|モデル不一致|Modelo distinto|型号不匹配|型號不符
장치의 세 레이어를 읽었습니다.|Read all three device layers.|デバイスの3つのレイヤーを読み込みました。|Se leyeron las tres capas del dispositivo.|已读取设备的三个图层。|已讀取裝置的三個圖層。
장치 연결 후 다시 읽어 주세요.|Connect the device and read again.|デバイスを接続して再読み込みしてください。|Conecte el dispositivo y vuelva a leer.|连接设备后重新读取。|連接裝置後重新讀取。
편집 모델과 연결한 장치 모델이 다릅니다. 모델을 맞춘 뒤 진단을 다시 여세요.|The editor and device models differ. Match the model and reopen diagnostics.|編集モデルと接続デバイスのモデルが異なります。モデルを合わせて診断を開き直してください。|El modelo del editor no coincide con el dispositivo. Corrija el modelo y reabra el diagnóstico.|编辑型号与连接设备不同。匹配型号后重新打开诊断。|編輯型號與連接裝置不同。符合型號後重新開啟診斷。
설정을 읽지 못했습니다. 연결을 확인하세요.|Could not read settings. Check the connection.|設定を読み込めませんでした。接続を確認してください。|No se pudieron leer los ajustes. Compruebe la conexión.|无法读取设置，请检查连接。|無法讀取設定，請檢查連線。
LED 직접 설정|Direct LED settings|LEDを直接設定|Ajustes LED directos|直接设置 LED|直接設定 LED
앱 종료 시 원래 LED로 복원|Original LEDs restored when app quits|アプリ終了時に元のLEDへ復元|LED originales al cerrar la app|退出应用时恢复原始 LED|結束應用程式時還原原始 LED
레이어|Layer|レイヤー|Capa|图层|圖層
직접 설정할 LED 레이어|LED layer to edit directly|直接設定するLEDレイヤー|Capa LED para editar|直接设置的 LED 图层|直接設定的 LED 圖層
모드|Mode|モード|Modo|模式|模式
LED 모드|LED mode|LEDモード|Modo LED|LED 模式|LED 模式
색상|Color|色|Color|颜色|顏色
LED 색상 설정 방식|LED color method|LEDの色設定方法|Método de color LED|LED 颜色设置方式|LED 顏色設定方式
전체 같은 색|Same color for all|すべて同じ色|Mismo color para todos|全部同色|全部同色
슬롯별 색|Color per slot|スロットごとの色|Color por ranura|每槽颜色|每槽顏色
전체 색상|All colors|全体の色|Color general|全部颜色|全部顏色
전체 LED 색상|All LED colors|すべてのLEDの色|Color de todos los LED|全部 LED 颜色|全部 LED 顏色
색상 슬롯 16개|16 color slots|16個の色スロット|16 ranuras de color|16 个颜色槽|16 個顏色槽
현재 LED 불러오기|Load current LEDs|現在のLEDを読み込む|Cargar LED actuales|加载当前 LED|載入目前 LED
LED 적용|Apply LEDs|LEDを適用|Aplicar LED|应用 LED|套用 LED
장치 LED를 불러온 뒤 설정하세요.|Load device LEDs before editing.|デバイスのLEDを読み込んでから設定してください。|Cargue los LED del dispositivo antes de editar.|请先加载设备 LED 再设置。|請先載入裝置 LED 再設定。
원래 LED 복원을 먼저 실행하세요.|Restore original LEDs first.|先に元のLEDに復元してください。|Primero restaure los LED originales.|请先恢复原始 LED。|請先還原原始 LED。
현재 장치 LED를 불러왔습니다.|Current device LEDs loaded.|現在のデバイスLEDを読み込みました。|Se cargaron los LED actuales del dispositivo.|已加载当前设备 LED。|已載入目前裝置 LED。
현재 LED를 불러온 뒤 설정하세요.|Load current LEDs before editing.|現在のLEDを読み込んでから設定してください。|Cargue los LED actuales antes de editar.|请先加载当前 LED 再设置。|請先載入目前 LED 再設定。
원본 LED 백업 후 적용·재읽기 확인 중…|Backing up original LEDs, applying and verifying…|元のLEDをバックアップし、適用・再読み込みで確認中…|Respaldando LED originales, aplicando y verificando…|正在备份原始 LED、应用并重新读取验证…|正在備份原始 LED、套用並重新讀取驗證…
LED 저장 확인 완료 · 모드 효과가 바뀌지 않으면 USB 케이블을 재연결하세요.|LED save verified · reconnect USB if the mode effect does not change.|LED保存を確認・モードの効果が変わらない場合はUSBを再接続してください。|LED guardados y verificados · reconecte USB si no cambia el efecto.|LED 保存已确认 · 若模式效果未改变，请重新连接 USB。|LED 儲存已確認 · 若模式效果未變更，請重新連接 USB。
LED 색상 저장과 재읽기 확인을 마쳤습니다.|LED colors saved and verified by readback.|LEDの色を保存し、再読み込みで確認しました。|Colores LED guardados y verificados mediante lectura.|LED 颜色已保存并重新读取确认。|LED 顏色已儲存並重新讀取確認。
장치에 저장된 LED 값이 이미 같은 설정입니다.|The device already has these LED settings.|デバイスのLEDはすでに同じ設定です。|El dispositivo ya tiene estos ajustes LED.|设备中的 LED 已是相同设置。|裝置中的 LED 已是相同設定。
키 LED 설정|Key LED settings|キーLED設定|Ajustes LED de tecla|按键 LED 设置|按鍵 LED 設定
키 LED|Key LED|キーLED|LED de tecla|按键 LED|按鍵 LED
장치의 현재 색상 유지|Keep current device color|デバイスの現在の色を保持|Conservar color actual del dispositivo|保留设备当前颜色|保留裝置目前顏色
색상 유지|Keep color|色を保持|Conservar color|保留颜色|保留顏色
LED 16색 팔레트|16-color LED palette|LEDの16色パレット|Paleta LED de 16 colores|LED 16 色调色板|LED 16 色調色盤
발광 모드|Lighting mode|発光モード|Modo de iluminación|发光模式|發光模式
레이어 전체|Entire layer|レイヤー全体|Toda la capa|整个图层|整個圖層
레이어 발광 모드|Layer lighting mode|レイヤーの発光モード|Iluminación de la capa|图层发光模式|圖層發光模式
현재 모드 유지|Keep current mode|現在のモードを保持|Conservar modo actual|保留当前模式|保留目前模式
모드 효과가 그대로면 USB 케이블 재연결로 확인하세요.|Reconnect USB if the mode effect stays the same.|モードの効果が変わらない場合はUSBケーブルを再接続して確認してください。|Reconecte USB si el efecto del modo sigue igual.|若模式效果不变，请重新连接 USB 确认。|若模式效果不變，請重新連接 USB 確認。
모드 효과가 바뀌지 않으면 USB 케이블을 재연결하세요. 색상 변경에 항상 필요한 것은 아닙니다.|Reconnect USB if the mode effect does not change. Color changes do not always require this.|モードの効果が変わらない場合はUSBを再接続してください。色の変更では必ずしも必要ではありません。|Reconecte USB si no cambia el efecto del modo. No siempre es necesario para cambiar colores.|若模式效果不变，请重新连接 USB。颜色修改并不总是需要此操作。|若模式效果不變，請重新連接 USB。顏色修改並非每次都需要此操作。
LED 모드 효과가 바뀌지 않으면 USB 케이블을 재연결하세요.|Reconnect USB if the LED mode effect does not change.|LEDモードの効果が変わらない場合はUSBを再接続してください。|Reconecte USB si no cambia el efecto del modo LED.|若 LED 模式效果不变，请重新连接 USB。|若 LED 模式效果不變，請重新連接 USB。
LED 설정 저장을 확인했습니다.|LED settings save verified.|LED設定の保存を確認しました。|Se verificó el guardado de los LED.|已确认 LED 设置保存。|已確認 LED 設定儲存。
`;
export const MESSAGE_ROWS = table.trim().split('\n').map(line => line.split('|'));
