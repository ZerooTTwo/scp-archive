# 安卓工程（android）

这是 Capacitor 生成的 Android 原生工程，负责把 `dist/` 网页打包成 APK。**不需要 Android Studio 也能改前端**，只有改原生图标、启动图、签名、桌面图标切换或 Gradle 配置时才需要看这里。

## 目录

| 路径 | 说明 |
| --- | --- |
| `app/src/main/AndroidManifest.xml` | 主 Activity、两个 launcher `activity-alias`、权限 |
| `app/src/main/java/.../MainActivity.java` | Capacitor 入口，注册 `AppIconPlugin` |
| `app/src/main/java/.../AppIconPlugin.java` | 运行时启用官方/中分 launcher alias |
| `app/src/main/assets/public/` | `npx cap sync` 自动复制的网页构建，**不要手改** |
| `app/src/main/res/` | 两套桌面图标（`ic_launcher*` / `ic_launcher_cn*`）、启动图、颜色和主题 |
| `app/build.gradle` | 版本号、release 签名配置、单一 applicationId |
| `variables.gradle` | SDK 版本、依赖版本 |
| `gradlew` / `gradlew.bat` | Gradle Wrapper |

## 单一安装包

v0.5.0 起只构建一个 APK：

| 安装包 | 包名 | 图标 |
| --- | --- | --- |
| `scp-archive.apk` | `org.scparchive.reader` | 官方或中分，应用内切换 |

```bash
# 需要 JDK 21 + Android SDK
cd android
./gradlew assembleRelease
```

产物在 `app/build/outputs/apk/release/app-release.apk`。正式签名由 CI 通过 Secrets 注入；本地未设置 `SCP_KEYSTORE_PATH` 等环境变量时，release 不签名。

## 桌面图标切换

`AndroidManifest.xml` 里有两个 `activity-alias`：

- `MainActivityOfficial`：官方 SCP 标志，默认启用。
- `MainActivityCn`：中国分部中分标志，默认禁用。

`AppIconPlugin` 通过 `PackageManager.setComponentEnabledSetting` 先启用目标 alias，再禁用另一个。JS 侧在设置保存后调用；如果启动器缓存了旧图标，重新加载桌面即可。

网页/PWA 无法改系统桌面图标，只能切换应用内标志和 favicon。

## 注意

- 修改图标请改 `assets/brand/` 下的源图，再运行 `python scripts/make-icons.py`；不要直接改生成出来的 PNG。
- `app/src/main/assets/public/` 是生成目录，已在 `.gitignore` 中忽略。
- 不要提交 keystore、密码或 `signing.properties`。
