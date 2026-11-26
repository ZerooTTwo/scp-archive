# 应用源码（src）

这里是 SCP Archive 的 React + TypeScript 源码。`npm run build` 会把这一目录编译成 `dist/`，再由 Capacitor 复制进 Android 工程。

## 子目录

| 目录 | 中文名 | 里面有什么 |
| --- | --- | --- |
| [`components/`](components/README.md) | 通用组件 | 按钮、弹层、图标、底栏、档案列表行 |
| [`pages/`](pages/README.md) | 页面 | 首页、档案库、搜索、收藏、阅读器、设置、特遣队 |
| [`lib/`](lib/README.md) | 数据与工具 | Wiki 抓取、HTML 清洗、IndexedDB、同步、权限脱敏、翻译 |
| [`state/`](state/README.md) | 全局状态 | 设置、Toast、目录、收藏/历史/离线 |
| [`styles/`](styles/README.md) | 样式 | Material 3 token、基础、组件、页面、阅读器排版 |
| [`data/`](data/README.md) | 静态内容 | 机动特遣队名录 |

## 根文件

| 文件 | 说明 |
| --- | --- |
| `App.tsx` | 路由表和整体壳层（HashRouter、底栏、返回键） |
| `main.tsx` | React 入口，按顺序挂载四个 Provider |
| `vite-env.d.ts` | Vite 类型声明 |

## 改代码前注意

- 页面路由在 `App.tsx`，新增页面要同时加路由和底栏入口。
- `state/` 里的 Provider 有顺序要求：`Toast` 必须在 `Catalog` 外层，否则目录同步失败时无法弹提示。
- 用户可见文案统一用中文；专有名词（SCP、Keter、O5、API Key）保留原文。
- 不要把 API Key、keystore、token 写进源码。
