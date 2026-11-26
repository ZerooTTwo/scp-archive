# 安卓工程（android）

这是 Capacitor 生成的 Android 原生工程，负责把 `dist/` 网页打包成 APK。**不需要 Android Studio 也能改前端**，只有改原生图标、启动图、签名或 Gradle 配置时才需要看这里。

## 目录

| 路径 | 说明 |
| --- | --- |
| `app/src/main/` | 主工程：Manifest、Java 入口、通用资源和网页产物 |
| `app/src/main/assets/public/` | `npx cap sync` 自动复制的网页构建，**不要手改** |
| `app/src/main/res/` | 默认图标、启动图、颜色和主题 |
| `app/src/official/res/` | 官方 SCP 标志版的图标和启动图（flavor `official`） |
| `app/src/cn/res/` | 中国分部标志版的图标和启动图（flavor `cn`） |
| `app/build.gradle` | 版本号、两个 flavor、release 签名配置 |
| `variables.gradle` | SDK 版本、依赖版本 |
| `gradlew` / `gradlew.bat` | Gradle Wrapper |

## 两个安装包

| Flavor | 包名 | 图标 |
| --- | --- | --- |
| `official` | `org.scparchive.reader` | 官方 SCP 标志 |
| `cn` | `org.scparchive.reader.cn` | SCP 中国分部龙形标志 |

```bash
# 需要 JDK 21 + Android SDK
cd android
./gradlew assembleOfficialRelease assembleCnRelease
```

产物在 `app/build/outputs/apk/<flavor>/release/`。正式签名由 CI 通过 Secrets 注入；本地未设置 `SCP_KEYSTORE_PATH` 等环境变量时，release 不签名。

## 注意

- 修改图标请改 `assets/brand/` 下的源图，再运行 `python scripts/make-icons.py`；不要直接改生成出来的 PNG。
- `app/src/main/assets/public/` 是生成目录，已在 `.gitignore` 中忽略。
- 不要提交 keystore、密码或 `signing.properties`。
