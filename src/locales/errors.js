const table = `
자동 백업|Automatic backup|自動バックアップ|Copia automática|自动备份|自動備份
LED 꺼짐|LED off|LED消灯|LED apagado|LED 已关闭|LED 已關閉
꺼짐|Off|オフ|Apagado|关闭|關閉
LED 색상 {0}|LED color {0}|LEDの色 {0}|Color LED {0}|LED 颜色 {0}|LED 顏色 {0}
{0}개 키 동작 재배치 · 저장 확인 완료{1}|{0} key actions rearranged · save verified{1!}|{0} キー動作を再配置・保存確認済み{1!}|{0} acciones reorganizadas · guardado verificado{1!}|已重排 {0} 个按键操作 · 保存已确认{1!}|已重排 {0} 個按鍵動作 · 儲存已確認{1!}
색상 16개를 #rrggbb 형식으로 선택하세요.|Choose 16 colors in #rrggbb format.|#rrggbb形式で16色を選んでください。|Elija 16 colores en formato #rrggbb.|请选择 16 个 #rrggbb 格式的颜色。|請選擇 16 個 #rrggbb 格式的顏色。
레이어 1~3 중에서 선택하세요.|Choose a layer from 1 to 3.|レイヤー1〜3から選んでください。|Elija una capa de 1 a 3.|请选择图层 1 至 3。|請選擇圖層 1 至 3。
지원 범위의 모드 0~5를 선택하세요.|Choose a supported mode from 0 to 5.|対応するモード0〜5を選んでください。|Elija un modo compatible de 0 a 5.|请选择支持的模式 0 至 5。|請選擇支援的模式 0 至 5。
보조앱으로 키보드를 연결하세요.|Connect the keyboard through the companion.|補助アプリでキーボードを接続してください。|Conecte el teclado mediante la app auxiliar.|请通过辅助应用连接键盘。|請透過輔助程式連接鍵盤。
진행 중인 장치 작업이 끝난 뒤 설정하세요.|Wait for the device operation before changing settings.|デバイス処理が終わってから設定してください。|Espere a que termine la operación antes de ajustar.|请等待设备操作完成后再设置。|請等待裝置操作完成後再設定。
키 설정 작업이 끝난 뒤 LED를 설정하세요.|Finish key settings before editing LEDs.|キー設定が終わってからLEDを設定してください。|Termine los ajustes de teclas antes de editar LED.|请先完成按键设置，再设置 LED。|請先完成按鍵設定，再設定 LED。
연결한 키보드의 LED 읽기를 지원하지 않습니다.|Reading LEDs is not supported on this keyboard.|接続キーボードのLED読み取りには対応していません。|Este teclado no admite lectura de LED.|不支持读取此键盘的 LED。|不支援讀取此鍵盤的 LED。
원래 LED 복원을 먼저 실행한 뒤 다시 설정하세요.|Restore original LEDs before editing again.|元のLEDに復元してから再設定してください。|Restaure los LED originales antes de editar.|请先恢复原始 LED，再重新设置。|請先還原原始 LED，再重新設定。
연결한 키보드의 LED 설정을 지원하지 않습니다.|LED settings are not supported on this keyboard.|接続キーボードのLED設定には対応していません。|Este teclado no admite ajustes LED.|此键盘不支持 LED 设置。|此鍵盤不支援 LED 設定。
장치 LED 읽기 결과가 올바르지 않습니다.|Invalid device LED read result.|デバイスLEDの読み取り結果が不正です。|Resultado de lectura LED no válido.|设备 LED 读取结果无效。|裝置 LED 讀取結果無效。
장치 LED 모드 응답이 올바르지 않습니다.|Invalid device LED mode response.|デバイスLEDのモード応答が不正です。|Respuesta de modo LED no válida.|设备 LED 模式响应无效。|裝置 LED 模式回應無效。
LED 적용 후 장치 재읽기 확인을 받지 못했습니다. 원래 LED 복원으로 확인하세요.|LED readback was not confirmed. Use Restore original LEDs to verify.|LED適用後の再読み込み確認がありません。元のLEDへの復元で確認してください。|No se confirmó la lectura LED. Use Restaurar LED originales para verificar.|未确认 LED 应用后的重新读取，请通过恢复原始 LED 检查。|未確認 LED 套用後的重新讀取，請透過還原原始 LED 檢查。
LED 설정을 표시할 영역이 없습니다.|LED settings area is missing.|LED設定を表示する領域がありません。|Falta el área de ajustes LED.|缺少 LED 设置显示区域。|缺少 LED 設定顯示區域。
키 LED 설정을 지원하지 않는 위치입니다.|Key LED settings are not supported at this position.|この位置のキーLED設定には対応していません。|Esta posición no admite LED de tecla.|此位置不支持按键 LED 设置。|此位置不支援按鍵 LED 設定。
키맵의 LED 설정은 데스크톱 앱 장치 연결이 필요합니다.|Keymap LED settings require a desktop app device connection.|キーマップのLED設定にはデスクトップアプリでの接続が必要です。|Los LED del mapa requieren conectar desde la app de escritorio.|键位 LED 设置需要通过桌面应用连接设备。|鍵位 LED 設定需要透過桌面應用程式連接裝置。
장치 LED 설정을 사용할 수 없습니다. 연결·복구 상태를 확인하세요.|Device LED settings are unavailable. Check connection and recovery state.|デバイスのLED設定を使えません。接続と復旧状態を確認してください。|LED no disponibles. Compruebe conexión y recuperación.|设备 LED 设置不可用，请检查连接和恢复状态。|裝置 LED 設定無法使用，請檢查連線與復原狀態。
현재 LED 설정을 확인할 수 없습니다.|Could not verify current LED settings.|現在のLED設定を確認できません。|No se pudieron verificar los LED actuales.|无法确认当前 LED 设置。|無法確認目前 LED 設定。
LED 모드를 0~5 중에서 선택하세요.|Choose an LED mode from 0 to 5.|LEDモード0〜5から選んでください。|Elija un modo LED de 0 a 5.|请选择 LED 模式 0 至 5。|請選擇 LED 模式 0 至 5。
LED 색상·모드 저장 및 재읽기 확인 중…|Saving LED colors and modes, verifying readback…|LEDの色とモードを保存・再読み込み確認中…|Guardando colores y modos LED y verificando lectura…|正在保存 LED 颜色和模式并重新读取验证…|正在儲存 LED 顏色和模式並重新讀取驗證…
LED 재읽기 검증 결과를 받지 못했습니다.|LED readback verification result was not received.|LEDの再読み込み検証結果がありません。|No se recibió la verificación de lectura LED.|未收到 LED 重新读取验证结果。|未收到 LED 重新讀取驗證結果。
지원하지 않는 키 이름입니다.|Unsupported key name.|未対応のキー名です。|Nombre de tecla no compatible.|不支持的键名。|不支援的鍵名。
조합키에 같은 키를 중복할 수 없습니다.|A key combination cannot repeat the same key.|キーの組み合わせで同じキーは重複できません。|No se puede repetir una tecla en una combinación.|组合键中不能重复同一按键。|組合鍵中不能重複相同按鍵。
조합키에는 일반 키를 하나만 사용할 수 있습니다.|Use only one non-modifier key per combination.|組み合わせには通常キーを1つだけ指定できます。|Use solo una tecla normal por combinación.|每个组合只能使用一个普通键。|每個組合只能使用一個一般鍵。
키맵 수정 날짜가 올바르지 않습니다.|Invalid keymap modification date.|キーマップの更新日時が不正です。|Fecha de modificación no válida.|键位修改日期无效。|鍵位修改日期無效。
동작 형식이 올바르지 않습니다.|Invalid action format.|動作の形式が不正です。|Formato de acción no válido.|操作格式无效。|動作格式無效。
동작에는 일반 데이터만 사용할 수 있습니다.|Actions must contain plain data.|動作には通常のデータのみ使用できます。|Las acciones deben contener datos simples.|操作只能包含普通数据。|動作只能包含一般資料。
원래 동작 유지에는 기능 이름을 지정할 수 없습니다.|A preserved action cannot have a function name.|元の動作を保持する場合、機能名は指定できません。|Una acción conservada no puede tener nombre de función.|保留原操作时不能指定功能名称。|保留原動作時不能指定功能名稱。
매크로는 보조키와 단계 구분을 포함해 최대 14개 입력 항목을 지원합니다.|Macros support up to 14 input entries, including modifiers and step boundaries.|マクロは修飾キーと段階区切りを含め最大14入力です。|Las macros admiten 14 entradas, incluidos modificadores y separadores.|宏最多支持 14 个输入项，包含修饰键和步骤分隔。|巨集最多支援 14 個輸入項，包含修飾鍵和步驟分隔。
지원하지 않는 미디어 또는 마우스 동작입니다.|Unsupported media or mouse action.|未対応のメディアまたはマウス動作です。|Acción multimedia o de ratón no compatible.|不支持的媒体或鼠标操作。|不支援的媒體或滑鼠動作。
지원하지 않는 동작 유형입니다.|Unsupported action type.|未対応の動作の種類です。|Tipo de acción no compatible.|不支持的操作类型。|不支援的動作類型。
지원하지 않는 키맵 형식 또는 버전입니다.|Unsupported keymap format or version.|未対応のキーマップ形式またはバージョンです。|Formato o versión de mapa no compatible.|不支持的键位格式或版本。|不支援的鍵位格式或版本。
연결 앱 ID가 올바르지 않습니다.|Invalid linked app ID.|連携アプリIDが不正です。|ID de app vinculada no válido.|关联应用 ID 无效。|關聯應用程式 ID 無效。
회전은 0, 90, 180, 270도 중에서 선택해 주세요.|Choose 0, 90, 180, or 270 degrees.|角度は0、90、180、270度から選んでください。|Elija 0, 90, 180 o 270 grados.|请选择 0、90、180 或 270 度。|請選擇 0、90、180 或 270 度。
공유 링크가 너무 깁니다. JSON 파일로 내보내 주세요.|Share link is too long. Export a JSON file.|共有リンクが長すぎます。JSONファイルに書き出してください。|El enlace es demasiado largo. Exporte a JSON.|分享链接过长，请导出为 JSON 文件。|分享連結過長，請匯出為 JSON 檔案。
공유 링크 형식이나 길이가 올바르지 않습니다.|Invalid share link format or length.|共有リンクの形式または長さが不正です。|Formato o longitud del enlace no válidos.|分享链接格式或长度无效。|分享連結格式或長度無效。
잘못된 인코딩입니다.|Invalid encoding.|不正なエンコーディングです。|Codificación no válida.|编码无效。|編碼無效。
저장소를 사용할 수 없습니다.|Storage is unavailable.|ストレージを利用できません。|Almacenamiento no disponible.|存储不可用。|儲存空間無法使用。
브라우저 저장소에 접근할 수 없습니다. 저장 권한을 확인하거나 JSON 파일로 내보내 주세요.|Cannot access browser storage. Check permissions or export as JSON.|ブラウザーストレージにアクセスできません。権限を確認するかJSONで書き出してください。|No se puede acceder al almacenamiento. Revise permisos o exporte JSON.|无法访问浏览器存储，请检查权限或导出为 JSON。|無法存取瀏覽器儲存空間，請檢查權限或匯出為 JSON。
브라우저 저장 공간이 부족합니다. 키맵을 파일로 내보내고 보관함의 불필요한 키맵을 삭제해 주세요.|Browser storage is full. Export keymaps and remove unneeded library entries.|ブラウザーの容量が不足しています。キーマップを書き出し、不要なものを削除してください。|Almacenamiento lleno. Exporte los mapas y quite los que no necesite.|浏览器存储已满，请导出键位并删除不需要的键位库项目。|瀏覽器儲存空間已滿，請匯出鍵位並刪除不需要的鍵位庫項目。
보관함을 저장할 수 없습니다. 브라우저 저장 권한을 확인하고 JSON 파일로 내보내 주세요.|Cannot save library. Check browser storage permissions and export as JSON.|ライブラリを保存できません。保存権限を確認しJSONで書き出してください。|No se puede guardar la biblioteca. Revise permisos y exporte JSON.|无法保存键位库，请检查浏览器存储权限并导出为 JSON。|無法儲存鍵位庫，請檢查瀏覽器儲存權限並匯出為 JSON。
보관함에는 최대 50개 키맵을 저장할 수 있습니다. 불필요한 키맵을 삭제해 주세요.|The library holds up to 50 keymaps. Remove unneeded entries.|ライブラリは最大50件です。不要なキーマップを削除してください。|La biblioteca admite 50 mapas. Elimine los que no necesite.|键位库最多保存 50 个键位，请删除不需要的项目。|鍵位庫最多儲存 50 個鍵位，請刪除不需要的項目。
장치 연결이 끊어졌습니다. USB 연결 후 백업을 확인하세요.|Device disconnected. Reconnect USB and check the backup.|デバイスが切断されました。USBを接続してバックアップを確認してください。|Dispositivo desconectado. Reconecte USB y revise la copia.|设备已断开，请重新连接 USB 并检查备份。|裝置已中斷，請重新連接 USB 並檢查備份。
장치가 연결되어 있지 않습니다.|No device is connected.|デバイスが接続されていません。|No hay dispositivo conectado.|设备未连接。|裝置未連線。
지원하는 Mini Keyboard 장치가 아닙니다.|This Mini Keyboard device is not supported.|対応するMini Keyboardではありません。|Este Mini Keyboard no es compatible.|不是受支持的 Mini Keyboard 设备。|不是受支援的 Mini Keyboard 裝置。
연결된 장치의 모델 응답이 바뀌었습니다. 다시 연결하세요.|Device model response changed. Reconnect it.|デバイスのモデル応答が変わりました。再接続してください。|Cambió el modelo informado. Vuelva a conectar.|设备型号响应已变更，请重新连接。|裝置型號回應已變更，請重新連接。
장치 응답을 기다리고 있습니다.|Waiting for device response.|デバイスの応答を待っています。|Esperando respuesta del dispositivo.|正在等待设备响应。|正在等待裝置回應。
장치 응답 시간 초과. MINI_KEYBOARD 앱을 닫고 USB 연결과 브라우저 권한을 확인하세요.|Device timed out. Close MINI_KEYBOARD and check USB and browser permissions.|デバイス応答がタイムアウトしました。MINI_KEYBOARDを閉じ、USBとブラウザー権限を確認してください。|Tiempo de espera agotado. Cierre MINI_KEYBOARD y revise USB y permisos.|设备响应超时，请关闭 MINI_KEYBOARD 并检查 USB 连接和浏览器权限。|裝置回應逾時，請關閉 MINI_KEYBOARD 並檢查 USB 連線及瀏覽器權限。
중복된 동작 ID 응답을 받았습니다.|Received duplicate action IDs.|動作IDが重複した応答です。|Se recibieron ID de acción duplicados.|收到重复的操作 ID。|收到重複的動作 ID。
지원되지 않은 모델입니다. 모델 변경은 자동 실행하지 않습니다.|Unsupported model. Model switching is not automatic.|未対応のモデルです。モデルの変更は自動実行しません。|Modelo no compatible. No se cambia automáticamente.|不支持此型号，不会自动切换型号。|不支援此型號，不會自動切換型號。
장치 설정 작업이 진행 중입니다.|Device settings operation in progress.|デバイス設定を処理中です。|Ajustando el dispositivo.|设备设置操作正在进行。|裝置設定操作正在進行。
다른 탭에서 장치 설정 중입니다.|Another tab is configuring the device.|別のタブがデバイスを設定中です。|Otra pestaña está configurando el dispositivo.|其他标签页正在设置设备。|其他分頁正在設定裝置。
원본 백업 저장 경로가 필요합니다.|A location to save the original backup is required.|元のバックアップを保存する場所が必要です。|Se necesita una ruta para guardar la copia original.|需要原始备份保存路径。|需要原始備份儲存路徑。
장치 설정이 이미 동일합니다.|Device settings already match.|デバイス設定はすでに同じです。|El dispositivo ya tiene estos ajustes.|设备设置已相同。|裝置設定已相同。
적용에 실패해 원본 설정을 복원합니다.|Apply failed. Restoring original settings.|適用に失敗したため元の設定を復元します。|Falló la aplicación. Restaurando ajustes originales.|应用失败，正在恢复原始设置。|套用失敗，正在還原原始設定。
원본 복원과 재읽기 확인 완료.|Original settings restored and readback verified.|元の設定を復元し、再読み込みで確認しました。|Ajustes originales restaurados y lectura verificada.|原始设置已恢复并重新读取确认。|原始設定已還原並重新讀取確認。
키맵과 연결된 장치의 모델이 다릅니다.|Keymap and device models differ.|キーマップとデバイスのモデルが異なります。|El modelo del mapa y del dispositivo son distintos.|键位与设备型号不同。|鍵位與裝置型號不同。
설정 기록과 검증이 끝난 뒤 연결을 해제하세요.|Wait for writing and verification before disconnecting.|設定の書き込みと検証が終わってから切断してください。|Espere a terminar la escritura y verificación antes de desconectar.|请等待设置写入和验证完成后再断开。|請等待設定寫入和驗證完成後再中斷。
HTTPS 또는 localhost에서 열어 주세요.|Open using HTTPS or localhost.|HTTPSまたはlocalhostで開いてください。|Abra con HTTPS o localhost.|请使用 HTTPS 或 localhost 打开。|請使用 HTTPS 或 localhost 開啟。
Chrome 또는 Edge 데스크톱에서 열어 주세요.|Open in desktop Chrome or Edge.|デスクトップ版ChromeまたはEdgeで開いてください。|Abra en Chrome o Edge de escritorio.|请使用桌面版 Chrome 或 Edge 打开。|請使用桌面版 Chrome 或 Edge 開啟。
선택된 설정용 장치가 없습니다. USB 케이블로 연결한 뒤 다시 선택하세요.|No configuration device selected. Connect USB and select again.|設定用デバイスが未選択です。USBで接続して選択し直してください。|Ningún dispositivo seleccionado. Conecte USB y vuelva a elegir.|未选择设置设备，请连接 USB 后重新选择。|未選擇設定裝置，請連接 USB 後重新選擇。
보조 앱 런타임을 먼저 준비하세요.|Set up the companion runtime first.|先に補助アプリの実行環境を準備してください。|Prepare primero el entorno de la app auxiliar.|请先准备辅助应用运行环境。|請先準備輔助程式執行環境。
보조 앱 요청 실패|Companion request failed|補助アプリへの要求に失敗|Falló la solicitud a la app auxiliar|辅助应用请求失败|輔助程式請求失敗
USB 연결이 끊어졌거나 갱신되었습니다. 케이블 연결을 확인한 뒤 장치를 다시 연결하세요.|USB connection was lost or changed. Check the cable and reconnect.|USB接続が切断または更新されました。ケーブルを確認して再接続してください。|Se perdió o cambió USB. Revise el cable y reconecte.|USB 连接已断开或变更，请检查线缆后重新连接设备。|USB 連線已中斷或變更，請檢查線材後重新連接裝置。
이전 트랜잭션 종료를 확인해야 합니다. 다시 연결해 복구하세요.|The previous transaction must finish. Reconnect to recover.|前のトランザクション終了を確認する必要があります。再接続して復旧してください。|Debe terminar la transacción anterior. Reconecte para recuperar.|需要确认上一次事务结束，请重新连接以恢复。|需要確認上一次交易結束，請重新連接以復原。
장치 설정 작업이 중단되어 원본으로 복구됐습니다. 적용 상태를 다시 읽어 확인하세요.|Device operation was interrupted and original settings restored. Read settings again to verify.|設定処理が中断され元に復旧しました。設定を再読み込みして確認してください。|La operación se interrumpió y se restauró el original. Vuelva a leer para verificar.|设备设置操作中断并已恢复原始设置，请重新读取确认。|裝置設定操作中斷並已還原原始設定，請重新讀取確認。
진행 중인 장치 작업을 먼저 마친 뒤 다시 연결하세요.|Finish the device operation before reconnecting.|デバイス処理が終わってから再接続してください。|Termine la operación antes de reconectar.|请先完成设备操作再重新连接。|請先完成裝置操作再重新連接。
키보드 연결이 변경되었습니다. 장치를 다시 연결하세요.|Keyboard connection changed. Reconnect the device.|キーボードの接続が変わりました。デバイスを再接続してください。|Cambió la conexión del teclado. Reconecte el dispositivo.|键盘连接已变更，请重新连接设备。|鍵盤連線已變更，請重新連接裝置。
다른 탭에서 장치 설정 중입니다. 작업이 중단됐다면 {0}초 후 다시 연결해 원본을 복구하세요.|Another tab is configuring the device. If interrupted, reconnect after {0} seconds to recover original settings.|別のタブが設定中です。処理が中断された場合は{0}秒後に再接続して復旧してください。|Otra pestaña está configurando. Si se interrumpió, reconecte en {0} segundos para recuperar.|其他标签页正在设置设备。如操作已中断，请在 {0} 秒后重新连接以恢复。|其他分頁正在設定裝置。如操作已中斷，請在 {0} 秒後重新連接以復原。
GitHub 토큰 형식이 올바르지 않습니다.|Invalid GitHub token format.|GitHubトークンの形式が不正です。|Formato de token de GitHub no válido.|GitHub 令牌格式无效。|GitHub 權杖格式無效。
시스템 암호화를 사용할 수 없어 토큰을 저장하거나 읽을 수 없습니다.|System encryption is unavailable. Cannot save or read tokens.|システム暗号化を使えないためトークンを保存・読み取りできません。|Cifrado del sistema no disponible. No se pueden guardar ni leer tokens.|系统加密不可用，无法保存或读取令牌。|系統加密無法使用，無法儲存或讀取權杖。
저장된 GitHub 인증을 읽지 못했습니다.|Could not read saved GitHub credentials.|保存済みGitHub認証を読み込めません。|No se pudieron leer credenciales de GitHub.|无法读取已保存的 GitHub 凭据。|無法讀取已儲存的 GitHub 認證。
저장된 GitHub 인증을 복호화하지 못했습니다. 토큰을 다시 등록하세요.|Could not decrypt GitHub credentials. Register the token again.|GitHub認証を復号できません。トークンを再登録してください。|No se pudieron descifrar credenciales. Registre el token de nuevo.|无法解密 GitHub 凭据，请重新注册令牌。|無法解密 GitHub 認證，請重新登錄權杖。
GitHub 인증이 필요합니다. gh 로그인 또는 읽기 전용 토큰을 등록하세요.|GitHub authentication required. Sign in with gh or add a read-only token.|GitHub認証が必要です。ghでログインするか読み取り専用トークンを登録してください。|Se necesita autenticación de GitHub. Inicie sesión con gh o añada un token de lectura.|需要 GitHub 认证，请通过 gh 登录或添加只读令牌。|需要 GitHub 認證，請透過 gh 登入或新增唯讀權杖。
GitHub에 연결하지 못했습니다. 네트워크를 확인하세요.|Could not connect to GitHub. Check your network.|GitHubに接続できません。ネットワークを確認してください。|No se pudo conectar a GitHub. Revise la red.|无法连接 GitHub，请检查网络。|無法連接 GitHub，請檢查網路。
GitHub 요청 실패 ({0}). 저장소 접근 권한을 확인하세요.|GitHub request failed ({0}). Check repository access.|GitHub要求に失敗（{0}）。リポジトリの権限を確認してください。|Solicitud de GitHub fallida ({0}). Revise el acceso al repositorio.|GitHub 请求失败（{0}），请检查仓库访问权限。|GitHub 請求失敗（{0}），請檢查儲存庫存取權限。
카탈로그 캐시가 손상되었습니다.|Catalog cache is corrupted.|カタログキャッシュが破損しています。|Caché del catálogo dañada.|目录缓存已损坏。|目錄快取已損毀。
키맵 SHA-256 검증에 실패했습니다. 새로고침 후 다시 시도하세요.|Keymap SHA-256 verification failed. Refresh and retry.|キーマップのSHA-256検証に失敗しました。更新して再試行してください。|Falló la verificación SHA-256. Actualice y reintente.|键位 SHA-256 验证失败，请刷新后重试。|鍵位 SHA-256 驗證失敗，請重新整理後再試。
키맵과 카탈로그 정보가 일치하지 않습니다.|Keymap and catalog details do not match.|キーマップとカタログ情報が一致しません。|El mapa no coincide con el catálogo.|键位与目录信息不一致。|鍵位與目錄資訊不一致。
저장된 카탈로그가 손상되었습니다. 온라인에서 새로고침하세요.|Saved catalog is corrupted. Refresh while online.|保存済みカタログが破損しています。オンラインで更新してください。|El catálogo guardado está dañado. Actualice con conexión.|保存的目录已损坏，请联网刷新。|已儲存目錄已損毀，請連線後重新整理。
카탈로그에서 키맵을 찾지 못했습니다. 새로고침하세요.|Keymap not found in catalog. Refresh it.|カタログにキーマップがありません。更新してください。|Mapa no encontrado. Actualice el catálogo.|目录中未找到键位，请刷新。|目錄中找不到鍵位，請重新整理。
저장된 키맵 SHA-256/형식 검증에 실패했습니다. 온라인에서 다시 다운로드하세요.|Cached keymap failed SHA-256 or format checks. Download it again online.|保存済みキーマップのSHA-256または形式が不正です。オンラインで再ダウンロードしてください。|El mapa guardado no pasó la verificación. Descárguelo de nuevo con conexión.|缓存键位未通过 SHA-256 或格式检查，请联网重新下载。|快取鍵位未通過 SHA-256 或格式檢查，請連線後重新下載。
장치 연결 상태를 확인할 수 없습니다. USB 연결을 확인한 뒤 다시 연결하세요.|Cannot verify device connection. Check USB and reconnect.|デバイスの接続状態を確認できません。USBを確認して再接続してください。|No se puede verificar la conexión. Revise USB y reconecte.|无法确认设备连接状态，请检查 USB 后重新连接。|無法確認裝置連線狀態，請檢查 USB 後重新連接。
`;
export const ERROR_ROWS = table.trim().split('\n').map(line=>line.split('|'));
