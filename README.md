# SCP Archive

> 一个 Material 3、离线优先的 SCP 基金会档案阅读器。

SCP Archive 是一个非官方的开源阅读器，面向手机屏幕设计。它把中文分部与英文总部的全量目录装进 App，正文按需抓取并自动缓存，断网时也能继续读已经打开过的档案。

<p align="center">
  <img src="docs/screenshots/home.png" width="260" alt="首页" />
  <img src="docs/screenshots/reader.png" width="260" alt="阅读器" />
</p>
<p align="center">
  <img src="docs/screenshots/browse.png" width="260" alt="档案库" />
  <img src="docs/screenshots/settings.png" width="260" alt="设置" />
</p>

## 下载

- **Android APK**：[v0.1.0](https://github.com/ZerooTTwo/scp-archive/releases/tag/v0.1.0)（debug 签名，安装时需允许未知来源）
- **Web / PWA**：`npm run build` 后部署 `dist/`，或本地 `npm run dev`

## 功能

- **全量目录**：内置 15 个系列页的快照，共 14,589 条档案（中文 4,737 条 + 英文 9,852 条），按系列与编号归档。
- **浏览与检索**：分部切换、系列筛选、编号/标题搜索、只看新增、随机档案。
- **离线阅读**：打开过的正文自动写入本地；收藏时主动下载正文；最多保留 300 篇正文。
- **收藏与进度**：收藏、阅读历史、段落进度全部保存在本机，不上传服务器。
- **阅读体验**：目录（TOC）、字号/行高/衬线调节、浅色/深色/跟随系统、可折叠段落、表格横向滚动、图片与脚注。
- **自动同步**：启动或回到前台时，如果距上次同步超过 12 小时，会静默检查 15 个系列页；新条目会在列表中标记为 `NEW`。
- **PWA + Android**：浏览器里可作为 PWA 安装；Android 端使用 Capacitor 打包，可直接安装 APK。
- **分享**：调用系统分享面板分享档案链接，失败时回退到复制链接。

## 数据与离线策略

| 内容 | 是否内置 | 说明 |
| --- | --- | --- |
| 目录（编号 + 标题 + 系列） | 是 | `public/seed/catalog.json`，约 1.9 MB |
| 正文 | 否 | 首次阅读时抓取，随后写入 IndexedDB |
| 图片 | 否 | 在线阅读时加载；不保证离线可用 |
| 收藏 / 历史 / 设置 | 本地 | IndexedDB + localStorage 主题镜像 |

“包含全部 SCP”指的是**目录全量**，而不是把一万多篇正文一起塞进安装包。这样安装包可以保持在较小体积，同时仍然能离线打开读过的内容。

## 技术栈

- React 19 + TypeScript 5.9
- Vite 7 + `vite-plugin-pwa`
- React Router 7（HashRouter）
- Capacitor 8（Android）
- IndexedDB（`idb-keyval`）
- 手写 Material 3 设计系统，无 UI 组件库

## 本地开发

需要 Node.js 22+。

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。开发态由 Vite 代理 `/wiki/cn` 与 `/wiki/en`，以绕过浏览器 CORS；Android 端由 `CapacitorHttp` 直接请求 Wiki。

其他命令：

```bash
npm run typecheck   # 只做类型检查
npm run build       # 类型检查 + 生产构建，输出 dist/
npm run preview     # 预览生产构建（PWA 在 localhost 下可用）
```

## 构建 Android APK

### 使用 GitHub Actions（推荐，无需本地 Android SDK）

仓库包含 `.github/workflows/android.yml`。推送代码或手动触发 workflow 后，CI 会：

1. 安装 Node 22 与 JDK 21；
2. `npm ci`、`npm run build`；
3. `npx cap sync android`；
4. 在 `ubuntu-latest` 上执行 `./gradlew assembleDebug`；
5. 上传 `app-debug.apk` 作为 Actions artifact。

推送 `v*` 标签时，APK 还会附加到对应的 GitHub Release。

### 本地构建

需要 JDK 21、Android SDK 与 Android Studio。Android 工程已经提交在 `android/`，不需要重新 `cap add`。

```bash
npm run cap:sync
cd android
./gradlew assembleDebug
```

产物位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 更新目录快照

目录脚本会依次抓取 15 个 Wikidot 系列页，解析其中的条目链接并去重：

```bash
npm run seed
```

输出 `public/seed/catalog.json`。脚本带有并发限制与请求间隔，请勿高频运行，以免给 Wiki 造成压力。若 Wiki 的页面结构变化，需要同步调整 `scripts/build-seed.mjs` 的解析规则。

## 项目结构

```text
src/
  components/       通用 UI（按钮、Sheet、Dialog、图标、条目行、底栏）
  pages/            首页、档案库、搜索、收藏、阅读器、设置
  lib/              Wiki 抓取/解析、清洗、IndexedDB、同步、格式化
  state/            设置、Toast、目录、收藏/历史/离线状态
  styles/           Material 3 token、基础样式、组件、页面、阅读器排版
public/
  seed/catalog.json 目录快照
  icons/            PWA / Android 图标
scripts/
  build-seed.mjs    抓取并生成目录
  make-icons.py     生成图标与启动图
android/            Capacitor Android 工程
```

## 已知限制

- 正文来自 Wikidot，页面结构或访问策略变化可能导致抓取失败；失败时会保留本地缓存。
- 图片不保证离线；正文内图片仍需要网络。
- 只覆盖中文分部 001–4999 与英文总部 001–9999 的系列页；未收录的分部/页面不会出现在目录中。
- 没有账号系统，收藏与进度不会跨设备同步。
- CI 目前只产出 **debug APK**；发布正式版需要自行配置签名。

## 许可与声明

- **代码**：MIT，见 [LICENSE](LICENSE)。
- **SCP Wiki 内容**：来自 [SCP Foundation Wiki](https://scp-wiki.wikidot.com/) 与 [SCP 中文分部](https://scp-wiki-cn.wikidot.com/)，除另有注明外遵循 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)。
- 本项目是非官方粉丝项目，与 SCP 基金会无隶属关系，不使用官方 SCP 标志。SCP 名称及相关内容归各自作者所有。

如果喜欢这个项目，欢迎提交 Issue 或 PR；请不要把 Wiki 正文重新打包进本仓库。
