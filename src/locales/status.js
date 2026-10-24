// Variable captures are opaque unless a target placeholder explicitly uses !.
const table = `
레이어 {0}|Layer {0}|レイヤー {0}|Capa {0}|图层 {0}|圖層 {0}
모드 {0}|Mode {0}|モード {0}|Modo {0}|模式 {0}|模式 {0}
장치 모드 {0} (읽기값)|Device mode {0} (read value)|デバイスモード {0}（読み取り値）|Modo del dispositivo {0} (leído)|设备模式 {0}（读取值）|裝置模式 {0}（讀取值）
LED 색상 슬롯 {0}|LED color slot {0}|LED色スロット {0}|Ranura de color LED {0}|LED 颜色槽 {0}|LED 顏色槽 {0}
{0} 색|{0!} color|{0!}の色|Color de {0!}|{0!}颜色|{0!}顏色
{0} 레이어|{0!} layer|{0!}のレイヤー|Capa de {0!}|{0!}图层|{0!}圖層
{0}키 · {1}다이얼|{0} keys · {1} dials|{0}キー・{1}ダイヤル|{0} teclas · {1} diales|{0} 键 · {1} 旋钮|{0} 鍵 · {1} 旋鈕
{0}키 / {1}다이얼|{0} keys / {1} dials|{0}キー / {1}ダイヤル|{0} teclas / {1} diales|{0} 键 / {1} 旋钮|{0} 鍵 / {1} 旋鈕
{0} · 실기 미검증|{0!} · hardware unverified|{0!}・実機未検証|{0!} · hardware sin verificar|{0!} · 实机未验证|{0!} · 實機未驗證
키 {0}|Key {0}|キー {0}|Tecla {0}|按键 {0}|按鍵 {0}
다이얼 {0}|Dial {0}|ダイヤル {0}|Dial {0}|旋钮 {0}|旋鈕 {0}
다이얼 {0} · 왼쪽 회전|Dial {0} · turn left|ダイヤル {0}・左に回す|Dial {0} · girar a la izquierda|旋钮 {0} · 向左旋转|旋鈕 {0} · 向左旋轉
다이얼 {0} · 누르기|Dial {0} · press|ダイヤル {0}・押す|Dial {0} · pulsar|旋钮 {0} · 按下|旋鈕 {0} · 按下
다이얼 {0} · 오른쪽 회전|Dial {0} · turn right|ダイヤル {0}・右に回す|Dial {0} · girar a la derecha|旋钮 {0} · 向右旋转|旋鈕 {0} · 向右旋轉
키 {0}: {1}|Key {0}: {1}|キー {0}: {1}|Tecla {0}: {1}|按键 {0}：{1}|按鍵 {0}：{1}
다이얼 {0} 누르기: {1}|Dial {0} press: {1}|ダイヤル {0}を押す: {1}|Pulsar dial {0}: {1}|旋钮 {0} 按下：{1}|旋鈕 {0} 按下：{1}
다이얼 {0} 왼쪽 회전: {1}|Dial {0} left: {1}|ダイヤル {0}を左へ: {1}|Dial {0} a la izquierda: {1}|旋钮 {0} 向左：{1}|旋鈕 {0} 向左：{1}
다이얼 {0} 오른쪽 회전: {1}|Dial {0} right: {1}|ダイヤル {0}を右へ: {1}|Dial {0} a la derecha: {1}|旋钮 {0} 向右：{1}|旋鈕 {0} 向右：{1}
레이어 {0} / 키 {1}|Layer {0} / Key {1}|レイヤー {0} / キー {1}|Capa {0} / Tecla {1}|图层 {0} / 按键 {1}|圖層 {0} / 按鍵 {1}
레이어 {0} / 다이얼 {1} · {2}|Layer {0} / Dial {1} · {2!}|レイヤー {0} / ダイヤル {1}・{2!}|Capa {0} / Dial {1} · {2!}|图层 {0} / 旋钮 {1} · {2!}|圖層 {0} / 旋鈕 {1} · {2!}
편집: {0}|Draft: {0}|編集中: {0}|Borrador: {0}|编辑：{0}|編輯：{0}
현재: {0}|Current: {0}|現在: {0}|Actual: {0}|当前：{0}|目前：{0}
현재: {0} / 편집: {1}|Current: {0} / Draft: {1}|現在: {0} / 編集中: {1}|Actual: {0} / Borrador: {1}|当前：{0} / 编辑：{1}|目前：{0} / 編輯：{1}
{0} 삭제|Delete {0}|{0}を削除|Eliminar {0}|删除 {0}|刪除 {0}
{0} 백업 삭제|Delete backup {0}|{0}のバックアップを削除|Eliminar copia {0}|删除备份 {0}|刪除備份 {0}
{0} · 적용 전 키·다이얼 동작|{0} · key and dial actions before apply|{0}・適用前のキーとダイヤル動作|{0} · acciones antes de aplicar|{0} · 应用前按键和旋钮操作|{0} · 套用前按鍵和旋鈕動作
{0} 편집됨|{0!} edited|{0!}を編集しました|{0!} editado|已编辑 {0!}|已編輯 {0!}
레이어 {0}의 {1}개 동작을 복사했습니다.|Copied {1} actions from layer {0}.|レイヤー {0} の {1} 動作をコピーしました。|Se copiaron {1} acciones de la capa {0}.|已复制图层 {0} 的 {1} 个操作。|已複製圖層 {0} 的 {1} 個動作。
레이어 {0}에 붙여넣었습니다.|Pasted into layer {0}.|レイヤー {0} に貼り付けました。|Se pegó en la capa {0}.|已粘贴到图层 {0}。|已貼上至圖層 {0}。
{0}개 동작 적용 · 재읽기 확인|{0} actions applied · readback verified|{0} 動作を適用・再読み込み確認済み|{0} acciones aplicadas · lectura verificada|已应用 {0} 个操作 · 重新读取确认|已套用 {0} 個動作 · 重新讀取確認
{0}개 동작 복원 · 재읽기 확인|{0} actions restored · readback verified|{0} 動作を復元・再読み込み確認済み|{0} acciones restauradas · lectura verificada|已恢复 {0} 个操作 · 重新读取确认|已還原 {0} 個動作 · 重新讀取確認
{0}개 동작{1} 저장 · 재읽기 확인{2}|{0} actions{1!} saved · readback verified{2!}|{0} 動作{1!}を保存・再読み込み確認済み{2!}|{0} acciones{1!} guardadas · lectura verificada{2!}|已保存 {0} 个操作{1!} · 重新读取确认{2!}|已儲存 {0} 個動作{1!} · 重新讀取確認{2!}
· LED {0}개 레이어|· LEDs on {0} layers|・LED {0} レイヤー|· LED de {0} capas|· {0} 个图层的 LED|· {0} 個圖層的 LED
· 모드 효과 확인 필요|· check the mode effect|・モードの効果を確認してください|· compruebe el efecto del modo|· 需要确认模式效果|· 需要確認模式效果
키 배치를 적용했습니다. 노브 설정은 유지했습니다. {0}|Key layout applied. Dial settings preserved. {0!}|キー配置を適用しました。ダイヤル設定は維持しました。{0!}|Distribución aplicada. Diales conservados. {0!}|按键布局已应用，旋钮设置保持不变。{0!}|按鍵配置已套用，旋鈕設定維持不變。{0!}
장치 설정을 저장하고 다시 읽어 확인했습니다. {0}|Device settings saved and verified by readback. {0!}|デバイス設定を保存し、再読み込みで確認しました。{0!}|Ajustes guardados y verificados mediante lectura. {0!}|设备设置已保存并重新读取确认。{0!}|裝置設定已儲存並重新讀取確認。{0!}
키맵을 적용하고 다시 읽어 확인했습니다. {0}|Keymap applied and verified by readback. {0!}|キーマップを適用し、再読み込みで確認しました。{0!}|Mapa aplicado y verificado mediante lectura. {0!}|键位已应用并重新读取确认。{0!}|鍵位已套用並重新讀取確認。{0!}
GitHub 연결됨 · {0}|GitHub connected · {0!}|GitHub接続済み・{0!}|GitHub conectado · {0!}|GitHub 已连接 · {0!}|GitHub 已連線 · {0!}
오프라인 캐시 · {0}에 받은 목록입니다.{1}|Offline cache · list fetched {0}.{1}|オフラインキャッシュ・{0}に取得した一覧です。{1}|Caché sin conexión · lista obtenida {0}.{1}|离线缓存 · 列表获取时间：{0}。{1}|離線快取 · 清單取得時間：{0}。{1}
{0}개 키맵 · {1} 확인|{0} keymaps · checked {1}|{0} キーマップ・{1}に確認|{0} mapas · comprobado {1}|{0} 个键位 · 检查于 {1}|{0} 個鍵位 · 檢查於 {1}
{0} 다운로드 중…|Downloading {0}…|{0}をダウンロード中…|Descargando {0}…|正在下载 {0}…|正在下載 {0}…
{0} / 200 이벤트|{0} / 200 events|{0} / 200 イベント|{0} / 200 eventos|{0} / 200 个事件|{0} / 200 個事件
설정 방향 {0}° · 노브 {1}|Editor orientation {0}° · dials {1!}|設定の向き {0}°・ダイヤル {1!}|Orientación {0}° · diales {1!}|设置方向 {0}° · 旋钮 {1!}|設定方向 {0}° · 旋鈕 {1!}
확인할 위치: {0} · 레이어 {1} · {2}|Position to check: {0!} · Layer {1} · {2}|確認する位置: {0!}・レイヤー {1}・{2}|Posición a comprobar: {0!} · Capa {1} · {2}|待确认位置：{0!} · 图层 {1} · {2}|待確認位置：{0!} · 圖層 {1} · {2}
{0}행 {1}열 (화면 K{2} / USB {3})|Row {0}, column {1} (screen K{2} / USB {3})|{0}行{1}列（画面 K{2} / USB {3}）|Fila {0}, columna {1} (pantalla K{2} / USB {3})|第 {0} 行第 {1} 列（屏幕 K{2} / USB {3}）|第 {0} 列第 {1} 欄（畫面 K{2} / USB {3}）
화면 K{0} / USB {1}|Screen K{0} / USB {1}|画面 K{0} / USB {1}|Pantalla K{0} / USB {1}|屏幕 K{0} / USB {1}|畫面 K{0} / USB {1}
레이어 {0}에서 일치하는 단일 키 설정 없음|No matching single-key setting on layer {0}|レイヤー {0} に一致する単一キー設定はありません|No hay una tecla coincidente en la capa {0}|图层 {0} 中没有匹配的单键设置|圖層 {0} 中沒有相符的單鍵設定
레이어 {0} · 모드 {1}|Layer {0} · Mode {1}|レイヤー {0}・モード {1}|Capa {0} · Modo {1}|图层 {0} · 模式 {1}|圖層 {0} · 模式 {1}
LED {0}: {1}|LED {0}: {1}|LED {0}: {1}|LED {0}: {1}|LED {0}：{1}|LED {0}：{1}
장치 연결: 데스크톱 Chrome / Edge 필요|Device connection requires desktop Chrome / Edge|デバイス接続にはデスクトップ版Chrome / Edgeが必要|La conexión requiere Chrome / Edge de escritorio|设备连接需要桌面版 Chrome / Edge|裝置連線需要桌面版 Chrome / Edge
모델 다름: 장치 {0} / 키맵 {1} · 설정 읽기로 전환|Model mismatch: device {0!} / keymap {1!} · read settings to switch|モデル不一致：デバイス {0!} / キーマップ {1!}・設定を読み込んで切り替え|Modelo distinto: dispositivo {0!} / mapa {1!} · lea ajustes para cambiar|型号不同：设备 {0!} / 键位 {1!} · 读取设置以切换|型號不同：裝置 {0!} / 鍵位 {1!} · 讀取設定以切換
연결한 장치의 기록 방식을 확인하지 못했습니다. 식별값: {0}. 키맵은 계속 편집할 수 있습니다.|The connected device's write format could not be verified. IDs: {0}. You can continue editing.|接続デバイスの書き込み方式を確認できません。識別値: {0}。編集は続けられます。|No se verificó el formato del dispositivo. Identificadores: {0}. Puede seguir editando.|无法确认已连接设备的写入格式。标识：{0}。仍可继续编辑键位。|無法確認已連接裝置的寫入格式。識別值：{0}。仍可繼續編輯鍵位。
공유 링크를 열 수 없습니다: {0}|Could not open share link: {0!}|共有リンクを開けません: {0!}|No se pudo abrir el enlace: {0!}|无法打开分享链接：{0!}|無法開啟分享連結：{0!}
보관함을 읽지 못했습니다: {0}|Could not read library: {0!}|ライブラリを読み込めません: {0!}|No se pudo leer la biblioteca: {0!}|无法读取键位库：{0!}|無法讀取鍵位庫：{0!}
백업을 읽지 못했습니다: {0}|Could not read backups: {0!}|バックアップを読み込めません: {0!}|No se pudieron leer las copias: {0!}|无法读取备份：{0!}|無法讀取備份：{0!}
연결하지 못했습니다: {0}|Could not connect: {0!}|接続できません: {0!}|No se pudo conectar: {0!}|无法连接：{0!}|無法連線：{0!}
파일을 가져오지 못했습니다: {0}|Could not import file: {0!}|ファイルを読み込めません: {0!}|No se pudo importar el archivo: {0!}|无法导入文件：{0!}|無法匯入檔案：{0!}
백업을 가져오지 못했습니다: {0}|Could not import backup: {0!}|バックアップを読み込めません: {0!}|No se pudo importar la copia: {0!}|无法导入备份：{0!}|無法匯入備份：{0!}
공유 링크를 열 수 없습니다: {0}|Could not open share link: {0!}|共有リンクを開けません: {0!}|No se pudo abrir el enlace: {0!}|无法打开分享链接：{0!}|無法開啟分享連結：{0!}
공유 링크를 열 수 없습니다: {0}|Could not open share link: {0!}|共有リンクを開けません: {0!}|No se pudo abrir el enlace: {0!}|无法打开分享链接：{0!}|無法開啟分享連結：{0!}
이전 작업을 보관하지 못해 모델 변경을 취소했습니다: {0}|Model change canceled because the previous draft could not be saved: {0!}|前の作業を保存できないためモデル変更を中止しました: {0!}|Se canceló el cambio de modelo al no poder guardar el borrador: {0!}|无法保存之前的工作，已取消型号更改：{0!}|無法儲存先前工作，已取消型號變更：{0!}
공유 키맵을 열 수 없습니다: {0}|Could not open shared keymap: {0!}|共有キーマップを開けません: {0!}|No se pudo abrir el mapa compartido: {0!}|无法打开共享键位：{0!}|無法開啟共享鍵位：{0!}
이전에 불러온 목록을 표시합니다.|Showing the previously loaded list.|前に読み込んだ一覧を表示しています。|Se muestra la lista cargada anteriormente.|正在显示之前加载的列表。|正在顯示先前載入的清單。
장치 작업이 끝난 뒤 편집하세요.|Wait for the device operation to finish before editing.|デバイス処理が終わってから編集してください。|Espere a que termine la operación antes de editar.|请等待设备操作完成后再编辑。|請等待裝置操作完成後再編輯。
장치 작업이 끝난 뒤 적용하세요.|Wait for the device operation to finish before applying.|デバイス処理が終わってから適用してください。|Espere a que termine la operación antes de aplicar.|请等待设备操作完成后再应用。|請等待裝置操作完成後再套用。
키보드를 먼저 연결하세요.|Connect a keyboard first.|先にキーボードを接続してください。|Conecte primero un teclado.|请先连接键盘。|請先連接鍵盤。
지원되는 키보드를 연결하세요.|Connect a supported keyboard.|対応キーボードを接続してください。|Conecte un teclado compatible.|请连接受支持的键盘。|請連接受支援的鍵盤。
연결한 키보드와 키맵 모델이 다릅니다.|The keyboard and keymap models differ.|キーボードとキーマップのモデルが異なります。|El teclado y el mapa tienen modelos distintos.|键盘与键位型号不同。|鍵盤與鍵位型號不同。
연결한 키보드와 키맵의 모델이 다릅니다.|The keyboard and keymap models differ.|キーボードとキーマップのモデルが異なります。|El teclado y el mapa tienen modelos distintos.|键盘与键位型号不同。|鍵盤與鍵位型號不同。
현재 키·다이얼 동작을 백업한 뒤 적용합니다.|Back up current key and dial actions, then apply.|現在のキーとダイヤル動作をバックアップして適用します。|Se respaldan las acciones actuales antes de aplicar.|备份当前按键和旋钮操作后应用。|備份目前按鍵和旋鈕動作後套用。
진행 중인 작업이 끝난 뒤 방향을 변경하세요.|Wait for the current operation before changing orientation.|処理が終わってから向きを変更してください。|Espere a que termine la operación para cambiar la orientación.|请等待当前操作完成后再更改方向。|請等待目前操作完成後再變更方向。
같은 모델의 키보드를 연결하면 키 재배치를 적용할 수 있습니다.|Connect a keyboard of the same model to apply the new layout.|同じモデルのキーボードを接続すると再配置を適用できます。|Conecte un teclado del mismo modelo para aplicar la distribución.|连接相同型号键盘后可应用按键重排。|連接相同型號鍵盤後可套用按鍵重排。
같은 모델의 키보드를 먼저 연결하세요.|Connect a keyboard of the same model first.|先に同じモデルのキーボードを接続してください。|Conecte primero un teclado del mismo modelo.|请先连接相同型号的键盘。|請先連接相同型號的鍵盤。
키보드 연결이 변경되었습니다. 다시 연결하세요.|The keyboard connection changed. Reconnect it.|キーボードの接続が変わりました。再接続してください。|Cambió la conexión del teclado. Vuelva a conectar.|键盘连接已变更，请重新连接。|鍵盤連線已變更，請重新連接。
키보드 연결이 변경되었습니다.|The keyboard connection changed.|キーボードの接続が変わりました。|Cambió la conexión del teclado.|键盘连接已变更。|鍵盤連線已變更。
키보드 연결이 변경되었습니다. 다시 연결한 뒤 적용하세요.|The keyboard connection changed. Reconnect before applying.|キーボードの接続が変わりました。再接続してから適用してください。|Cambió la conexión. Reconecte antes de aplicar.|键盘连接已变更，请重新连接后应用。|鍵盤連線已變更，請重新連接後套用。
장치 연결을 해제했습니다.|Device disconnected.|デバイスを切断しました。|Dispositivo desconectado.|设备已断开连接。|裝置已中斷連線。
보관함에서 키맵을 열었습니다.|Keymap opened from library.|ライブラリからキーマップを開きました。|Mapa abierto desde la biblioteca.|已从键位库打开键位。|已從鍵位庫開啟鍵位。
보관함에서 삭제했습니다. 현재 편집 작업은 유지됩니다.|Removed from library. Current draft is preserved.|ライブラリから削除しました。編集中の作業は保持します。|Eliminado de la biblioteca. Se conserva el borrador actual.|已从键位库删除，当前编辑草稿仍保留。|已從鍵位庫刪除，目前編輯草稿仍保留。
백업을 삭제했습니다.|Backup deleted.|バックアップを削除しました。|Copia eliminada.|备份已删除。|備份已刪除。
백업을 복원하고 확인했습니다.|Backup restored and verified.|バックアップを復元して確認しました。|Copia restaurada y verificada.|备份已恢复并验证。|備份已還原並驗證。
로그 저장은 데스크톱 앱에서 사용할 수 있습니다.|Log storage is available in the desktop app.|ログ保存はデスクトップアプリで利用できます。|Los registros están disponibles en la app de escritorio.|日志存储仅在桌面应用中可用。|紀錄儲存僅在桌面應用程式中可用。
진단 로그 폴더 열기|Open diagnostic log folder|診断ログのフォルダーを開く|Abrir carpeta de registros|打开诊断日志文件夹|開啟診斷紀錄資料夾
내 키맵에 저장했습니다.|Saved to my keymaps.|マイキーマップに保存しました。|Guardado en mis mapas.|已保存到我的键位。|已儲存至我的鍵位。
공유 링크를 복사했습니다.|Share link copied.|共有リンクをコピーしました。|Enlace copiado.|分享链接已复制。|分享連結已複製。
링크를 선택했습니다. Ctrl+C 또는 ⌘C로 복사하세요.|Link selected. Copy with Ctrl+C or ⌘C.|リンクを選択しました。Ctrl+Cまたは⌘Cでコピーしてください。|Enlace seleccionado. Copie con Ctrl+C o ⌘C.|链接已选中，请按 Ctrl+C 或 ⌘C 复制。|連結已選取，請按 Ctrl+C 或 ⌘C 複製。
장치 작업이 끝난 뒤 새 키맵을 만드세요.|Wait for the device operation before creating a keymap.|デバイス処理が終わってからキーマップを作成してください。|Espere a que termine la operación para crear un mapa.|请等待设备操作完成后再创建键位。|請等待裝置操作完成後再建立鍵位。
진행 중인 작업이 끝난 뒤 새 키맵을 만드세요.|Wait for the current operation before creating a keymap.|処理が終わってからキーマップを作成してください。|Espere a que termine la operación para crear un mapa.|请等待当前操作完成后再创建键位。|請等待目前操作完成後再建立鍵位。
동작을 읽고 백업했습니다.|Actions read and backed up.|動作を読み込んでバックアップしました。|Acciones leídas y respaldadas.|操作已读取并备份。|動作已讀取並備份。
현재 키보드 설정을 읽었습니다.|Current keyboard settings read.|現在のキーボード設定を読み込みました。|Se leyeron los ajustes actuales del teclado.|已读取当前键盘设置。|已讀取目前鍵盤設定。
연결한 장치와 키맵의 모델이 다릅니다. 설정 읽기로 올바른 모델의 키맵을 열어 주세요.|The device and keymap models differ. Read device settings to open a matching keymap.|デバイスとキーマップのモデルが異なります。設定を読み込み、対応するキーマップを開いてください。|El dispositivo y el mapa son distintos. Lea los ajustes para abrir un mapa compatible.|设备与键位型号不同，请读取设备设置以打开匹配的键位。|裝置與鍵位型號不同，請讀取裝置設定以開啟相符鍵位。
모델을 변경했습니다. 이전 작업은 내 키맵에 보관했습니다.|Model changed. Previous work saved to my keymaps.|モデルを変更しました。前の作業はマイキーマップに保存しました。|Modelo cambiado. Trabajo anterior guardado en mis mapas.|型号已更改，之前的工作已保存到我的键位。|型號已變更，先前工作已儲存至我的鍵位。
키맵을 가져왔습니다.|Keymap imported.|キーマップを読み込みました。|Mapa importado.|键位已导入。|鍵位已匯入。
샘플을 편집기로 열었습니다.|Sample opened in editor.|サンプルをエディターで開きました。|Ejemplo abierto en el editor.|示例已在编辑器中打开。|範例已在編輯器中開啟。
키맵을 내 보관함에 저장하고 편집기로 열었습니다.|Keymap saved to library and opened in editor.|キーマップをライブラリに保存してエディターで開きました。|Mapa guardado en la biblioteca y abierto en el editor.|键位已保存到键位库并在编辑器中打开。|鍵位已儲存至鍵位庫並在編輯器中開啟。
백업 파일을 보관했습니다. 복원 시 장치와 키·다이얼 동작을 검증합니다.|Backup saved. Device and actions will be verified when restoring.|バックアップを保存しました。復元時にデバイスとキー・ダイヤル動作を検証します。|Copia guardada. Al restaurar se verifican dispositivo y acciones.|备份已保存，恢复时将验证设备与按键、旋钮操作。|備份已儲存，還原時將驗證裝置與按鍵、旋鈕動作。
공유 키맵을 열었습니다.|Shared keymap opened.|共有キーマップを開きました。|Mapa compartido abierto.|共享键位已打开。|共享鍵位已開啟。
GitHub 카탈로그는 데스크톱 앱에서 사용할 수 있습니다. 기본 샘플은 브라우저에서도 열 수 있습니다.|GitHub catalog is available in the desktop app. Bundled samples also work in the browser.|GitHubカタログはデスクトップアプリで利用できます。付属サンプルはブラウザーでも開けます。|El catálogo de GitHub está en la app de escritorio. Los ejemplos también funcionan en el navegador.|GitHub 目录仅在桌面应用中可用，内置示例也可在浏览器中打开。|GitHub 目錄僅在桌面應用程式中可用，內建範例也可在瀏覽器中開啟。
GitHub 카탈로그는 데스크톱 앱에서 사용할 수 있습니다. 브라우저에서는 기본 샘플을 이용하세요.|Use the desktop app for the GitHub catalog. In the browser, use bundled samples.|GitHubカタログはデスクトップアプリで利用できます。ブラウザーでは付属サンプルをご利用ください。|Use la app de escritorio para GitHub. En el navegador, use los ejemplos incluidos.|请在桌面应用中使用 GitHub 目录，浏览器中请使用内置示例。|請在桌面應用程式中使用 GitHub 目錄，瀏覽器中請使用內建範例。
카탈로그를 새로고침한 뒤 다시 선택하세요.|Refresh the catalog and select again.|カタログを更新して再選択してください。|Actualice el catálogo y vuelva a elegir.|请刷新目录后重新选择。|請重新整理目錄後重新選擇。
목록과 다운로드한 키맵 모델이 다릅니다. 카탈로그를 새로고침하세요.|The downloaded keymap model differs from the list. Refresh the catalog.|一覧とダウンロードしたキーマップのモデルが異なります。更新してください。|El modelo descargado no coincide con la lista. Actualice el catálogo.|下载键位的型号与列表不一致，请刷新目录。|下載鍵位的型號與清單不一致，請重新整理目錄。
장치 작업이 끝난 뒤 편집기로 다시 열어 주세요.|Wait for the device operation, then reopen in the editor.|デバイス処理が終わってからエディターで開き直してください。|Espere a que termine la operación y vuelva a abrir en el editor.|请等待设备操作完成后重新在编辑器中打开。|請等待裝置操作完成後重新在編輯器中開啟。
장치 작업이 끝난 뒤 파일을 다시 열어 주세요.|Wait for the device operation, then reopen the file.|デバイス処理が終わってからファイルを開き直してください。|Espere a que termine la operación y vuelva a abrir el archivo.|请等待设备操作完成后重新打开文件。|請等待裝置操作完成後重新開啟檔案。
진행 중인 작업이 끝난 뒤 다시 선택하세요.|Wait for the current operation, then select again.|処理が終わってから再選択してください。|Espere a que termine la operación y vuelva a elegir.|请等待当前操作完成后重新选择。|請等待目前操作完成後重新選擇。
장치 작업이 끝난 뒤 공유 링크를 다시 열어 주세요.|Wait for the device operation, then reopen the share link.|デバイス処理が終わってから共有リンクを開き直してください。|Espere a que termine la operación y vuelva a abrir el enlace.|请等待设备操作完成后重新打开分享链接。|請等待裝置操作完成後重新開啟分享連結。
USB 연결이 끊어졌습니다. 케이블을 확인한 뒤 다시 연결하세요.|USB disconnected. Check the cable and reconnect.|USB接続が切れました。ケーブルを確認して再接続してください。|USB desconectado. Compruebe el cable y reconecte.|USB 连接已断开，请检查线缆后重新连接。|USB 連線已中斷，請檢查線材後重新連接。
브라우저 저장 공간에 작업을 보관하지 못했습니다. JSON으로 내보내 주세요.|Could not save the draft in browser storage. Export it as JSON.|ブラウザーに作業を保存できません。JSONとして書き出してください。|No se pudo guardar el borrador. Expórtelo como JSON.|无法在浏览器存储中保存草稿，请导出为 JSON。|無法在瀏覽器儲存空間中儲存草稿，請匯出為 JSON。
이전 작업을 불러오지 못했습니다. 새 키맵에서 시작합니다. 저장 파일이 있다면 가져오기를 사용하세요.|Previous draft could not be loaded. Starting a new keymap. Import a saved file if available.|前の作業を読み込めませんでした。新しいキーマップで開始します。保存ファイルがあれば読み込んでください。|No se pudo cargar el borrador anterior. Se inicia un mapa nuevo. Importe un archivo guardado si lo tiene.|无法加载之前的草稿，将新建键位。如果有保存的文件，请导入。|無法載入先前草稿，將新增鍵位。如果有已儲存檔案，請匯入。
이 키는 자동으로 인식하지 못했습니다. 키 이름을 직접 입력하세요.|This key was not recognized. Enter its name manually.|このキーを自動認識できません。キー名を直接入力してください。|No se reconoció esta tecla. Escriba su nombre.|无法自动识别此按键，请手动输入键名。|無法自動辨識此按鍵，請手動輸入鍵名。
기능 목록을 불러오지 못했습니다. 지원 앱을 다시 선택하세요.|Could not load functions. Select the supported app again.|機能一覧を読み込めません。対応アプリを選択し直してください。|No se pudieron cargar las funciones. Vuelva a elegir la app.|无法加载功能列表，请重新选择支持的应用。|無法載入功能清單，請重新選擇支援的應用程式。
기능 목록을 불러오는 중…|Loading functions…|機能一覧を読み込み中…|Cargando funciones…|正在加载功能列表…|正在載入功能清單…
일치하는 기능이 없습니다.|No matching functions.|一致する機能がありません。|No hay funciones coincidentes.|没有匹配的功能。|沒有相符的功能。
128KB 이하의 키맵 JSON 파일을 선택하세요.|Choose a keymap JSON file up to 128 KB.|128KB以下のキーマップJSONファイルを選んでください。|Elija un JSON de mapa de hasta 128 KB.|请选择不超过 128 KB 的键位 JSON 文件。|請選擇不超過 128 KB 的鍵位 JSON 檔案。
128KB 이하의 백업 JSON 파일을 선택하세요.|Choose a backup JSON file up to 128 KB.|128KB以下のバックアップJSONファイルを選んでください。|Elija un JSON de copia de hasta 128 KB.|请选择不超过 128 KB 的备份 JSON 文件。|請選擇不超過 128 KB 的備份 JSON 檔案。
백업 보관함이 너무 큽니다.|The backup library is too large.|バックアップライブラリが大きすぎます。|La biblioteca de copias es demasiado grande.|备份库过大。|備份庫過大。
백업 보관함 형식이 올바르지 않습니다. 원본 보관함은 변경하지 않았습니다.|Invalid backup library. The original was not changed.|バックアップライブラリの形式が不正です。元のデータは変更していません。|Biblioteca de copias no válida. No se modificó el original.|备份库格式无效，原始数据未更改。|備份庫格式無效，原始資料未變更。
백업 ID가 중복됩니다.|Duplicate backup IDs.|バックアップIDが重複しています。|Identificadores de copia duplicados.|备份 ID 重复。|備份 ID 重複。
저장한 백업을 다시 읽지 못했습니다.|Could not read the saved backup.|保存したバックアップを読み込めません。|No se pudo leer la copia guardada.|无法读取已保存的备份。|無法讀取已儲存的備份。
키·다이얼 동작 백업을 브라우저에 저장하지 못해 장치 기록을 중단했습니다. 저장 공간을 확인하고 기존 백업을 파일로 내보내 주세요.|Device write stopped because the action backup could not be saved. Check storage and export existing backups.|動作のバックアップを保存できないため書き込みを中止しました。空き容量を確認し、既存のバックアップを書き出してください。|Se detuvo la escritura porque no se pudo guardar la copia. Revise el espacio y exporte copias existentes.|无法保存按键和旋钮备份，已停止写入设备。请检查存储空间并导出现有备份。|無法儲存按鍵和旋鈕備份，已停止寫入裝置。請檢查儲存空間並匯出現有備份。
아직 백업이 없습니다. 키보드에 처음 적용할 때 키·다이얼 동작을 자동 보관합니다.|No backups yet. Key and dial actions are saved before the first apply.|バックアップはまだありません。初回適用時にキーとダイヤル動作を自動保存します。|Aún no hay copias. Las acciones se guardan antes de la primera aplicación.|尚无备份，首次应用到键盘前会自动保存按键和旋钮操作。|尚無備份，首次套用至鍵盤前會自動儲存按鍵和旋鈕動作。
키맵을 만들고 저장해 보세요.|Create and save your first keymap.|キーマップを作成して保存しましょう。|Cree y guarde su primer mapa.|创建并保存您的第一个键位。|建立並儲存您的第一個鍵位。
샘플 목록을 불러오지 못했습니다.|Could not load sample list.|サンプル一覧を読み込めません。|No se pudo cargar la lista de ejemplos.|无法加载示例列表。|無法載入範例清單。
샘플 목록 형식이 올바르지 않습니다.|Invalid sample list format.|サンプル一覧の形式が不正です。|Formato de lista no válido.|示例列表格式无效。|範例清單格式無效。
잘못된 템플릿 파일 경로입니다.|Invalid template file path.|テンプレートのファイルパスが不正です。|Ruta de plantilla no válida.|模板文件路径无效。|範本檔案路徑無效。
템플릿 파일을 읽지 못했습니다.|Could not read template file.|テンプレートを読み込めません。|No se pudo leer la plantilla.|无法读取模板文件。|無法讀取範本檔案。
템플릿 파일이 너무 큽니다.|Template file is too large.|テンプレートファイルが大きすぎます。|El archivo de plantilla es demasiado grande.|模板文件过大。|範本檔案過大。
색·레이어 설정을 브라우저에 보관하지 못했습니다.|Could not save color and layer settings.|色とレイヤーの設定を保存できません。|No se pudieron guardar colores y capas.|无法保存颜色和图层设置。|無法儲存顏色和圖層設定。
저장된 LED 규칙을 불러오지 못했습니다.|Could not load saved LED rules.|保存済みLEDルールを読み込めません。|No se pudieron cargar las reglas LED.|无法加载已保存的 LED 规则。|無法載入已儲存的 LED 規則。
보조앱의 LED 사용 설정을 확인하지 못했습니다.|Could not verify companion LED settings.|補助アプリのLED設定を確認できません。|No se pudieron verificar los LED de la app auxiliar.|无法确认辅助应用的 LED 设置。|無法確認輔助程式的 LED 設定。
장치 LED 응답을 확인할 수 없습니다.|Could not verify the device LED response.|デバイスのLED応答を確認できません。|No se pudo verificar la respuesta LED.|无法确认设备 LED 响应。|無法確認裝置 LED 回應。
장치 연결에는 HTTPS 또는 localhost가 필요합니다. 로컬 서버에서 이 페이지를 열어 주세요.|Device connection requires HTTPS or localhost. Open this page from the local server.|デバイス接続にはHTTPSまたはlocalhostが必要です。ローカルサーバーから開いてください。|La conexión requiere HTTPS o localhost. Abra esta página desde el servidor local.|设备连接需要 HTTPS 或 localhost，请从本地服务器打开此页面。|裝置連線需要 HTTPS 或 localhost，請從本機伺服器開啟此頁面。
언어 설정을 저장하지 못했습니다. 다시 선택하세요.|Could not save language. Select it again.|言語設定を保存できません。選択し直してください。|No se pudo guardar el idioma. Vuelva a elegirlo.|无法保存语言设置，请重新选择。|無法儲存語言設定，請重新選擇。
`;
export const STATUS_ROWS = [...new Map(table.trim().split('\n').map(line=>{const row=line.split('|');return [row[0],row];})).values()];
