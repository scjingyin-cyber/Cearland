# 三角色域制作记录

- 成品文件: `app/map.html`
- 运行方式: 直接用浏览器打开 HTML 文件，不依赖外部库或网络。
- 主要逻辑: Canvas 绘制大量三角形；鼠标悬停时按距离放大当前与周边三角形；点击后给三角形赋予当前颜色。
- 标签逻辑: 用三角形邻接关系做同色连通区域搜索，每个相邻同色区域只绘制一次颜色名。
- 数据保存: 通过本地 Markdown 服务写入 `data/map.md`、`data/spells.md`、`data/dictionary.md`。
- 第二轮调整: 允许不断添加颜色种类，当前颜色可以用颜色选择器自定义；添加橡皮擦模式；悬停放大范围和幅度提高。
- 第三轮调整: `app/map.html` 改名为“天坑-卡厄兰”，支持按住拖动连续染色；新增 `app/Caerland.html`，其中“地图”窗口跳转到 `map.html?readonly=1`，进入后禁用编辑权限。
- 第四轮调整: `map.html?readonly=1` 切换为纯地图展示视图，隐藏编辑工具栏、已编辑地块数量和底部状态信息。
- 新增法术库: `app/spells.html` 提供搜索、添加、卡片查看和详情弹窗。
- 本地 Markdown 存储改造: 新增 `tools/local-markdown-server.js` 和 `data/map.md`、`data/spells.md`、`data/dictionary.md`；`map.html`、`spells.html`、`language_dictionary .html` 均改为通过本地服务读写 Markdown，不再使用浏览器缓存存储。
- 只读入口改造: `Caerland.html` 改为地图、字典、法术库三张卡片，全部进入 `readonly=1` 浏览模式；新增 `README.md` 说明启动、本地存储和手动修改数据方式。
- GitHub Pages 模式改造: 页面改为静态读取 `data/*.md`；本地双击编辑时保存为浏览器草稿，并通过“导出Markdown”生成可替换到 GitHub 仓库的 Markdown 数据文件。
- 本地编辑增强: `map.html`、`spells.html`、`language_dictionary .html` 均支持导入 Markdown 作为编辑起点，再导出同名 Markdown 用于更新 GitHub Pages 数据。
