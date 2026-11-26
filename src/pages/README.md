# 页面（src/pages）

每个文件对应一个路由，路由表在 `src/App.tsx`。

| 文件 | 路由 | 页面 |
| --- | --- | --- |
| `Home.tsx` | `/` | 首页：品牌、同步状态、统计、继续阅读、系列入口、随机档案 |
| `Browse.tsx` | `/browse` | 档案库：分部/系列筛选、编号搜索、滚动增量加载 |
| `Search.tsx` | `/search` | 搜索：编号/标题匹配、范围筛选、热门编号；从首页搜索入口进入，不占底栏 |
| `Library.tsx` | `/library` | 收藏与离线：收藏、阅读历史、离线正文 |
| `Reader.tsx` | `/read/:branch/:slug` | 阅读器：正文、目录、标签、进度、权限脱敏、机器翻译 |
| `Settings.tsx` | `/settings` | 设置：人员等级、应用标志、外观、翻译接口、本地数据、关于 |
| `Taskforces.tsx` | `/taskforces` | 机动特遣队：按权限显示名录/完整档案/锁定页 |
| `NotFound.tsx` | `*` | 404 档案未找到 |

## 修改提示

- 阅读器的正文 HTML 已经由 `lib/sanitize.ts` 清洗；不要在页面里直接插入未清洗的 Wiki HTML。
- 阅读器的权限脱敏在 `lib/clearance.ts`，翻译在 `lib/translate.ts`，页面只负责调用和展示。
- 所有页面切换后要把滚动位置复位（`App.tsx` 已统一处理，阅读器除外）。
