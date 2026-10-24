// Display-only names for bundled reference functions. Assigned labels in profiles
// remain literal and are excluded by the DOM localizer.
const table = `
PC 편집 / OS 미디어|PC editing / OS media|PC編集・OSメディア|Edición de PC / multimedia del sistema|PC 编辑 / 系统媒体|PC 編輯 / 系統媒體
Safari / 창 관리|Safari / window management|Safari・ウィンドウ管理|Safari / gestión de ventanas|Safari / 窗口管理|Safari / 視窗管理
게임 바인딩 제안|Suggested game bindings|ゲームの割り当て案|Asignaciones de juego sugeridas|游戏建议绑定|遊戲建議綁定
공통 편집 / 미디어|General editing / media|共通編集・メディア|Edición general / multimedia|通用编辑 / 媒体|通用編輯 / 媒體
기본 탐색|Basic navigation|基本ナビゲーション|Navegación básica|基本导航|基本導覽
내장 브라우저|Built-in browser|内蔵ブラウザー|Navegador integrado|内置浏览器|內建瀏覽器
빠른 입력 / 작성|Quick entry / writing|クイック入力・作成|Entrada rápida / escritura|快速输入 / 撰写|快速輸入 / 撰寫
아티팩트 / Slides|Artifacts / Slides|アーティファクト・Slides|Artefactos / Slides|产物 / Slides|成品 / Slides
운전 바인딩 제안|Suggested driving bindings|運転操作の割り当て案|Asignaciones de conducción sugeridas|驾驶建议绑定|駕駛建議綁定
코드 편집|Code editing|コード編集|Edición de código|代码编辑|程式碼編輯
파일 / 탐색|Files / navigation|ファイル・ナビゲーション|Archivos / navegación|文件 / 导航|檔案 / 導覽
표준 탐색|Standard navigation|標準ナビゲーション|Navegación estándar|标准导航|標準導覽
시스템 기본|System defaults|システム標準|Valores del sistema|系统默认|系統預設
Codex 앱|Codex app|Codexアプリ|App Codex|Codex 应用|Codex 應用程式
Claude 앱|Claude app|Claudeアプリ|App Claude|Claude 应用|Claude 應用程式
볼륨 높이기|Volume up|音量を上げる|Subir volumen|增大音量|提高音量
볼륨 낮추기|Volume down|音量を下げる|Bajar volumen|减小音量|降低音量
재생 중지|Stop playback|再生を停止|Detener reproducción|停止播放|停止播放
미디어 재생 중지|Stop media|メディアを停止|Detener multimedia|停止媒体|停止媒體
다음 트랙|Next track|次の曲|Pista siguiente|下一曲|下一首
이전 트랙|Previous track|前の曲|Pista anterior|上一曲|上一首
내장 브라우저 뒤로|Built-in browser back|内蔵ブラウザーで戻る|Atrás en navegador integrado|内置浏览器后退|內建瀏覽器上一頁
내장 브라우저 앞으로|Built-in browser forward|内蔵ブラウザーで進む|Adelante en navegador integrado|内置浏览器前进|內建瀏覽器下一頁
Safari 뒤로|Safari back|Safariで戻る|Atrás en Safari|Safari 后退|Safari 上一頁
Safari 앞으로|Safari forward|Safariで進む|Adelante en Safari|Safari 前进|Safari 下一頁
Safari 설정|Safari settings|Safari設定|Ajustes de Safari|Safari 设置|Safari 設定
Safari 주소창|Safari address bar|Safariアドレスバー|Barra de direcciones de Safari|Safari 地址栏|Safari 網址列
Slides 개체 / 슬라이드 복제|Duplicate Slides object / slide|Slidesのオブジェクト・スライドを複製|Duplicar objeto / diapositiva|复制 Slides 对象 / 幻灯片|複製 Slides 物件 / 投影片
Slides 다시 실행|Slides redo|Slidesでやり直す|Rehacer en Slides|Slides 重做|Slides 重做
Slides 실행 취소|Slides undo|Slidesで元に戻す|Deshacer en Slides|Slides 撤销|Slides 復原
Slides 한 단계 위로|Slides up one level|Slidesで1階層上へ|Subir un nivel en Slides|Slides 上移一级|Slides 上移一層
URL 복사|Copy URL|URLをコピー|Copiar URL|复制 URL|複製 URL
개체 아래로|Move object down|オブジェクトを下へ|Mover objeto abajo|对象下移|物件下移
개체 오른쪽 / 다음 슬라이드|Object right / next slide|オブジェクトを右へ・次のスライド|Objeto a la derecha / siguiente diapositiva|对象右移 / 下一张幻灯片|物件右移 / 下一張投影片
개체 왼쪽 / 이전 슬라이드|Object left / previous slide|オブジェクトを左へ・前のスライド|Objeto a la izquierda / diapositiva anterior|对象左移 / 上一张幻灯片|物件左移 / 上一張投影片
개체 위로|Move object up|オブジェクトを上へ|Mover objeto arriba|对象上移|物件上移
글자 기본 크기|Default text size|文字を標準サイズに|Tamaño de texto predeterminado|默认文字大小|預設文字大小
글자 작게|Smaller text|文字を小さく|Reducir texto|缩小文字|縮小文字
글자 크게|Larger text|文字を大きく|Ampliar texto|放大文字|放大文字
다시 실행|Redo|やり直す|Rehacer|重做|重做
다음 개체|Next object|次のオブジェクト|Objeto siguiente|下一个对象|下一個物件
다음 단어|Next word|次の単語|Palabra siguiente|下一个单词|下一個單字
다음 문제|Next problem|次の問題|Problema siguiente|下一个问题|下一個問題
다음 일치 항목|Next match|次の一致|Coincidencia siguiente|下一个匹配项|下一個符合項目
다음 찾기 결과|Next search result|次の検索結果|Resultado siguiente|下一个搜索结果|下一個搜尋結果
다음 채팅 / 탭|Next chat / tab|次のチャット・タブ|Chat / pestaña siguiente|下一个聊天 / 标签页|下一個聊天 / 分頁
다음 코드 위치|Next code location|次のコード位置|Ubicación de código siguiente|下一个代码位置|下一個程式碼位置
다음 탭|Next tab|次のタブ|Pestaña siguiente|下一个标签页|下一個分頁
다음 편집기|Next editor|次のエディター|Editor siguiente|下一个编辑器|下一個編輯器
다음 항목|Next item|次の項目|Elemento siguiente|下一项|下一個項目
단축키 보기|Show shortcuts|ショートカットを表示|Ver atajos|查看快捷键|查看快捷鍵
닫은 탭 다시 열기|Reopen closed tab|閉じたタブを開く|Reabrir pestaña cerrada|重新打开关闭的标签页|重開已關閉分頁
닫은 편집기 다시 열기|Reopen closed editor|閉じたエディターを開く|Reabrir editor cerrado|重新打开关闭的编辑器|重開已關閉編輯器
들여쓰기 감소|Decrease indent|インデントを減らす|Reducir sangría|减少缩进|減少縮排
들여쓰기 증가|Increase indent|インデントを増やす|Aumentar sangría|增加缩进|增加縮排
리뷰 탭|Review tab|レビュータブ|Pestaña de revisión|审查标签页|審查分頁
마지막 개체|Last object|最後のオブジェクト|Último objeto|最后一个对象|最後一個物件
명령 메뉴|Command menu|コマンドメニュー|Menú de comandos|命令菜单|指令選單
명령 팔레트|Command palette|コマンドパレット|Paleta de comandos|命令面板|指令選擇區
모두 선택|Select all|すべて選択|Seleccionar todo|全选|全選
모두 저장|Save all|すべて保存|Guardar todo|全部保存|全部儲存
문맥 메뉴 키|Context menu key|コンテキストメニューキー|Tecla de menú contextual|上下文菜单键|快顯選單鍵
문서 서식|Format document|ドキュメントを整形|Dar formato al documento|格式化文档|格式化文件
문제 패널|Problems panel|問題パネル|Panel de problemas|问题面板|問題面板
바꾸기|Replace|置換|Reemplazar|替换|取代
브라우저 뒤로|Browser back|ブラウザーで戻る|Atrás en navegador|浏览器后退|瀏覽器上一頁
브라우저 앞으로|Browser forward|ブラウザーで進む|Adelante en navegador|浏览器前进|瀏覽器下一頁
브라우저 탭 열기|Open browser tab|ブラウザータブを開く|Abrir pestaña del navegador|打开浏览器标签页|開啟瀏覽器分頁
빠른 수정|Quick fix|クイック修正|Corrección rápida|快速修复|快速修正
빠른 입력 · 앱 설정 필요|Quick entry · app setup required|クイック入力・アプリ設定が必要|Entrada rápida · configurar en la app|快速输入 · 需设置应用|快速輸入 · 需設定應用程式
사이드 채팅|Side chat|サイドチャット|Chat lateral|侧边聊天|側邊聊天
사이드바 전환|Toggle sidebar|サイドバーを切り替え|Alternar barra lateral|切换侧边栏|切換側邊欄
새 채팅|New chat|新しいチャット|Nuevo chat|新建聊天|新增聊天
새 파일|New file|新しいファイル|Nuevo archivo|新建文件|新增檔案
새로 고침|Reload|再読み込み|Recargar|重新加载|重新載入
설정|Settings|設定|Ajustes|设置|設定
소스 제어|Source control|ソース管理|Control de código|源代码管理|原始碼管理
심볼 이름 변경|Rename symbol|シンボル名を変更|Renombrar símbolo|重命名符号|重新命名符號
아래|Down|下|Abajo|下|下
위|Up|上|Arriba|上|上
아래 패널 전환|Toggle bottom panel|下部パネルを切り替え|Alternar panel inferior|切换底部面板|切換底部面板
아티팩트 다음 영역|Next artifact area|アーティファクトの次の領域|Siguiente área del artefacto|产物下一区域|成品下一區域
아티팩트 바깥으로|Leave artifact|アーティファクトの外へ|Salir del artefacto|离开产物|離開成品
아티팩트 이전 영역|Previous artifact area|アーティファクトの前の領域|Área anterior del artefacto|产物上一区域|成品上一區域
아티팩트 항목 안으로|Enter artifact item|アーティファクト項目の中へ|Entrar en elemento del artefacto|进入产物项目|進入成品項目
앱 뒤로|App back|アプリで戻る|Atrás en la app|应用后退|應用程式返回
앱 앞으로|App forward|アプリで進む|Adelante en la app|应用前进|應用程式前進
영역 접기|Fold region|領域を折りたたむ|Plegar región|折叠区域|摺疊區域
영역 펴기|Unfold region|領域を展開|Desplegar región|展开区域|展開區域
이전 개체|Previous object|前のオブジェクト|Objeto anterior|上一个对象|上一個物件
이전 단어|Previous word|前の単語|Palabra anterior|上一个单词|上一個單字
이전 문제|Previous problem|前の問題|Problema anterior|上一个问题|上一個問題
이전 일치 항목|Previous match|前の一致|Coincidencia anterior|上一个匹配项|上一個符合項目
이전 찾기 결과|Previous search result|前の検索結果|Resultado anterior|上一个搜索结果|上一個搜尋結果
이전 채팅 / 탭|Previous chat / tab|前のチャット・タブ|Chat / pestaña anterior|上一个聊天 / 标签页|上一個聊天 / 分頁
이전 코드 위치|Previous code location|前のコード位置|Ubicación de código anterior|上一个代码位置|上一個程式碼位置
이전 탭|Previous tab|前のタブ|Pestaña anterior|上一个标签页|上一個分頁
이전 편집기|Previous editor|前のエディター|Editor anterior|上一个编辑器|上一個編輯器
이전 항목|Previous item|前の項目|Elemento anterior|上一项|上一個項目
일반 취소 키 Esc|Cancel key Esc|キャンセルキー Esc|Tecla cancelar Esc|取消键 Esc|取消鍵 Esc
일반 확인 키 Enter|Confirm key Enter|確定キー Enter|Tecla confirmar Enter|确认键 Enter|確認鍵 Enter
작업 영역 배치|Workspace layout|ワークスペースの配置|Distribución del espacio|工作区布局|工作區配置
잘라내기|Cut|切り取り|Cortar|剪切|剪下
전체 검색|Search everywhere|全体を検索|Buscar en todo|全局搜索|全域搜尋
전체 보기 전환|Toggle overview|全体表示を切り替え|Alternar vista general|切换概览|切換總覽
정의로 이동|Go to definition|定義へ移動|Ir a definición|转到定义|移至定義
제안: {0} → {1}|Suggested: {0!} → {1}|割り当て案: {0!} → {1}|Propuesta: {0!} → {1}|建议：{0!} → {1}|建議：{0!} → {1}
가속|Accelerate|加速|Acelerar|加速|加速
경적|Horn|クラクション|Bocina|喇叭|喇叭
근접 공격|Melee|近接攻撃|Ataque cuerpo a cuerpo|近战攻击|近戰攻擊
기어 내리기|Shift down|シフトダウン|Bajar marcha|降挡|降檔
기어 올리기|Shift up|シフトアップ|Subir marcha|升挡|升檔
다음 무기|Next weapon|次の武器|Arma siguiente|下一武器|下一武器
달리기|Sprint|ダッシュ|Correr|冲刺|衝刺
되감기|Rewind|巻き戻し|Rebobinar|倒回|倒轉
뒤 보기|Look back|後ろを見る|Mirar atrás|向后看|向後看
방탄판 (해당 모드)|Armor plate (supported modes)|装甲板（対応モード）|Placa de blindaje (modos compatibles)|装甲板（适用模式）|裝甲板（適用模式）
브레이크 / 후진|Brake / reverse|ブレーキ・後退|Frenar / marcha atrás|刹车 / 倒车|煞車 / 倒車
살상 장비|Lethal equipment|リーサル装備|Equipo letal|杀伤装备|致命裝備
상호작용|Interact|インタラクト|Interactuar|交互|互動
앉기|Crouch|しゃがむ|Agacharse|蹲下|蹲下
엎드리기|Prone|伏せる|Tumbarse|趴下|趴下
오른쪽 이동|Move right|右へ移動|Mover a la derecha|向右移动|向右移動
오른쪽 조향|Steer right|右に操舵|Girar a la derecha|向右转向|向右轉向
왼쪽 이동|Move left|左へ移動|Mover a la izquierda|向左移动|向左移動
왼쪽 조향|Steer left|左に操舵|Girar a la izquierda|向左转向|向左轉向
재장전|Reload weapon|リロード|Recargar arma|装填|重新裝填
전술 장비|Tactical equipment|タクティカル装備|Equipo táctico|战术装备|戰術裝備
전진|Move forward|前進|Avanzar|前进|前進
점프 / 맨틀|Jump / mantle|ジャンプ・乗り越え|Saltar / trepar|跳跃 / 翻越|跳躍 / 翻越
지도|Map|マップ|Mapa|地图|地圖
카메라 전환|Switch camera|カメラ切り替え|Cambiar cámara|切换摄像机|切換鏡頭
클러치|Clutch|クラッチ|Embrague|离合器|離合器
포토 모드|Photo mode|フォトモード|Modo foto|照片模式|拍照模式
필드 업그레이드|Field upgrade|フィールドアップグレード|Mejora de campo|战地升级|戰地升級
핸드브레이크|Handbrake|ハンドブレーキ|Freno de mano|手刹|手煞車
후진|Move backward|後退|Retroceder|后退|後退
주소창|Address bar|アドレスバー|Barra de direcciones|地址栏|網址列
줄 아래로 이동|Move line down|行を下へ移動|Mover línea abajo|向下移动行|向下移動行
줄 위로 이동|Move line up|行を上へ移動|Mover línea arriba|向上移动行|向上移動行
줄 주석 전환|Toggle line comment|行コメントを切り替え|Alternar comentario de línea|切换行注释|切換行註解
줄로 이동|Go to line|指定行へ移動|Ir a línea|转到行|移至行
참조 보기|Show references|参照を表示|Ver referencias|查看引用|查看參考
찾기|Find|検索|Buscar|查找|尋找
채팅과 탭 전환|Switch chats and tabs|チャットとタブを切り替え|Cambiar chats y pestañas|切换聊天和标签页|切換聊天與分頁
첫 개체|First object|最初のオブジェクト|Primer objeto|第一个对象|第一個物件
캐시 없이 새로 고침|Reload without cache|キャッシュを使わず再読み込み|Recargar sin caché|忽略缓存重新加载|略過快取重新載入
탐색 / 주석 모드|Browse / annotate mode|閲覧・注釈モード|Modo explorar / anotar|浏览 / 批注模式|瀏覽 / 註解模式
탐색기|Explorer|エクスプローラー|Explorador|资源管理器|檔案總管
터미널 전환|Toggle terminal|ターミナルを切り替え|Alternar terminal|切换终端|切換終端機
파일 검색|Search files|ファイルを検索|Buscar archivos|搜索文件|搜尋檔案
파일 끝|End of file|ファイルの末尾|Fin del archivo|文件末尾|檔案結尾
파일 빠르게 열기|Quick open file|ファイルを素早く開く|Abrir archivo rápido|快速打开文件|快速開啟檔案
파일 심볼|File symbols|ファイルのシンボル|Símbolos del archivo|文件符号|檔案符號
파일 열기|Open file|ファイルを開く|Abrir archivo|打开文件|開啟檔案
파일 처음|Start of file|ファイルの先頭|Inicio del archivo|文件开头|檔案開頭
파일 트리 전환|Toggle file tree|ファイルツリーを切り替え|Alternar árbol de archivos|切换文件树|切換檔案樹
페이지 끝|End of page|ページの末尾|Fin de página|页面底部|頁面底部
페이지 처음|Start of page|ページの先頭|Inicio de página|页面顶部|頁面頂端
편집기 그룹 {0}|Editor group {0}|エディターグループ {0}|Grupo de editores {0}|编辑器组 {0}|編輯器群組 {0}
편집기 닫기|Close editor|エディターを閉じる|Cerrar editor|关闭编辑器|關閉編輯器
편집기 분할|Split editor|エディターを分割|Dividir editor|拆分编辑器|分割編輯器
폴더 열기|Open folder|フォルダーを開く|Abrir carpeta|打开文件夹|開啟資料夾
현재 채팅에서 찾기|Find in current chat|現在のチャット内を検索|Buscar en chat actual|在当前聊天中查找|在目前聊天中尋找
현재 탭 닫기|Close current tab|現在のタブを閉じる|Cerrar pestaña actual|关闭当前标签页|關閉目前分頁
현재 페이지 찾기|Find on current page|現在のページ内を検索|Buscar en página actual|在当前页面查找|在目前頁面尋找
화면 아래로|Page down|画面を下へ|Página abajo|向下翻页|向下翻頁
화면 위로|Page up|画面を上へ|Página arriba|向上翻页|向上翻頁
확인 필요한 다음 채팅|Next chat needing attention|確認が必要な次のチャット|Siguiente chat que requiere atención|下一个待确认聊天|下一個待確認聊天
L{0} · {1}|L{0} · {1!}|L{0}・{1!}|L{0} · {1!}|L{0} · {1!}|L{0} · {1!}
키맵을 저장하고 다시 읽어 확인했습니다. {0}|Keymap saved and verified by readback. {0!}|キーマップを保存し、再読み込みで確認しました。{0!}|Mapa guardado y verificado mediante lectura. {0!}|键位已保存并重新读取确认。{0!}|鍵位已儲存並重新讀取確認。{0!}
`;
export const FUNCTION_ROWS=table.trim().split('\n').map(line=>line.split('|'));
