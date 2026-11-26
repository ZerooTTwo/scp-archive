# 通用组件（src/components）

这里放跨页面复用的 UI 组件，不包含业务数据。

| 文件 | 说明 |
| --- | --- |
| `ui.tsx` | 基础组件：Button、IconButton、Fab、Chip、Segmented、Switch、Slider、TextField、TopBar、Card、Badge、LinearProgress、Spinner、EmptyState、Skeleton、Sheet、Dialog、Snackbar |
| `Icon.tsx` | 线性图标集合与 `Logo` 品牌标志（支持 official / cn 两套图标） |
| `NavBar.tsx` | 底部导航栏：首页、档案库、特遣队（中间）、收藏、设置；横屏时变成左侧导航栏；3 级以下隐藏“特遣队” |
| `EntryRow.tsx` | 档案列表行：编号、标题、进度、离线标记、NEW、搜索高亮 |

## 约定

- 组件只接收 props，不直接读写 IndexedDB 或 Wiki。
- 样式类名统一写在 `src/styles/components.css`；页面级布局写在 `pages.css`。
- 按钮必须带可读的 `label`/文字，图标按钮使用 `IconButton` 的 `label` 作为无障碍名称。
