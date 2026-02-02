// 导航网站主脚本
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前年份
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // 初始化
    init();
    
    // 搜索功能
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') performSearch();
    });
});

// 初始化函数
async function init() {
    try {
        // 从GitHub仓库获取数据
        const data = await fetchData();
        
        if (data && data.categories && data.websites) {
            // 更新统计信息
            updateStats(data);
            
            // 渲染分类标签
            renderCategoryTabs(data.categories);
            
            // 渲染网站卡片
            renderWebsites(data.websites, data.categories);
            
            // 添加分类点击事件
            addCategoryTabEvents(data);
        } else {
            showError('数据格式不正确');
        }
    } catch (error) {
        console.error('初始化失败:', error);
        showError('无法加载数据，请检查网络连接');
    }
}

// 从GitHub获取数据
async function fetchData() {
    // 这里使用GitHub raw content URL
    // 在实际部署时，需要替换为您的GitHub仓库raw URL
    const dataUrl = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/data.json';
    
    // 为了演示，如果获取失败，使用示例数据
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error('网络响应错误');
        return await response.json();
    } catch (error) {
        console.log('使用示例数据');
        return getSampleData();
    }
}

// 更新统计信息
function updateStats(data) {
    const siteCount = data.websites.length;
    const categoryCount = data.categories.length;
    
    document.getElementById('siteCount').textContent = siteCount;
    document.getElementById('categoryCount').textContent = categoryCount;
}

// 渲染分类标签
function renderCategoryTabs(categories) {
    const container = document.getElementById('categoryTabs');
    container.innerHTML = '';
    
    // 添加"全部"标签
    const allTab = document.createElement('div');
    allTab.className = 'category-tab active';
    allTab.dataset.categoryId = 'all';
    allTab.textContent = '全部';
    container.appendChild(allTab);
    
    // 添加各个分类标签
    categories.forEach(category => {
        const tab = document.createElement('div');
        tab.className = 'category-tab';
        tab.dataset.categoryId = category.id;
        tab.textContent = `${category.name} (${category.count || 0})`;
        container.appendChild(tab);
    });
}

// 渲染网站卡片
function renderWebsites(websites, categories) {
    const container = document.getElementById('websitesContainer');
    container.innerHTML = '';
    
    if (websites.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        return;
    }
    
    document.getElementById('noResults').style.display = 'none';
    
    websites.forEach(website => {
        const category = categories.find(c => c.id === website.category);
        const card = createWebsiteCard(website, category);
        container.appendChild(card);
    });
}

// 创建网站卡片
function createWebsiteCard(website, category) {
    const card = document.createElement('div');
    card.className = 'website-card';
    card.dataset.categoryId = website.category;
    
    // 生成随机图标（实际项目中可以使用网站favicon）
    const iconClass = getRandomIconClass();
    const iconColor = getRandomColor();
    
    card.innerHTML = `
        <div class="card-header">
            <div class="favicon" style="background-color: ${iconColor.light}; color: ${iconColor.dark};">
                <i class="${iconClass}"></i>
            </div>
            <h3>${website.name}</h3>
            <p>${website.description}</p>
        </div>
        <div class="card-body">
            <div class="card-tags">
                <span class="tag">${category ? category.name : '未分类'}</span>
                ${website.tags ? website.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
            </div>
        </div>
        <div class="card-footer">
            <a href="${website.url}" target="_blank" class="visit-btn">
                <i class="fas fa-external-link-alt"></i> 访问网站
            </a>
            <span class="date">${formatDate(website.addedDate)}</span>
        </div>
    `;
    
    return card;
}

// 添加分类标签点击事件
function addCategoryTabEvents(data) {
    const tabs = document.querySelectorAll('.category-tab');
    const websites = data.websites;
    const categories = data.categories;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 更新活动标签
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const categoryId = this.dataset.categoryId;
            
            // 筛选网站
            let filteredWebsites;
            if (categoryId === 'all') {
                filteredWebsites = websites;
            } else {
                filteredWebsites = websites.filter(website => website.category === categoryId);
            }
            
            // 重新渲染网站
            renderWebsites(filteredWebsites, categories);
            
            // 更新URL（不刷新页面）
            if (categoryId === 'all') {
                history.pushState(null, '', window.location.pathname);
            } else {
                const category = categories.find(c => c.id === categoryId);
                if (category) {
                    history.pushState(null, '', `#${category.name}`);
                }
            }
        });
    });
}

