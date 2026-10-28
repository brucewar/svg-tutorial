# 本地预览与发布

本项目使用 Docsify 5.0.0 在浏览器中渲染 Markdown，GitHub Pages 托管静态文件，无需构建文档，也无需安装 GitBook。Docsify、主题和搜索插件均保存在 `assets/vendor/docsify/` 中，阅读时无需请求外部 CDN。教程原有的 YouTube 视频和部分外部示例资源仍依赖对应网站。

## 本地预览

在仓库根目录执行：

```sh
npm run dev
```

首次运行会通过 npm 下载 http-server。也可以使用 Python 3，无需 npm：

```sh
python -m http.server 3000
```

访问 <http://localhost:3000/>。请通过 HTTP 服务访问，不要直接双击 `index.html`，因为浏览器需要通过 HTTP 加载 Markdown。

## GitHub Pages 自动发布

1. 将修改推送到 GitHub 仓库。
2. 打开仓库的 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。此设置只需完成一次。
3. 打开 **Actions → Deploy documentation to GitHub Pages → Run workflow**，选择 `master` 分支并运行。以后每次推送到 `master` 都会自动发布。
4. 在 Actions 中等待任务成功，再访问 <https://brucewar.github.io/svg-tutorial/>。

工作流位于 `.github/workflows/pages.yml`，只收集和上传静态文件，不运行 npm 安装或文档编译，不需要额外配置部署密钥。如果更改默认分支名称，请同步修改工作流中的 `branches`。

正文、图片和站点资源使用相对路径，适用于 `/svg-tutorial/` 项目路径以及自定义域名根路径。

## 自定义域名

1. 先在仓库的 **Settings → Pages → Custom domain** 中填写你拥有的域名并保存，例如 `svg.example.com`。
2. 如果使用子域名，在域名的 DNS 管理中添加 `CNAME`，将 `svg` 指向 **`brucewar.github.io`**。目标不带 `https://`，也不带 `/svg-tutorial/` 路径。
3. 如果使用根域名，请按照 [GitHub 官方文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)配置 `A`、`ALIAS` 或 `ANAME` 记录。
4. 等待 DNS 检查及证书签发完成，启用 **Enforce HTTPS**。

本项目通过 GitHub Actions 发布，自定义域名在 Pages 设置中管理，不需要提交 `CNAME` 文件。域名需自行购买和续费；自定义域名不改变网站实际托管在 GitHub Pages 的事实。

## 更新内容

- 修改章节对应的 Markdown 文件并推送即可自动发布。
- 新增章节时，在 `SUMMARY.md` 中添加链接；它同时用作网站侧边栏和搜索索引的目录。
- 章节间链接使用相对 Markdown 路径，例如 `[SVG轮廓](28.SVG轮廓.md#stroke-width)`。不要使用旧 GitBook 的 `/文章.html` 路径。
- 第 32 章交互演示由 `assets/demos.js` 在页面加载后绑定事件，并在切换章节时清理动画定时器；代码块中的完整教学示例仍可独立使用。
- Docsify 固定版本和许可证见 `assets/vendor/docsify/README.md`。升级时替换本地资源并检查导航、搜索及 SVG 演示。

## 验证 SVG 渲染

`assets/site.js` 中的 Markdown 扩展会将完整的内嵌 SVG（包括空行和嵌套视口）作为 HTML 处理，防止内部缩进被解析成代码块。围栏代码块中的 SVG 仍作为源码展示。

开发时可以执行以下命令验证实际浏览器渲染，不影响静态站点的部署：

```sh
npm install
npx playwright install chromium
npm test
```

测试会自动启动临时预览服务，检查第 36 章的实际图形、嵌套 SVG 和代码块。如果使用已安装的 Edge，可在 PowerShell 中设置 `$env:PLAYWRIGHT_CHANNEL = 'msedge'` 后运行 `npm test`，无需安装 Chromium。

发布方式也可参考 [GitHub Pages 官方工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## Google Analytics 4

站点使用 `assets/analytics.js` 接入 GA4，衡量 ID 为 `G-B05S8PK6J6`。只有 `svg.brucewar.cn` 加载 Google tag，本地预览和测试域名不发送统计数据。Google 的统计脚本或请求被阻止时，教程仍可正常阅读。

首次进入页面和切换章节后发送一次 `page_view`，章节内锚点跳转不重复计数。事件包含章节标题和上一页地址；为了让 GA4 按章节显示页面路径，会将 `/#/9.SVG-rect元素` 记录为虚拟路径 `/9.SVG-rect元素`，网站实际路由保持不变。

**GA4 后台需关闭自动历史记录浏览量统计**：进入 **管理 → 数据流 → 本网站 → 增强型衡量（齿轮）→ 网页浏览量 → 显示高级设置**，关闭“根据浏览器历史记录事件进行网页更改”（Page changes based on browser history events）。代码已设置 `send_page_view: false`，但该设置本身不会关闭增强型衡量的历史事件；两者同时启用会导致重复统计。参见 [Google 官方说明](https://developers.google.com/analytics/devguides/collection/ga4/views?technology=websites)。

发布后，在 GA4 的“实时”报告中访问首页并切换章节，检查对应页面标题；需要排查事件时可使用 Tag Assistant 或 DebugView。`npm test` 会验证首次访问、章节切换、返回、锚点去重和本地预览排除，并拦截 Google 请求，避免向正式数据流发送测试数据。
