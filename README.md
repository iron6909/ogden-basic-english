# Ogden Basic English 850 词课程

面向中文学习者的静态单词学习网站：85 课、每课 10 词，包含核心意象、双语例句、易混辨析、小测与速查卡。

## 本地预览

直接打开 `index.html`，或在项目目录运行：

```bash
python -m http.server 8000
```

然后访问 <http://localhost:8000/>。

## 重新生成课程页面

编辑 `assets/vocabulary.json` 或 `tools/build-course.js` 后运行：

```bash
node tools/build-course.js
```

## 部署到 GitHub Pages

仓库已包含 `.github/workflows/pages.yml`。将仓库推送到 GitHub 的 `main` 分支后：

1. 打开仓库 **Settings → Pages**。
2. 在 **Build and deployment** 中将 **Source** 设为 **GitHub Actions**。
3. 推送 `main`，或在 **Actions → Deploy static course to GitHub Pages** 手动运行。

部署地址通常是：

- 用户站点仓库 `<用户名>.github.io`：`https://<用户名>.github.io/`
- 普通项目仓库 `<仓库名>`：`https://<用户名>.github.io/<仓库名>/`

站内链接全部使用相对路径，两种地址均可工作。