// 执行搜索
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const allCards = document.querySelectorAll('.website-card');
    let visibleCount = 0;
    
    allCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.card-header p').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        const matches = name.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       tags.some(tag => tag.includes(searchTerm));
        
        if (matches || searchTerm === '') {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 显示/隐藏无结果消息
    const noResults = document.getElementById('noResults');
    if (visibleCount === 0 && searchTerm !== '') {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
}

// 辅助函数
function getRandomIconClass() {
    const icons = [
        'fas fa-globe',
        'fas fa-search',
        'fas fa-shopping-cart',
        'fas fa-newspaper',
        'fas fa-video',
        'fas fa-music',
        'fas fa-gamepad',
        'fas fa-code',
        'fas fa-palette',
        'fas fa-chart-line',
        'fas fa-graduation-cap',
        'fas fa-briefcase'
    ];
    return icons[Math.floor(Math.random() * icons.length)];
}

function getRandomColor() {
    const colors = [
        { light: '#e3f2fd', dark: '#1976d2' },
        { light: '#f3e5f5', dark: '#7b1fa2' },
        { light: '#e8f5e9', dark: '#388e3c' },
        { light: '#fff3e0', dark: '#f57c00' },
        { light: '#fce4ec', dark: '#c2185b' },
        { light: '#e0f2f1', dark: '#00796b' },
        { light: '#fff8e1', dark: '#ff8f00' }
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(dateString) {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function showError(message) {
    const container = document.getElementById('websitesContainer');
    container.innerHTML = `
        <div class="no-results" style="display: block;">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                重试
            </button>
        </div>
    `;
}

// 示例数据
function getSampleData() {
    return {
        "categories": [
            { "id": "dev", "name": "开发工具", "color": "#4361ee", "count": 3 },
            { "id": "design", "name": "设计资源", "color": "#3a0ca3", "count": 2 },
            { "id": "productivity", "name": "效率工具", "color": "#4cc9f0", "count": 2 },
            { "id": "learning", "name": "学习平台", "color": "#f72585", "count": 2 }
        ],
        "websites": [
            {
                "id": "1",
                "name": "GitHub",
                "url": "https://github.com",
                "description": "全球最大的代码托管平台",
                "category": "dev",
                "tags": ["代码托管", "开源", "协作"],
                "addedDate": "2023-10-01",
                "featured": true
            },
            {
                "id": "2",
                "name": "CodePen",
                "url": "https://codepen.io",
                "description": "前端代码在线编辑与分享平台",
                "category": "dev",
                "tags": ["前端", "代码示例", "创作"],
                "addedDate": "2023-10-05",
                "featured": false
            },
            {
                "id": "3",
                "name": "MDN Web Docs",
                "url": "https://developer.mozilla.org",
                "description": "权威的Web技术文档",
                "category": "dev",
                "tags": ["文档", "Web开发", "学习"],
                "addedDate": "2023-10-10",
                "featured": true
            },
            {
                "id": "4",
                "name": "Dribbble",
                "url": "https://dribbble.com",
                "description": "设计师创意作品展示平台",
                "category": "design",
                "tags": ["设计", "灵感", "作品集"],
                "addedDate": "2023-09-15",
                "featured": true
            },
            {
                "id": "5",
                "name": "Figma",
                "url": "https://figma.com",
                "description": "在线协作界面设计工具",
                "category": "design",
                "tags": ["UI设计", "协作", "原型"],
                "addedDate": "2023-09-20",
                "featured": true
            },
            {
                "id": "6",
                "name": "Notion",
                "url": "https://notion.so",
                "description": "一体化工作区笔记工具",
                "category": "productivity",
                "tags": ["笔记", "项目管理", "协作"],
                "addedDate": "2023-10-12",
                "featured": false
            },
            {
                "id": "7",
                "name": "Trello",
                "url": "https://trello.com",
                "description": "看板式项目管理工具",
                "category": "productivity",
                "tags": ["项目管理", "看板", "协作"],
                "addedDate": "2023-10-08",
                "featured": false
            },
            {
                "id": "8",
                "name": "Coursera",
                "url": "https://coursera.org",
                "description": "国际知名在线课程平台",
                "category": "learning",
                "tags": ["在线课程", "教育", "认证"],
                "addedDate": "2023-09-25",
                "featured": true
            },
            {
                "id": "9",
                "name": "freeCodeCamp",
                "url": "https://freecodecamp.org",
                "description": "免费编程学习平台",
                "category": "learning",
                "tags": ["编程学习", "免费", "项目实践"],
                "addedDate": "2023-10-03",
                "featured": true
            }
        ]
    };
}