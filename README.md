导航网站部署指南

项目概述

这是一个基于GitHub仓库和Cloudflare Pages的导航网站，包含：

· 前端导航页面（首页）
· 后台管理页面（/admin）
· 数据存储在GitHub仓库的JSON文件中
· 通过GitHub API进行数据管理

部署步骤

1. 创建GitHub仓库

1. 登录GitHub，创建一个新的公开仓库（如：my-nav-website）
2. 将项目文件上传到仓库：
   · index.html
   · admin.html
   · styles.css
   · script.js
   · admin.js
   · data.json（示例数据）

2. 生成GitHub访问令牌

1. 进入GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击"Generate new token (classic)"
3. 设置权限：
   · repo（完全控制仓库）
   · workflow（可选，用于自动部署）
4. 生成令牌并妥善保存（只显示一次）

3. 部署到Cloudflare Pages

1. 登录Cloudflare Dashboard
2. 进入"Workers & Pages" → "Create application" → "Pages"
3. 选择"Connect to Git"
4. 授权访问你的GitHub仓库
5. 配置构建设置：
   · 框架预设：None
   · 构建命令：留空
   · 构建输出目录：/（根目录）
6. 点击"Save and Deploy"

4. 配置环境变量（可选）

在Cloudflare Pages设置中，可以添加环境变量：

· GITHUB_REPO: 你的GitHub仓库（如：username/repo）
· GITHUB_TOKEN: 你的GitHub访问令牌

5. 配置自定义域名（可选）

1. 在Cloudflare Pages项目设置中，选择"Custom domains"
2. 添加你的域名
3. 按照提示配置DNS记录

使用方法

访问网站

· 导航首页：https://your-domain.pages.dev/
· 后台管理：https://your-domain.pages.dev/admin

管理后台功能

1. 网站管理：添加、编辑、删除导航网站
2. 分类管理：管理网站分类
3. 设置：配置GitHub仓库信息

首次使用后台

1. 访问 /admin 页面
2. 进入"设置"部分
3. 填写你的GitHub仓库信息：
   · GitHub仓库：username/repo-name
   · GitHub访问令牌：之前生成的令牌
   · 数据文件路径：data.json
4. 点击"保存设置"
5. 点击"测试连接"验证配置
6. 现在你可以使用后台管理功能了

数据存储原理

· 数据存储在GitHub仓库的data.json文件中
· 前端通过GitHub API读取数据
· 后台通过GitHub API修改数据
· 每次修改都会创建一个新的提交到仓库

注意事项

1. GitHub令牌需要妥善保管，不要公开分享
2. 仓库需要设置为公开，或令牌需要对应权限
3. Cloudflare Pages有免费额度，适合个人使用
4. 如果需要更复杂的权限控制，可以添加简单的密码保护

故障排除

1. 无法加载数据：检查GitHub仓库配置是否正确
2. 保存失败：检查GitHub令牌权限是否足够
3. 页面显示异常：清除浏览器缓存
4. 部署失败：检查文件路径和配置

扩展功能建议

1. 添加搜索功能
2. 支持多语言
3. 添加用户认证
4. 集成更多数据源
5. 添加统计分析

项目结构

```
├── index.html          # 主页面
├── admin.html         # 后台管理页面
├── styles.css         # 样式文件
├── script.js          # 主页面脚本
├── admin.js           # 后台管理脚本
├── data.json          # 数据文件（示例）
└── README.md          # 说明文档
```

技术支持

如有问题，请参考：

· Cloudflare Pages文档
· GitHub API文档
· 项目GitHub仓库

---

注意：这是一个纯前端解决方案，所有数据操作都通过GitHub API完成。如果需要更复杂的功能或更好的性能，可以考虑添加后端服务。