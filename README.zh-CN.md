# Mini Keyboard Studio

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Español](README.es.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

让小键盘更适合你。Mini Keyboard Studio 是一款本地 macOS 应用，可编辑按键、旋钮和灯光，并通过 USB 将键位配置应用到设备。

**[下载 macOS Apple Silicon 版](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest)** · [开发指南](docs/development.md)

支持英语、韩语、日语、西班牙语、简体中文和繁体中文。可在**文件与分享**或应用菜单中切换语言。

![Mini Keyboard Studio 键位编辑器](docs/images/studio-editor.jpg)

## 主要功能

- **三层键位。** 为按键和旋钮分配普通按键、组合键、宏、媒体控制和鼠标操作。
- **查找并分配快捷键。** 浏览 VS Code、Codex、Claude、系统控制、Forza Horizon 4 和 Modern Warfare 4 的参考列表，为每项操作保留清晰的功能名称。
- **适合桌面的方向。** 根据键盘的摆放方向旋转布局。
- **逐键 LED 设置。** 选择 15 种颜色或**关闭**，并设置每层共用的 LED 模式。
- **本地保存与分享。** 保存键位配置，导入或导出 JSON，通过包含配置内容的链接分享。编辑和本地文件可离线使用。
- **写入后验证。** 写入前备份按键配置，再读回设备中的存储值进行验证，并提供按键输入诊断。
- **菜单栏随时打开。** 关闭窗口后，仍可从菜单栏重新打开编辑器。

![逐键 LED 调色板和层模式](docs/images/studio-led.jpg)

## 快速开始

1. 从 [Releases](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest) 下载 Apple Silicon 版 DMG，将应用移到**应用程序**后打开。
2. 使用 USB 数据线连接键盘，然后选择**连接键盘**。
3. 打开内置示例或新建配置。选择按键或旋钮并分配功能，也可设置按键颜色和当前层的 LED 模式。
4. 保存配置，准备好后选择**应用到设备**。仅打开文件或切换快捷键参考应用不会自动写入设备。

可选的 GitHub 键位目录使用 GitHub 身份验证。内置示例和本地配置不需要 GitHub 账号。游戏快捷键是建议方案，请与游戏内的按键设置保持一致。

## 设备支持

当前经过实机验证的是 USB **514C:8850** 的 **16 键、3 旋钮 Mini Keyboard** 及测试所用固件。其他型号布局作为候选提供，尚未全部经过实机测试。

LED 模式以 **0–5** 显示，因为尚未验证所有模式的视觉效果。模式变化可能需要重新连接 USB 才会生效；部分颜色变化已观察到可即时显示。读回成功确认的是存储值，并不代表所有灯光效果均已验证。配置需手动应用，不会随当前聚焦的应用自动切换。
