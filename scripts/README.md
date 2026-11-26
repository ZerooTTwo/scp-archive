# 构建脚本（scripts）

这里只有两支脚本：生成目录快照、生成两套图标。

| 文件 | 作用 | 命令 |
| --- | --- | --- |
| `build-seed.mjs` | 抓取 SCP Wiki 的 25 个系列页，解析编号/标题，去重后写入 `public/seed/catalog.json` | `npm run seed` |
| `make-icons.py` | 从 `assets/brand/` 的源图生成 PWA、Android 官方/中分两套图标和启动图 | `python scripts/make-icons.py` |

## 目录快照

```bash
npm run seed
```

- 需要 Node.js 22+ 和网络。
- 脚本有并发限制和请求间隔，不要高频运行，避免给 Wiki 造成压力。
- 输出约 3.6 MB、24,791 条；包含中文译文、中文原创和英文总部。
- Wiki 页面结构变化时，需要同步调整脚本里的选择器和解析规则。

## 图标

```bash
python scripts/make-icons.py
```

- 需要 Python 3 和 Pillow。
- 源文件在 `assets/brand/`，不要直接改生成出来的 PNG。
- 会同时更新 `public/icons/` 和 `android/app/src/main/res/`（官方与中分两套桌面图标、官方启动图）。
- 图标许可见 [`assets/README.md`](../assets/README.md)。
