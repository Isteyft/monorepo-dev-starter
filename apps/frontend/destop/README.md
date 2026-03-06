# Next编辑器（Tauri + React）

基于 `Tauri + React + Vite` 的本地桌面编辑器，当前重点支持 `天赋(CreateAvatarJsonData)` 编辑与项目配置编辑。

## 功能

-   自定义顶部栏（拖拽移动、最小化、最大化/还原、关闭）
-   文件菜单：新建项目、打开项目、保存项目
-   三栏布局：项目树 / 数据表格 / 编辑表单
-   天赋表格：多选、批量删除、批量改 ID 开头、右键菜单
-   快捷键：
    -   `Ctrl/Cmd + C` 复制（软件内）
    -   `Ctrl/Cmd + V` 粘贴（支持重复 ID 批量重命名前缀）
    -   `Delete` 删除选中
-   Seid 编辑器：新增、删除、上下移动、属性编辑
-   项目配置：编辑 `Config/modConfig.json`

## 目录

-   前端：`apps/frontend/destop/src`
-   Tauri：`apps/frontend/destop/src-tauri`
-   文档：`doc/tauri-react-editor.md`

## 运行

你已说明手动安装依赖，安装后执行：

```bash
pnpm -C apps/frontend/destop tauri:dev
```

仅前端调试：

```bash
pnpm -C apps/frontend/destop dev
```

## 打包

```bash
pnpm -C apps/frontend/destop tauri:build
```

## 应用名与图标

-   应用名：`Next编辑器`
-   图标：`apps/frontend/destop/src-tauri/icons/icon.ico`
-   配置文件：`apps/frontend/destop/src-tauri/tauri.conf.json`

## 元数据加载

编辑器元数据支持两层来源并自动合并：

1. 内置：`editorMeta/*.json`
2. 扩展：`./config/*.json`

说明：`config` 下自定义同 ID 项会覆盖内置元数据，适配第三方自制数据。

## 保存路径

“保存项目”会统一写入：

-   `Config/modConfig.json`
-   `Data/CreateAvatarJsonData.json`
-   `Data/CrateAvatarSeidJsonData/*.json`

## 常见问题

1. `tauri.conf.json` 解析失败（expected value at line 1 column 1）

-   原因通常是编码/BOM异常。
-   处理：将该文件保存为 `UTF-8 无 BOM`。

2. 打开项目后分类/Seid未显示

-   确认 `editorMeta` 或 `config` 中存在对应 JSON。
-   进入天赋模块时会自动触发元数据预加载。
