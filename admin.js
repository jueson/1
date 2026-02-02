// 导航网站后台管理脚本
document.addEventListener('DOMContentLoaded', function() {
    // 初始化管理后台
    initAdmin();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载数据
    loadData();
});

// 管理后台数据
let adminData = {
    categories: [],
    websites: [],
    settings: {}
};

// 当前编辑状态
let currentEditId = null;
let currentTags = [];

// 初始化管理后台
function initAdmin() {
    // 从本地存储加载设置
    loadSettings();
    
    // 设置侧边栏导航
    setupSidebarNav();
    
    // 显示网站管理部分
    showSection('websites');
}

// 设置事件监听器
function setupEventListeners() {
    // 添加网站按钮
    document.getElementById('addWebsiteBtn').addEventListener('click', function() {
        showWebsiteForm();
    });
    
    // 添加分类按钮
    document.getElementById('addCategoryBtn').addEventListener('click', function() {
        showCategoryForm();
    });
    
    // 取消表单按钮
    document.getElementById('cancel-form').addEventListener('click', function() {
        hideWebsiteForm();
    });
    
    // 取消分类表单按钮
    document.getElementById('cancel-category-form').addEventListener('click', function() {
        hideCategoryForm();
    });
    
    // 网站表单提交
    document.getElementById('website-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveWebsite();
    });
    
    // 分类表单提交
    document.getElementById('category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCategory();
    });
    
    // 标签输入
    document.getElementById('tag-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    });
    
    document.getElementById('add-tag-btn').addEventListener('click', function() {
        addTag();
    });
    
    // 设置表单提交
    document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings();
    });
    
    // 测试连接按钮
    document.getElementById('test-connection').addEventListener('click', function() {
        testGitHubConnection();
    });
    
    // 导出数据按钮
    document.getElementById('export-data').addEventListener('click', function() {
        exportData();
    });
    
    // 退出按钮
    document.getElementById('logoutBtn').addEventListener('click', function() {
        window.location.href = '/';
    });
}

// 设置侧边栏导航
function setupSidebarNav() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 更新活动链接
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应部分
            const section = this.dataset.section;
            showSection(section);
        });
    });
}

// 显示指定部分
function showSection(sectionId) {
    // 隐藏所有部分
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // 显示指定部分
    document.getElementById(`${sectionId}-section`).classList.remove('hidden');
    
    // 如果显示网站部分，确保表单隐藏
    if (sectionId === 'websites') {
        hideWebsiteForm();
    }
    
    // 如果显示分类部分，确保表单隐藏
    if (sectionId === 'categories') {
        hideCategoryForm();
    }
}

// 加载数据
async function loadData() {
    try {
        // 从GitHub仓库或示例数据获取数据
        const data = await fetchDataFromGitHub();
        
        if (data) {
            adminData.categories = data.categories || [];
            adminData.websites = data.websites || [];
            
            // 更新分类中的网站计数
            updateCategoryCounts();
            
            // 渲染网站表格
            renderWebsitesTable();
            
            // 渲染分类表格
            renderCategoriesTable();
            
            // 填充分类选择框
            populateCategorySelect();
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showAlert('无法加载数据，请检查网络连接或GitHub配置', 'error');
        
        // 使用示例数据
        loadSampleData();
    }
}

// 从GitHub获取数据
async function fetchDataFromGitHub() {
    const settings = getSettings();
    
    // 如果没有配置GitHub仓库，使用示例数据
    if (!settings.githubRepo) {
        return getSampleData();
    }
    
    const repo = settings.githubRepo;
    const dataFile = settings.dataFile || 'data.json';
    const token = settings.githubToken;
    
    // 构建GitHub raw content URL
    let url = `https://raw.githubusercontent.com/${repo}/main/${dataFile}`;
    
    // 如果有令牌，可以使用GitHub API获取（更可靠）
    if (token) {
        url = `https://api.github.com/repos/${repo}/contents/${dataFile}`;
    }
    
    try {
        const options = token ? {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3.raw'
            }
        } : {};
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`GitHub API错误: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('从GitHub获取数据失败:', error);
        
        // 如果使用API失败，尝试直接获取raw内容
        if (token) {
            const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${dataFile}`;
            try {
                const response = await fetch(rawUrl);
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.error('从raw URL获取数据也失败:', e);
            }
        }
        
        throw error;
    }
}

