# Next编辑器（Tauri + React）开发记录

## 当前应用信息

-   应用名称：`Next编辑器`
-   Tauri Product Name：`Next编辑器`
-   窗口标题：`Next编辑器`
-   应用图标：`apps/frontend/destop/src-tauri/icons/icon.ico`

## 目录结构（前端）

-   `apps/frontend/destop/src/components/project/*`
-   `apps/frontend/destop/src/components/topbar/*`
-   `apps/frontend/destop/src/components/workspace/*`
-   `apps/frontend/destop/src/components/tianfu/*`
-   `apps/frontend/destop/src/hooks/*`
-   `apps/frontend/destop/src/services/*`
-   `apps/frontend/destop/src/types/*`
-   `apps/frontend/destop/src/utils/*`

## 主要功能状态

### 1. 顶部栏与窗口控制

-   自定义顶部栏（无系统默认标题栏）
-   支持窗口拖拽移动（系统级）
-   支持最小化、最大化/还原、关闭
-   顶部菜单保留“文件”
-   文件菜单支持：新建项目、打开项目、保存项目

### 2. 布局与模块

-   三栏布局：
    -   左侧：项目文件夹（模块树）
    -   中间：数据内容（表格）
    -   右侧：编辑区域（表单）
-   当前模块键：
    -   项目配置：`project-config`
    -   天赋：`talent`
    -   神通：`skill`
    -   功法：`staticskill`

### 3. 天赋（CreateAvatarJsonData）

-   表格列：`ID / 天赋名字 / 分类 / 描述`
-   点击行可在右侧编辑表单中修改
-   支持新增（弹窗输入 ID）
-   支持多选：
    -   普通点击单选
    -   `Shift` 连续多选
    -   `Ctrl/Cmd` 离散多选
-   支持删除：
    -   工具栏垃圾桶
    -   `Delete` 快捷键
    -   右键菜单“删除所选”
-   支持批量改 ID：
    -   右键菜单“批量修改ID开头”
    -   输入前缀后按顺序生成 `prefix1/prefix2/...`
-   表格文字不可选中（避免系统文字高亮干扰多选）

### 4. 复制/粘贴（软件内）

-   `Ctrl/Cmd + C`：复制当前选中条目（支持多条）
-   `Ctrl/Cmd + V`：粘贴到当前天赋表
-   重复 ID 处理：
    -   检测到冲突时提示输入“新 ID 前缀”
    -   对冲突项执行批量重命名生成新 ID
    -   若新 ID 仍冲突则中断并提示

### 5. Seid 编辑

-   支持打开 Seid 编辑弹窗
-   支持新增/删除/上下移动 Seid
-   支持读取 Seid 元数据并按 Properties 渲染表单
-   Seid 数据缓存并可随项目保存到 `Data/CrateAvatarSeidJsonData/*.json`

### 6. 项目配置（modConfig.json）

-   打开路径：`<modRoot>/Config/modConfig.json`
-   右侧表单编辑：名称、作者、版本、描述
-   `Settings` 隐藏但保留原值
-   保存项目时统一落盘

### 7. 缓存与保存策略

-   编辑后先保存到内存缓存（不立即写盘）
-   文件菜单“保存项目”时统一写入：
    -   `Config/modConfig.json`
    -   `Data/CreateAvatarJsonData.json`
    -   `Data/CrateAvatarSeidJsonData/*.json`

## 元数据加载（重点）

### 内置元数据

-   来源：`editorMeta/*`
-   目前使用：
    -   `CreateAvatarTalentType.json`
    -   `CreateAvatarSeidMeta.json`

### 自定义元数据扩展

-   新增来源：`./config/*.json`
-   行为：
    -   启动/打开项目/进入天赋模块时自动预加载
    -   自动识别并合并天赋分类与 Seid 元数据
    -   自定义数据可覆盖内置同 ID 项
-   统一入口方法：
    -   `preloadEditorMeta(...)`
    -   文件：`apps/frontend/destop/src/components/tianfu/talent-meta.ts`

## 主题与样式

-   已按 GitHub 亮色主题系调整（白底、灰边、黑字）
-   关键色：
    -   主背景：`#FFFFFF`
    -   边框：`#E1E4E8`
    -   滚动轨道：`#F2F3F4`
    -   选中背景：`#EDEFF2`

## 最近修复

-   修复 `tauri.conf.json` 因编码/BOM导致的 JSON 解析失败
-   已重写为 UTF-8 无 BOM

## 运行

```bash
pnpm -C apps/frontend/destop tauri:dev
```
