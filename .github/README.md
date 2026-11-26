# CI 配置（.github）

这个目录放 GitHub Actions 工作流，负责在云端构建 Android 安装包，不需要本地安装 Android SDK。

| 文件 | 说明 |
| --- | --- |
| `workflows/android.yml` | 在 `ubuntu-latest` 上安装 Node 22、JDK 21，执行 `npm ci`、`npm run build`、`npx cap sync android`，再构建一个 release APK，校验签名后上传 artifact；打 `v*` tag 时附加到 GitHub Release |

## 触发条件

- push 到 `main` / `master`
- Pull Request
- 手动 `workflow_dispatch`
- 推送 `v*` tag

## 签名方式

工作流从仓库 Secrets 读取：

| Secret | 用途 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | release keystore 的 Base64 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | 密钥别名 |
| `ANDROID_KEY_PASSWORD` | 密钥密码 |

keystore 只会在 runner 的临时目录中解码，不会进入仓库。**不要把 keystore、密码或 token 提交到这个目录。**

## 产物

- `scp-archive.apk`：单一安装包，包名 `org.scparchive.reader`
- 桌面图标在应用内「设置 → 应用标志」切换，不需要两个安装包

APK 使用 release keystore 签名；Actions artifact 名称是 `scp-archive-apk`。