// 保存数据到GitHub
async function saveDataToGitHub() {
    const settings = getSettings();
    
    // 如果没有配置GitHub仓库，只更新本地数据
    if (!settings.githubRepo || !settings.githubToken) {
        showAlert('GitHub配置不完整，数据仅保存到本地', 'warning');
        saveToLocalStorage();
        return false;
    }
    
    const repo = settings.githubRepo;
    const dataFile = settings.dataFile || 'data.json';
    const token = settings.githubToken;
    
    // 准备数据
    const data = {
        categories: adminData.categories,
        websites: adminData.websites,
        updated: new Date().toISOString()
    };
    
    const content = JSON.stringify(data, null, 2);
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));
    
    // 首先获取文件的SHA（如果存在）
    let sha = '';
    try {
        const getUrl = `https://api.github.com/repos/${repo}/contents/${dataFile}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (getResponse.ok) {
            const fileInfo = await getResponse.json();
            sha = fileInfo.sha;
        }
    } catch (error) {
        console.log('文件可能不存在，将创建新文件');
    }
    
    // 创建或更新文件
    const url = `https://api.github.com/repos/${repo}/contents/${dataFile}`;
    const body = {
        message: `更新导航数据 ${new Date().toLocaleString()}`,
        content: contentEncoded,
        sha: sha || undefined
    };
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            showAlert('数据已成功保存到GitHub仓库', 'success');
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || '保存失败');
        }
    } catch (error) {
        console.error('保存到GitHub失败:', error);
        showAlert(`保存到GitHub失败: ${error.message}`, 'error');
        
        // 保存到本地存储作为备份
        saveToLocalStorage();
        return false;
    }
}

// 渲染网站表格
function renderWebsitesTable() {
    const tableBody = document.getElementById('websites-table-body');
    tableBody.innerHTML = '';
    
    if (adminData.websites.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 2rem; color: var(--light-gray); margin-bottom: 15px; display: block;"></i>
                    <p>暂无网站数据</p>
                    <button id="add-first-website" class="btn" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> 添加第一个网站
                    </button>
                </td>
            </tr>
        `;
        
        document.getElementById('add-first-website')?.addEventListener('click', function() {
            showWebsiteForm();
        });
        
        return;
    }
    
    adminData.websites.forEach(website => {
        const category = adminData.categories.find(c => c.id === website.category);
        const categoryName = category ? category.name : '未分类';
        
        // 格式化日期
        const addedDate = website.addedDate ? 
            new Date(website.addedDate).toLocaleDateString('zh-CN') : '未知';
        
        // 标签显示
        const tagsHtml = website.tags && website.tags.length > 0 ? 
            website.tags.slice(0, 2).map(tag => `<span class="tag-badge">${tag}</span>`).join('') + 
            (website.tags.length > 2 ? `<span class="tag-badge">+${website.tags.length - 2}</span>` : '') : 
            '<span style="color: var(--gray-color); font-style: italic;">无标签</span>';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${website.name}</strong>
                ${website.featured ? '<span class="status-badge status-published" style="margin-left: 8px;">精选</span>' : ''}
            </td>
            <td>${categoryName}</td>
            <td>
                <a href="${website.url}" target="_blank" style="color: var(--primary-color); text-decoration: none;">
                    ${website.url.length > 30 ? website.url.substring(0, 30) + '...' : website.url}
                    <i class="fas fa-external-link-alt" style="margin-left: 5px; font-size: 0.8rem;"></i>
                </a>
            </td>
            <td>${tagsHtml}</td>
            <td>${addedDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" data-id="${website.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete" data-id="${website.id}">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 添加编辑和删除事件
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            editWebsite(id);
        });
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            deleteWebsite(id);
        });
    });
}

// 渲染分类表格
function renderCategoriesTable() {
    const tableBody = document.getElementById('categories-table-body');
    tableBody.innerHTML = '';
    
    if (adminData.categories.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class="fas fa-list" style="font-size: 2rem; color: var(--light-gray); margin-bottom: 15px; display: block;"></i>
                    <p>暂无分类数据</p>
                    <button id="add-first-category" class="btn" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> 添加第一个分类
                    </button>
                </td>
            </tr>
        `;
        
        document.getElementById('add-first-category')?.addEventListener('click', function() {
            showCategoryForm();
        });
        
        return;
    }
    
    adminData.categories.forEach(category => {
        // 统计该分类下的网站数量
        const websiteCount = adminData.websites.filter(w => w.category === category.id).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 15px; height: 15px; border-radius: 3px; background-color: ${category.color || '#4361ee'};"></div>
                    <strong>${category.name}</strong>
                </div>
            </td>
            <td><code>${category.id}</code></td>
            <td><code>${category.color || '#4361ee'}</code></td>
            <td>${websiteCount}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" data-id="${category.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete" data-id="${category.id}">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 添加编辑和删除事件
    document.querySelectorAll('#categories-table-body .action-btn.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            editCategory(id);
        });
    });
    
    document.querySelectorAll('#categories-table-body .action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            deleteCategory(id);
        });
    });
}

