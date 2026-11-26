# 数据与工具（src/lib）

这一层不渲染界面，负责“数据从哪里来、怎么清洗、怎么存、怎么同步、怎么脱敏、怎么翻译”。

| 文件 | 作用 |
| --- | --- |
| `types.ts` | 全局类型：分支、条目、目录、文章、设置、权限、翻译记录 |
| `constants.ts` | 25 个系列定义、默认设置、同步间隔、离线上限、仓库地址 |
| `wiki.ts` | 抓取 Wikidot 页面、解析文章/系列页、错误码 |
| `sanitize.ts` | 白名单清洗正文 HTML，处理内链、外链、图片、折叠块、表格、目录 |
| `catalog.ts` | 读取/保存全量目录，查找条目、随机条目、排序 |
| `db.ts` | IndexedDB（idb-keyval）：目录、设置、收藏、历史、正文、进度、翻译缓存 |
| `sync.ts` | 增量同步 25 个系列页，保留旧缓存，标记新增条目 |
| `library.ts` | 正文缓存、离线淘汰、阅读进度 |
| `clearance.ts` | 六档人员等级、栏目权限、档案密级判定、正文脱敏 |
| `translate.ts` | OpenAI 兼容翻译接口、分批翻译、JSON 解析、测试连接 |
| `tagLabels.ts` | 常用 Wiki 标签的中文词典 |
| `external.ts` | 用系统浏览器打开外链（Android 用 Capacitor Browser） |
| `format.ts` | 数字、日期、字节、阅读时长格式化 |
| `hooks.ts` | 主题、在线状态、返回键、启动画面、媒体查询、文档标题等 hooks |

## 数据流

```text
Wiki 页面 → wiki.ts 解析 → sanitize.ts 清洗 → Reader 展示
                │
                ├─ cacheArticle() → IndexedDB（离线）
                ├─ articleSecurity() → 脱敏 HTML
                └─ translateArticle() → 翻译缓存
```

## 安全边界

- 不要绕过 `sanitize.ts` 直接渲染外部 HTML。
- 翻译 API Key 只存本机 IndexedDB；不要写进代码、日志或仓库。
- 脱敏只是阅读氛围模拟，不构成真实访问控制。
