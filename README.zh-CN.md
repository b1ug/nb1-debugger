# nb1 Debugger

[English](README.md)

这是 [nb1](https://github.com/b1ug/nb1) 的内嵌 Web 界面源码：通过本机 daemon 控制灯、编辑 Action／Sequence、保存本机颜色和 Pattern，并查看三维预览。默认英文，可明确切换中文。

日常使用直接安装 nb1，无需自己构建前端：

```sh
nb1 server --devices YOUR_DEVICE_SERIAL
```

nb1 v0.1.3 的默认调试地址是 <http://127.0.0.1:5885/demo/>。v0.1.2 使用 <http://127.0.0.1:8931/demo/>。如果设置过监听端口，请使用配置中的地址。预览可选，播放会直接验证并提交当前草稿。Web、CLI 和 MCP 共享同一个 daemon 的设备执行核心；本界面通过同源 HTTP 请求控制，不使用 WebHID，也不自动安装或启动 daemon。

## 几个项目的区别

| 项目 | 职责 |
| --- | --- |
| nb1 | CLI、daemon、硬件所有权、API，以及内嵌发行。 |
| 本仓库：nb1 Debugger | 维护 `/demo/` 下的 daemon 工作台源码。 |
| [nb1 WebHID](https://github.com/b1ug/nb1-webhid) | 独立 WebHID 网页和实验性扩展，需要单独浏览器设备授权。 |
| [nb1 Guide](https://b1ug.github.io/nb1-guide/zh/) | 安装、API 和教程，不控制设备。 |

Action 表达意图，Sequence 用 `steps[]` 定义播放，Job 跟踪执行，Pattern 保存在电脑的本地库。设备原生存储属于另一组能力。屏幕动画、带时间的缓存 RGB 和实体发光分别标注；预览或缓存值不是光学测量。

## 构建源码

需要 Node.js **22.12 或更新版本**，使用仓库锁定的 npm 依赖：

```sh
npm ci --ignore-scripts
npm run check:syntax
npm run check:locales
npm run build
npm run check:dist
npm run check:nightlab
```

`build` 要求干净的已提交源码；未提交草稿用 `npm run build:dev`，其 manifest 标记 dirty，不能导入正式内嵌包。`dist/` 是生成结果，不提交到本前端仓库。

MK2 模型由 [blink1-models](https://github.com/b1ug/blink1-models) 维护。npm 按锁文件安装固定提交，构建时校验模型清单及七个文件，将模型、CAD 署名与许可一起装入离线包。其他构建依赖有 CodeMirror、esbuild 和 Three.js。页面使用 HTML、CSS 与 JavaScript，没有额外 UI 框架运行时。普通前端构建不需要 Go：屏幕预览使用已固定源码的 Go/WASM 产物、匹配运行时及许可；源码与重新生成流程由 Browser Tools 维护，[编译器来源](src/nightlab/compiler/compiler-source.json)记录实际 core 提交和文件哈希。

运行时不需要 Node、npm、CDN、远程字体或启动下载。最终验证与颜色解析由 nb1 完成，WASM loader 只开放 `info`／`planSequence`，不会独立控制硬件。

## 与 nb1 集成

工作台包含 `/demo/`、`/demo/orbit.html` 和 `/demo/patterns.html` 三个页面。模型说明只包含公开技术来源；全部运行资源都在本地。

schema-v2 manifest 绑定规范仓库地址、完整干净提交、存储／解码资产哈希、确定性 gzip 和 API 合同。产物格式中的 `product` 保留 `nb1-web`，对用户显示的名称是 **nb1 Debugger**。

部分大型资源以确定性 gzip 储存在逻辑文件名下，必须由匹配的 nb1 importer 校验并提供解码内容，不能直接把 `dist/` 放到普通静态服务器或 GitHub Pages 当调试器。Go 原生构建只使用已审核、提交到主机仓库的内嵌 dist，不会自动克隆本仓库、拉取 submodule、运行 npm 或编译 WASM。

许可与详细合同见英文 README 的对应链接。项目代码／形象使用 MIT；ThingM CAD 与派生显示装配保留 CC-BY-SA-4.0 署名，Three.js 使用 MIT，字体保留 SIL OFL，Go 预览模块与运行时保留各自许可。批准形象、原始 STL 和必要许可字节不变；私有笔记、设备标识、内部验收、开发截图和未选形象不进入公开导出。
