# RainbowAPI🌈

RainbowAPI 是一个轻量级的 JavaScript 窗口管理库，提供可拖拽、可调整大小的窗口系统，支持窗口主题定制和标题颜色独立控制。

RainbowAPI现已独立于winbox，winbox已废弃

## 特性



* 窗口拖拽功能 - 支持通过标题栏拖拽窗口

* 多方向调整大小 - 支持从四个方向和角落调整窗口尺寸

* 窗口状态管理 - 支持最小化、最大化和还原操作

* 自定义样式 - 可定制标题栏颜色、窗口大小等属性

* 窗口置顶 - 点击窗口自动置于顶层

* 窗口类型注册 - 支持预定义窗口类型，便于批量创建

* 无外部依赖 - 纯原生 JavaScript 实现，体积小巧

## 安装



1. 直接下载 `rainbow-window.js` 文件

2. 在 HTML 中引入：



```
<script src="path/to/rainbow-window.js"></script>
```

## 快速开始



```
<!DOCTYPE html>

<html>

<head>

   <title>RainbowAPI 示例</title>

   <script src="rainbow-window.js"></script>

</head>

<body>

   <button id="createWindow">创建窗口</button>

   <script>

       // 初始化样式

       rainbowAPI.initStyles();

       // 绑定按钮事件

       document.getElementById('createWindow').addEventListener('click', () => {

           // 创建自定义窗口

           rainbowAPI.createWindow({

               title: '我的第一个窗口',

               width: 400,

               height: 300,

               x: 100,

               y: 100,

               titleBarColor: '#3498db',

               content: '<h3>欢迎使用RainbowAPI</h3><p>这是一个可拖拽、可调整大小的窗口</p>'

           });

       });

       // 注册窗口类型

       rainbowAPI.registerWindowType('信息窗口', {

           titleBarColor: '#2ecc71',

           width: 350,

           height: 200,

           allowMaximize: false

       });

       // 创建注册类型的窗口

       setTimeout(() => {

           rainbowAPI.createWindowByType('信息窗口', {

               content: '<p>这是一个预定义类型的窗口</p>'

           });

       }, 1000);

   </script>

</body>

</html>
```

## API 文档

### 核心对象

`rainbowAPI` - 全局默认实例，无需额外初始化即可使用

### 方法

#### `initStyles()`

初始化窗口样式，必须在使用前调用



```
rainbowAPI.initStyles();
```

#### `registerWindowType(title, options)`

注册窗口类型，便于后续批量创建相同样式的窗口



* `title` - 窗口类型标识（唯一）

* `options` - 窗口配置选项



```
rainbowAPI.registerWindowType('编辑器', {

   titleBarColor: '#9b59b6',

   width: 800,

   height: 600,

   resizable: true

});
```

#### `createWindowByType(title, [options])`

通过已注册的窗口类型创建窗口



* `title` - 已注册的窗口类型标识

* `options` - 可选，覆盖注册时的配置



```
const editorWindow = rainbowAPI.createWindowByType('编辑器', {

   title: '我的代码编辑器',

   content: '<textarea style="width:100%;height:100%;">console.log("Hello RainbowAPI");</textarea>'

});
```

#### `createWindow(options)`

创建自定义窗口



* `options` - 窗口配置选项



```
const customWindow = rainbowAPI.createWindow({

   title: '自定义窗口',

   width: 500,

   height: 300,

   x: 200,

   y: 150,

   titleBarColor: '#e74c3c',

   content: '<p>这是一个自定义窗口</p>',

   resizable: true,

   allowMaximize: true,

   allowMinimize: true

});
```

窗口配置选项:



* `title` - 窗口标题（默认: "新窗口"）

* `width` - 窗口宽度（默认: 400）

* `height` - 窗口高度（默认: 300）

* `x` - 窗口初始 X 坐标（默认: 100）

* `y` - 窗口初始 Y 坐标（默认: 100）

* `content` - 窗口内容（HTML 字符串，默认: ""）

* `titleBarColor` - 标题栏颜色（默认: "#888"）

* `resizable` - 是否可调整大小（默认: true）

* `allowMaximize` - 是否允许最大化（默认: true）

* `allowMinimize` - 是否允许最小化（默认: true）

#### `setWindowProperties(windowInstance, options)`

动态修改窗口属性



* `windowInstance` - 窗口实例对象

* `options` - 要更新的属性



```
// 修改窗口标题和标题栏颜色

rainbowAPI.setWindowProperties(customWindow, {

   title: '更新后的窗口',

   titleBarColor: '#f39c12',

   resizable: false

});
```

#### `restoreWindow(windowInstance)`

恢复最小化的窗口



* `windowInstance` - 窗口实例对象



```
rainbowAPI.restoreWindow(customWindow);
```

#### `bringToFront(windowInstance)`

将窗口置于顶层



* `windowInstance` - 窗口实例对象



```
rainbowAPI.bringToFront(customWindow);
```

#### `getWindowByTitle(title)`

根据标题获取窗口实例



* `title` - 窗口标题

* 返回：窗口实例或 null



```
const myWindow = rainbowAPI.getWindowByTitle('自定义窗口');
```

## 示例

### 创建不同样式的窗口



```
// 创建默认窗口

rainbowAPI.createWindow({

   title: '默认窗口',

   content: '<p>默认样式窗口</p>'

});

// 创建红色标题栏窗口

rainbowAPI.createWindow({

   title: '红色窗口',

   titleBarColor: '#e74c3c',

   content: '<p>红色标题栏窗口</p>'

});

// 创建不可调整大小的窗口

rainbowAPI.createWindow({

   title: '固定大小窗口',

   resizable: false,

   content: '<p>这个窗口不能调整大小</p>'

});

// 创建无最大化按钮的窗口

rainbowAPI.createWindow({

   title: '无最大化窗口',

   allowMaximize: false,

   content: '<p>这个窗口没有最大化按钮</p>'

});
```

## 浏览器支持

支持所有现代浏览器（Chrome, Firefox, Safari, Edge 等），可能不支持 IE 浏览器。

## 许可证

MIT