// 填充分类选择框
function populateCategorySelect() {
    const select = document.getElementById('website-category');
    select.innerHTML = '<option value="">请选择分类</option>';
    
    adminData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// 显示网站表单
function showWebsiteForm(website = null) {
    const formContainer = document.getElementById('website-form-container');
    const formTitle = document.getElementById('form-title');
    const websitesList = document.getElementById('websites-list');
    
    if (website) {
        // 编辑模式
        formTitle.textContent = '编辑网站';
        currentEditId = website.id;
        
        // 填充表单数据
        document.getElementById('website-id').value = website.id;
        document.getElementById('website-name').value = website.name;
        document.getElementById('website-url').value = website.url;
        document.getElementById('website-description').value = website.description || '';
        document.getElementById('website-category').value = website.category || '';
        document.getElementById('website-date').value = website.addedDate || new Date().toISOString().split('T')[0];
        document.getElementById('website-featured').checked = website.featured || false;
        
        // 设置标签
        currentTags = website.tags || [];
        renderTags();
    } else {
        // 添加模式
        formTitle.textContent = '添加新网站';
        currentEditId = null;
        
        // 清空表单
        document.getElementById('website-form').reset();
        document.getElementById('website-id').value = '';
        document.getElementById('website-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('website-featured').checked = false;
        
        // 清空标签
        currentTags = [];
        renderTags();
    }
    
    // 显示表单，隐藏列表
    formContainer.classList.remove('hidden');
    websitesList.classList.add('hidden');
}

// 隐藏网站表单
function hideWebsiteForm() {
    const formContainer = document.getElementById('website-form-container');
    const websitesList = document.getElementById('websites-list');
    
    formContainer.classList.add('hidden');
    websitesList.classList.remove('hidden');
    
    // 重置表单
    document.getElementById('website-form').reset();
    currentEditId = null;
    currentTags = [];
    renderTags();
}

// 显示分类表单
function showCategoryForm(category = null) {
    const formContainer = document.getElementById('category-form-container');
    const formTitle = document.getElementById('category-form-title');
    const categoriesList = document.getElementById('categories-list');
    
    if (category) {
        // 编辑模式
        formTitle.textContent = '编辑分类';
        currentEditId = category.id;
        
        // 填充表单数据
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-color').value = category.color || '#4361ee';
        document.getElementById('category-id-input').value = category.id;
    } else {
        // 添加模式
        formTitle.textContent = '添加新分类';
        currentEditId = null;
        
        // 清空表单
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';
        document.getElementById('category-color').value = '#4361ee';
    }
    
    // 显示表单，隐藏列表
    formContainer.classList.remove('hidden');
    categoriesList.classList.add('hidden');
}

// 隐藏分类表单
function hideCategoryForm() {
    const formContainer = document.getElementById('category-form-container');
    const categoriesList = document.getElementById('categories-list');
    
    formContainer.classList.add('hidden');
    categoriesList.classList.remove('hidden');
    
    // 重置表单
    document.getElementById('category-form').reset();
    currentEditId = null;
}

// 添加标签
function addTag() {
    const tagInput = document.getElementById('tag-input');
    const tagValue = tagInput.value.trim();
    
    if (tagValue && !currentTags.includes(tagValue)) {
        currentTags.push(tagValue);
        renderTags();
        tagInput.value = '';
    }
}

// 渲染标签
function renderTags() {
    const container = document.getElementById('tags-container');
    container.innerHTML = '';
    
    currentTags.forEach((tag, index) => {
        const tagBadge = document.createElement('span');
        tagBadge.className = 'tag-badge';
        tagBadge.innerHTML = `
            ${tag}
            <span class="remove-tag" data-index="${index}">
                <i class="fas fa-times"></i>
            </span>
        `;
        container.appendChild(tagBadge);
    });
    
    // 更新隐藏的标签字段
    document.getElementById('website-tags').value = JSON.stringify(currentTags);
    
    // 添加删除标签事件
    document.querySelectorAll('.remove-tag').forEach(span => {
        span.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            currentTags.splice(index, 1);
            renderTags();
        });
    });
}

