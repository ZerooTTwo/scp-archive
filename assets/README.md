# 品牌源文件（assets）

这里放应用图标的**原始素材**，不是 App 运行时直接加载的图片。`scripts/make-icons.py` 会读取这些文件，生成 PWA 和 Android 所需的各种尺寸。

| 文件 | 中文说明 |
| --- | --- |
| `brand/scp-logo-official-badge.png` | 官方 SCP 徽记（1000×940，透明底） |
| `brand/scp-logo-official-black.png` | 官方 SCP 横版标志（2778×1167） |
| `brand/scp-cn-logo.png` | SCP 中国分部“中分标志”（400×400，龙形） |

## 生成图标

```bash
python scripts/make-icons.py
```

会更新：

- `public/icons/`：默认（官方）PWA 图标和 favicon
- `public/icons/official/`：应用内官方标志
- `public/icons/cn/`：应用内中国分部标志
- `android/app/src/official/res/`、`android/app/src/cn/res/`：两套桌面图标和启动图

## 许可

官方 SCP 标志来自 [SCP-Art-Repo](https://github.com/mofosyne/SCP-Art-Repo) 的 `Logo/v3.6/SCP_Logo-black-badge.png`；中国分部“中分标志”来自 [SCP 中文分部图形模板](https://o5command-int.wdfiles.com/local--files/tech-team:graphic-templates/scp-logo-cn-400.png)。两者均按 **CC BY-SA 3.0** 使用，版权归 SCP 基金会 / SCP 中文分部及原作者所有。

本项目是非官方粉丝项目，与 SCP 基金会无隶属关系。
