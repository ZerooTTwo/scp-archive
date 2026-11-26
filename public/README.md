# 静态资源（public）

这里的文件会原样复制到 `dist/`，再由 Capacitor 复制进 APK。

| 路径 | 说明 |
| --- | --- |
| `seed/catalog.json` | 全量目录快照：22,072 条编号、标题、系列、中英文分部；约 3.2 MB |
| `icons/` | 默认（官方）PWA 图标、maskable 图标、apple-touch-icon |
| `icons/official/` | 应用内“官方标志”图标 |
| `icons/cn/` | 应用内“中国分部”图标 |
| `favicon.png` / `favicon.svg` | 浏览器标签页图标 |

## 注意

- `seed/catalog.json` 由 `npm run seed` 生成，**不要手改**；要更新目录请运行脚本。
- `icons/` 下的图片由 `python scripts/make-icons.py` 生成，源文件在 `assets/brand/`。
- 文件名和路径是构建配置的一部分，改名会同时影响 PWA manifest 和 APK 图标。