// 保存网站
async function saveWebsite() {
    // 获取表单数据
    const id = document.getElementById('website-id').value || generateId();
    const name = document.getElementById('website-name').value;
    const url = document.getElementById('website-url').value;
    const description = document.getElementById('website-description').value;
    const category = document.getElementById('website-category').value;
    const addedDate = document.getElementById('website-date').value || new Date().toISOString().split('T')[0];
    const featured = document.getElementById('website-featured').checked;
    
    // 验证
    if (!name || !url || !category) {
        showAlert('请填写必填字段（名称、URL、分类）', 'error');
        return;
    }
    
    // 创建网站对象
    const website = {
        id,
        name,
        url,
        description,
        category,
        tags: currentTags,
        addedDate,
        featured
    };
    
    // 更新数据
    if (currentEditId) {
        // 更新现有网站
        const index = adminData.websites.findIndex(w => w.id === currentEditId);
        if (index !== -1) {
            adminData.websites[index] = website;
        }
    } else {
        // 添加新网站
        adminData.websites.push(website);
    }
    
    // 更新分类计数
    updateCategoryCounts();
    
    // 保存到GitHub
    const success = await saveDataToGitHub();
    
    if (success) {
        // 重新渲染表格
        renderWebsitesTable();
        populateCategorySelect();
        
        // 隐藏表单
        hideWebsiteForm();
        
        // 显示成功消息
        showAlert(`网站"${name}"已成功${currentEditId ? '更新' : '添加'}`, 'success');
    }
}

// 编辑网站
function editWebsite(id) {
    const website = adminData.websites.find(w => w.id === id);
    if (website) {
        showWebsiteForm(website);
    }
}

// 删除网站
async function deleteWebsite(id) {
    const website = adminData.websites.find(w => w.id === id);
    if (!website) return;
    
    if (confirm(`确定要删除网站"${website.name}"吗？此操作无法撤销。`)) {
        // 从数据中删除
        adminData.websites = adminData.websites.filter(w => w.id !== id);
        
        // 更新分类计数
        updateCategoryCounts();
        
        // 保存到GitHub
        const success = await saveDataToGitHub();
        
        if (success) {
            // 重新渲染表格
            renderWebsitesTable();
            populateCategorySelect();
            
            // 显示成功消息
            showAlert(`网站"${website.name}"已删除`, 'success');
        }
    }
}

// 保存分类
async function saveCategory() {
    // 获取表单数据
    const id = document.getElementById('category-id').value || document.getElementById('category-id-input').value;
    const name = document.getElementById('category-name').value;
    const color = document.getElementById('category-color').value;
    const idInput = document.getElementById('category-id-input').value;
    
    // 验证
    if (!name || !idInput || !color) {
        showAlert('请填写所有必填字段', 'error');
        return;
    }
    
    // 检查ID是否已存在（编辑时除外）
    if (!currentEditId && adminData.categories.some(c => c.id === idInput)) {
        showAlert('分类ID已存在，请使用其他ID', 'error');
        return;
    }
    
    // 创建分类对象
    const category = {
        id: idInput,
        name,
        color,
        count: 0
    };
    
    // 更新数据
    if (currentEditId) {
        // 更新现有分类
        const index = adminData.categories.findIndex(c => c.id === currentEditId);
        if (index !== -1) {
            // 如果ID改变了，需要更新所有相关网站的category字段
            if (currentEditId !== idInput) {
                adminData.websites.forEach(website => {
                    if (website.category === currentEditId) {
                        website.category = idInput;
                    }
                });
            }
            adminData.categories[index] = category;
        }
    } else {
        // 添加新分类
        adminData.categories.push(category);
    }
    
    // 更新分类计数
    updateCategoryCounts();
    
    // 保存到GitHub
    const success = await saveDataToGitHub();
    
    if (success) {
        // 重新渲染表格
        renderCategoriesTable();
        renderWebsitesTable();
        populateCategorySelect();
        
        // 隐藏表单
        hideCategoryForm();
        
        // 显示成功消息
        showAlert(`分类"${name}"已成功${currentEditId ? '更新' : '添加'}`, 'success');
    }
}

