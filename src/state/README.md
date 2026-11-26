# 全局状态（src/state）

这一层用 React Context 管理跨页面状态。挂载顺序在 `src/main.tsx`：

```text
SettingsProvider
  └─ ToastProvider
       └─ CatalogProvider
            └─ LibraryProvider
                 └─ App
```

| 文件 | 管什么 |
| --- | --- |
| `settings.tsx` | 主题、字号、行高、衬线、默认分部、人员等级、应用标志、翻译配置 |
| `toast.tsx` | 底部 Snackbar 提示，支持“撤销/去设置”等操作按钮 |
| `catalog.tsx` | 全量目录、加载状态、同步进度、新增数量 |
| `library.tsx` | 收藏、阅读历史、离线正文索引、正文下载/删除 |

## 注意

- `Toast` 必须在 `Catalog` 外层，因为目录同步失败时要弹提示。
- 设置写入 IndexedDB，同时把主题、人员等级、应用标志镜像到 `localStorage`，供启动画面尽早读取。
- 收藏时会在后台下载正文；取消收藏可撤销记录，但不会自动删除已缓存正文。
