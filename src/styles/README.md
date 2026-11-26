# 样式（src/styles）

手写 Material 3 设计系统，没有使用 UI 组件库。设计方向是“基金会档案”：暖纸色、氧化红、衬线标题和档案编号。

| 文件 | 内容 |
| --- | --- |
| `tokens.css` | 颜色、间距、圆角、阴影、字体、层级、动画；浅色/深色；六档人员等级主色 |
| `base.css` | reset、页面背景、`.app` 容器、通用布局、列表、纸张纹理 |
| `components.css` | 按钮、图标按钮、FAB、Chip、分段控件、开关、滑块、输入框、顶栏、卡片、导航栏、列表行、弹层、Toast；横屏侧栏 |
| `pages.css` | 首页、档案库、搜索、收藏、设置、特遣队、404 的页面布局 |
| `reader.css` | 阅读器排版、标题、标签、目录、表格、图片、折叠块、脚注、脱敏黑条、翻译提示 |

## 约定

- 颜色和尺寸优先使用 `tokens.css` 里的 CSS 变量，不要在页面里写死色值。
- 暗色主题通过 `:root[data-theme='dark']`，人员等级通过 `:root[data-clearance='...']`。
- 横屏侧栏在 `components.css` 末尾的 `@media (orientation: landscape) and (max-height: 560px)`。
- 新增页面样式放 `pages.css`，新增正文排版放 `reader.css`。