// 编辑分类
function editCategory(id) {
    const category = adminData.categories.find(c => c.id === id);
    if (category) {
        showCategoryForm(category);
    }
}

// 删除分类
async function deleteCategory(id) {
    const category = adminData.categories.find(c => c.id === id);
    if (!category) return;
    
    // 检查是否有网站使用此分类
    const websitesInCategory = adminData.websites.filter(w => w.category === id);
    if (websitesInCategory.length > 0) {
        showAlert(`无法删除分类"${category.name}"，因为有${websitesInCategory.length}个网站使用此分类。请先修改这些网站的分类。`, 'error');
        return;
    }
    
    if (confirm(`确定要删除分类"${category.name}"吗？此操作无法撤销。`)) {
        // 从数据中删除
        adminData.categories = adminData.categories.filter(c => c.id !== id);
        
        // 保存到GitHub
        const success = await saveDataToGitHub();
        
        if (success) {
            // 重新渲染表格
            renderCategoriesTable();
            populateCategorySelect();
            
            // 显示成功消息
            showAlert(`分类"${category.name}"已删除`, 'success');
        }
    }
}

// 更新分类计数
function updateCategoryCounts() {
    adminData.categories.forEach(category => {
        category.count = adminData.websites.filter(w => w.category === category.id).length;
    });
}

// 加载设置
function loadSettings() {
    const settings = localStorage.getItem('navWebsiteSettings');
    if (settings) {
        adminData.settings = JSON.parse(settings);
        
        // 填充设置表单
        document.getElementById('github-repo').value = adminData.settings.githubRepo || '';
        document.getElementById('github-token').value = adminData.settings.githubToken || '';
        document.getElementById('data-file').value = adminData.settings.dataFile || 'data.json';
    }
}

// 保存设置
function saveSettings() {
    const settings = {
        githubRepo: document.getElementById('github-repo').value.trim(),
        githubToken: document.getElementById('github-token').value.trim(),
        dataFile: document.getElementById('data-file').value.trim() || 'data.json'
    };
    
    adminData.settings = settings;
    localStorage.setItem('navWebsiteSettings', JSON.stringify(settings));
    
    showAlert('设置已保存', 'success');
}

// 获取设置
function getSettings() {
    return adminData.settings || {};
}

// 测试GitHub连接
async function testGitHubConnection() {
    const settings = getSettings();
    
    if (!settings.githubRepo || !settings.githubToken) {
        showAlert('请先配置GitHub仓库和访问令牌', 'error');
        return;
    }
    
    showAlert('正在测试连接...', 'info');
    
    try {
        const url = `https://api.github.com/repos/${settings.githubRepo}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${settings.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            showAlert('GitHub连接测试成功！', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || '连接失败');
        }
    } catch (error) {
        showAlert(`GitHub连接测试失败: ${error.message}`, 'error');
    }
}

// 导出数据
function exportData() {
    const data = {
        categories: adminData.categories,
        websites: adminData.websites,
        exported: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nav-website-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('数据已导出', 'success');
}

// 保存到本地存储
function saveToLocalStorage() {
    const data = {
        categories: adminData.categories,
        websites: adminData.websites,
        savedLocally: new Date().toISOString()
    };
    
    localStorage.setItem('navWebsiteData', JSON.stringify(data));
}

// 加载示例数据
function loadSampleData() {
    const sampleData = getSampleData();
    adminData.categories = sampleData.categories;
    adminData.websites = sampleData.websites;
    
    updateCategoryCounts();
    renderWebsitesTable();
    renderCategoriesTable();
    populateCategorySelect();
    
    showAlert('已加载示例数据。请配置GitHub仓库以保存更改。', 'info');
}

// 获取示例数据（与主页面相同）
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

// 显示提示消息
function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <div>${message}</div>
    `;
    
    container.appendChild(alert);
    
    // 3秒后自动移除
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// 生成随机ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}