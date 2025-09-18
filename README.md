# RainbowAPI🌈

RainbowAPI 是一个轻量级的 JavaScript 窗口管理库，提供可拖拽、可调整大小的窗口系统，支持窗口主题定制和标题颜色独立控制。

## 特性

- 窗口拖拽：通过标题栏自由移动窗口
- 大小调整：支持通过右下角调整窗口尺寸，可设置大小限制
- 主题系统：支持全局主题注册和单个窗口专属主题
- 标题控制：默认白色标题，可单独设置每个窗口的标题颜色
- 内容区域：固定为白色背景和深灰色文字，确保内容可读性
- 窗口管理：支持创建、关闭、显示/隐藏窗口等操作

## 安装

直接在 HTML 中引入脚本：`<script src="rainbowAPI.js"></script>`

API 会自动初始化，也可手动初始化：`const api = rainbowAPI.init();`
## 基本用法

### 创建窗口
```
// 创建基础窗口
const basicWindow = rainbowAPI.createWindow("我的窗口", 100, 100);
basicWindow.setContent("<h3>Hello RainbowAPI</h3><p>这是一个可拖拽的窗口</p>");
### 带配置的窗口const customWindow = rainbowAPI.createWindow("自定义窗口", 300, 200, {
  initialSize: "600*400",  // 初始大小 (宽*高)
  minSize: "300*200",      // 最小尺寸限制
  maxSize: "800*600",      // 最大尺寸限制
  resizable: true,         // 是否可调整大小
  baseColor: "#4CAF50",    // 基础颜色（自动生成主题）
  headerColor: "#FFEB3B"   // 标题颜色
});
```
## 主题系统

### 注册全局主题
```
// 注册全局主题
rainbowAPI.registerWindowTheme("dark-theme", {
  headerBg: "#333333",
  buttonBg: "#555555",
  buttonHover: "#777777",
  borderColor: "#666666"
});

// 使用注册的主题创建窗口
const themedWindow = rainbowAPI.createWindow("主题窗口", 200, 200, {
  theme: "dark-theme"
});
```
### 窗口主题方法
```
// 应用已注册的主题
window.applyRegisteredTheme("dark-theme");

// 直接更新主题
window.updateTheme({
  headerBg: "#2196F3",
  buttonBg: "#0b7dda"
});

// 设置基础色（自动生成主题）
window.setBaseColor("#9C27B0");

// 单独设置标题颜色
window.setHeaderColor("#FFEB3B");
## 窗口控制方法

### 尺寸控制// 设置窗口大小
window.setSize("500*300"); // 字符串格式
window.setSize({width: 500, height: 300}); // 对象格式

// 更新大小限制
window.updateSizeConstraints({
  minSize: "250*200",
  maxSize: "1000*800",
  resizable: false
});
```
### 内容控制
```
// 设置窗口内容
window.setContent("<p>新内容</p>");

// 追加内容
window.appendContent("<p>追加的内容</p>");
```
### 显示控制
```
// 关闭窗口
rainbowAPI.closeWindow(window.id);

// 切换窗口显示/隐藏
rainbowAPI.toggleWindow(window.id);
```
## 示例
```
// 初始化API
const api = rainbowAPI.init();

// 注册主题
api.registerWindowTheme("blue-theme", {
  headerBg: "#2196F3",
  buttonBg: "#0b7dda"
});

// 创建窗口1 - 默认主题
const win1 = api.createWindow("默认主题", 100, 100);
win1.setContent("默认紫色主题，白色标题");

// 创建窗口2 - 使用注册的主题
const win2 = api.createWindow("蓝色主题", 400, 100, {
  theme: "blue-theme"
});
win2.setContent("使用蓝色主题，白色标题");

// 创建窗口3 - 自定义基础色
const win3 = api.createWindow("橙色主题", 100, 300, {
  baseColor: "#ff5722"
});
win3.setContent("基于橙色自动生成的主题");
win3.setHeaderColor("#000"); // 标题改为黑色

// 创建窗口4 - 固定大小
const win4 = api.createWindow("固定大小", 400, 300, {
  initialSize: "400*300",
  resizable: false
});
win4.setContent("这个窗口不能调整大小");
```
