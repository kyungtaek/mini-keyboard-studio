# Mini Keyboard Studio

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Español](README.es.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

讓小鍵盤更適合你。Mini Keyboard Studio 是一款本機 macOS App，可編輯按鍵、旋鈕與燈光，並透過 USB 將按鍵配置套用到裝置。

**[下載 macOS Apple Silicon 版](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest)** · [開發指南](docs/development.md)

支援英語、韓語、日語、西班牙語、簡體中文和繁體中文。可在**檔案與分享**或應用程式選單中切換語言。

![Mini Keyboard Studio 按鍵配置編輯器](docs/images/studio-editor.jpg)

## 主要功能

- **三層配置。** 為按鍵與旋鈕指派一般按鍵、組合鍵、巨集、媒體控制及滑鼠操作。
- **尋找並指派快速鍵。** 瀏覽 VS Code、Slack、Google Meet、cmux、Chrome、Claude、系統控制、Forza Horizon 4 與 Modern Warfare 4 的參考清單，為每項操作保留清楚的功能名稱。
- **配合桌面的方向。** 依照鍵盤的擺放方向旋轉配置。
- **逐鍵 LED 設定。** 選擇 15 種顏色或**關閉**，並設定每層共用的 LED 模式。
- **本機儲存與分享。** 儲存配置、匯入或匯出 JSON，並透過內含設定內容的連結分享。編輯與本機檔案可離線使用。
- **寫入後驗證。** 寫入前備份按鍵配置，再讀回裝置中的儲存值進行驗證，另提供按鍵輸入診斷。
- **從選單列隨時開啟。** 關閉視窗後，仍可從選單列重新開啟編輯器。

![逐鍵 LED 調色盤與層模式](docs/images/studio-led.jpg)

## 快速開始

1. 從 [Releases](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest) 下載 Apple Silicon 版 DMG，將 App 移到**應用程式**後開啟。
2. 使用 USB 資料傳輸線連接鍵盤，然後選擇**連接鍵盤**。
3. 開啟內建範例或新增配置。選取按鍵或旋鈕並指派功能，也可設定按鍵顏色與目前層的 LED 模式。
4. 儲存配置，準備好後選擇**套用至裝置**。僅開啟檔案或切換快速鍵參考 App，不會自動寫入裝置。

選用的 GitHub 配置目錄使用 GitHub 驗證。內建範例與本機配置不需要 GitHub 帳號。遊戲快速鍵是建議方案，請與遊戲內的按鍵設定保持一致。

## 裝置支援

目前經過實機驗證的是 USB **514C:8850** 的 **16 鍵、3 旋鈕 Mini Keyboard** 及測試所用韌體。其他型號配置以候選方式提供，尚未全部完成實機測試。

LED 模式以 **0–5** 顯示，因為尚未驗證所有模式的視覺效果。模式變更可能需要重新連接 USB 才會顯示；部分顏色變更已觀察到可即時反映。讀回成功確認的是儲存值，並不代表所有燈光效果均已驗證。配置需手動套用，不會隨目前聚焦的 App 自動切換。
