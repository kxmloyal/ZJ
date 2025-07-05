// 全局变量
let currentPage = 1;
const pageSize = 10;
let totalFixtures = 0;
let fixtures = [];
let selectedFixtures = [];
let isEditing = false;
let currentFixtureId = null;

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  loadFixtures();
  initEventListeners();
});

// 初始化事件监听
function initEventListeners() {
  // 侧边栏控制
  document.getElementById('openSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
  });

  document.getElementById('closeSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('-translate-x-full');
  });

  // 用户菜单控制
  document.getElementById('userMenuButton').addEventListener('click', () => {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', (event) => {
    const menuButton = document.getElementById('userMenuButton');
    const menu = document.getElementById('userMenu');
    
    if (!menuButton.contains(event.target) && !menu.contains(event.target)) {
      menu.classList.add('hidden');
    }
  });

  // 搜索框事件
  document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));

  // 筛选器事件
  document.getElementById('typeFilter').addEventListener('change', handleFilterChange);
  document.getElementById('statusFilter').addEventListener('change', handleFilterChange);
  document.getElementById('capacityFilter').addEventListener('change', handleFilterChange);
  document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);

  // 分页事件
  document.getElementById('prevPage').addEventListener('click', goToPrevPage);
  document.getElementById('nextPage').addEventListener('click', goToNextPage);

  // 治具操作事件
  document.getElementById('addFixtureBtn').addEventListener('click', openAddFixtureModal);
  document.getElementById('closeModal').addEventListener('click', closeFixtureModal);
  document.getElementById('cancelModal').addEventListener('click', closeFixtureModal);
  document.getElementById('fixtureForm').addEventListener('submit', handleFixtureFormSubmit);

  // 批量操作事件
  document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
  document.getElementById('batchExportBtn').addEventListener('click', exportSelectedFixtures);
  document.getElementById('batchImportBtn').addEventListener('click', openBatchImportModal);
  document.getElementById('cancelBatchAction').addEventListener('click', closeBatchActionModal);
  document.getElementById('confirmBatchAction').addEventListener('click', confirmBatchImport);
  document.getElementById('importFile').addEventListener('change', handleFileSelect);
}

// 防抖函数
function debounce(func, delay) {
  let timer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

// API请求封装
const apiRequest = async (url, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // 处理HTTP错误
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP错误 ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // 统一处理错误
    console.error('API请求错误:', error);
    showToast(error.message, 'error');
    throw error;
  }
};

// 加载治具列表
async function loadFixtures() {
  try {
    // 显示加载状态
    document.getElementById('fixtureTableBody').innerHTML = `
      <tr class="text-center">
        <td colspan="9" class="px-6 py-10 text-gray-500">
          <i class="fa fa-spinner fa-spin text-xl mb-2"></i>
          <p>正在加载数据...</p>
        </td>
      </tr>
    `;
    
    // 调用API获取数据
    const data = await apiRequest('/api/fixtures');
    
    fixtures = data.fixtures;
    totalFixtures = data.total;
    
    renderFixtureTable();
    updatePagination();
  } catch (error) {
    // 显示错误信息
    document.getElementById('fixtureTableBody').innerHTML = `
      <tr class="text-center">
        <td colspan="9" class="px-6 py-10 text-danger">
          <i class="fa fa-exclamation-triangle text-xl mb-2"></i>
          <p>${error.message}</p>
          <button onclick="loadFixtures()" class="mt-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary/90">
            重试
          </button>
        </td>
      </tr>
    `;
  }
}

// 渲染治具表格
function renderFixtureTable() {
  const tableBody = document.getElementById('fixtureTableBody');
  const filteredFixtures = applyFilters(fixtures);
  const paginatedFixtures = getPaginatedData(filteredFixtures);

  if (paginatedFixtures.length === 0) {
    tableBody.innerHTML = `
      <tr class="text-center">
        <td colspan="9" class="px-6 py-10 text-gray-500">
          <i class="fa fa-search text-xl mb-2"></i>
          <p>没有找到匹配的治具</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = paginatedFixtures.map(fixture => {
    const utilization = (fixture.scheduled / fixture.capacity) * 100;
    let statusClass = 'bg-success/10 text-success';
    let statusText = '正常';
    let statusFilter = 'normal';

    if (utilization > 100) {
      statusClass = 'bg-danger/10 text-danger';
      statusText = '超量';
      statusFilter = 'over';
    } else if (utilization > 80) {
      statusClass = 'bg-warning/10 text-warning';
      statusText = '接近超量';
      statusFilter = 'warning';
    }

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap">
          <input type="checkbox" class="fixture-checkbox h-4 w-4 text-primary focus:ring-primary/30 border-gray-300 rounded" 
            data-id="${fixture.id}" ${selectedFixtures.includes(fixture.id) ? 'checked' : ''}>
        </td>
        <td class="px-6 py-4 whitespace-nowrap font-medium">${fixture.code}</td>
        <td class="px-6 py-4 whitespace-nowrap">${fixture.type}</td>
        <td class="px-6 py-4 whitespace-nowrap">${fixture.capacity.toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap">${fixture.scheduled.toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
              <div class="h-2.5 rounded-full ${getUtilizationBarColor(utilization)}" style="width: ${Math.min(utilization, 150)}%"></div>
            </div>
            <span>${utilization.toFixed(1)}%</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
            ${statusText}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${formatDate(fixture.updatedAt || fixture.createdAt)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end space-x-2">
            <button class="text-primary hover:text-primary/80 transition-colors" onclick="viewFixtureDetail('${fixture.id}')">
              <i class="fa fa-eye"></i>
            </button>
            <button class="text-gray-600 hover:text-gray-900 transition-colors" onclick="editFixture('${fixture.id}')">
              <i class="fa fa-pencil"></i>
            </button>
            <button class="text-danger hover:text-danger/80 transition-colors" onclick="confirmDeleteFixture('${fixture.id}')">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // 为每个复选框添加事件监听
  document.querySelectorAll('.fixture-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const fixtureId = checkbox.getAttribute('data-id');
      if (checkbox.checked) {
        selectedFixtures.push(fixtureId);
      } else {
        selectedFixtures = selectedFixtures.filter(id => id !== fixtureId);
      }
      updateSelectAllCheckbox();
    });
  });
}

// 应用筛选条件
function applyFilters(data) {
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const capacityFilter = document.getElementById('capacityFilter').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  return data.filter(fixture => {
    // 类型筛选
    if (typeFilter && fixture.type !== typeFilter) return false;

    // 状态筛选
    if (statusFilter) {
      const utilization = (fixture.scheduled / fixture.capacity) * 100;
      if (statusFilter === 'normal' && (utilization > 100 || utilization > 80)) return false;
      if (statusFilter === 'warning' && !(utilization > 80 && utilization <= 100)) return false;
      if (statusFilter === 'over' && utilization <= 100) return false;
    }

    // 产能范围筛选
    if (capacityFilter) {
      const [min, max] = capacityFilter.split('-').map(Number);
      if (capacityFilter === '30000+' && fixture.capacity <= 30000) return false;
      if (max && (fixture.capacity < min || fixture.capacity > max)) return false;
    }

    // 搜索筛选
    if (searchTerm && !(
      fixture.code.toLowerCase().includes(searchTerm) || 
      fixture.type.toLowerCase().includes(searchTerm)
    )) return false;

    return true;
  });
}

// 获取分页数据
function getPaginatedData(data) {
  const startIndex = (currentPage - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

// 更新分页控件
function updatePagination() {
  const filteredFixtures = applyFilters(fixtures);
  const totalPages = Math.ceil(filteredFixtures.length / pageSize);

  document.getElementById('totalCount').textContent = filteredFixtures.length;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredFixtures.length);
  document.getElementById('showingRange').textContent = `${start}-${end}`;

  // 更新分页按钮状态
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
}

// 上一页
function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderFixtureTable();
    updatePagination();
  }
}

// 下一页
function goToNextPage() {
  const filteredFixtures = applyFilters(fixtures);
  const totalPages = Math.ceil(filteredFixtures.length / pageSize);

  if (currentPage < totalPages) {
    currentPage++;
    renderFixtureTable();
    updatePagination();
  }
}

// 表单验证函数
const validateFixtureForm = (formData) => {
  const errors = {};
  
  // 验证治具编号（必填，且长度不超过20）
  if (!formData.code || formData.code.trim() === '') {
    errors.code = '治具编号不能为空';
  } else if (formData.code.length > 20) {
    errors.code = '治具编号长度不能超过20个字符';
  }
  
  // 验证治具类型（必填）
  if (!formData.type || formData.type === '') {
    errors.type = '请选择治具类型';
  }
  
  // 验证固定产能（必填，必须是数字，且大于0）
  if (!formData.capacity) {
    errors.capacity = '固定产能不能为空';
  } else if (isNaN(Number(formData.capacity))) {
    errors.capacity = '固定产能必须是数字';
  } else if (Number(formData.capacity) <= 0) {
    errors.capacity = '固定产能必须大于0';
  }
  
  // 验证当前排程（可选，必须是数字，且大于等于0）
  if (formData.scheduled && isNaN(Number(formData.scheduled))) {
    errors.scheduled = '当前排程必须是数字';
  } else if (formData.scheduled && Number(formData.scheduled) < 0) {
    errors.scheduled = '当前排程不能为负数';
  }
  
  return errors;
};

// 显示表单错误信息
const showFormErrors = (errors) => {
  Object.keys(errors).forEach((field) => {
    const errorElement = document.getElementById(`${field}Error`);
    if (errorElement) {
      errorElement.textContent = errors[field];
      errorElement.classList.remove('hidden');
    }
  });
};

// 清除表单错误信息
const clearFormErrors = () => {
  document.querySelectorAll('.error-message').forEach((element) => {
    element.textContent = '';
    element.classList.add('hidden');
  });
};

// 打开新增治具模态框
function openAddFixtureModal() {
  isEditing = false;
  currentFixtureId = null;
  document.getElementById('fixtureModal').classList.remove('hidden');
  document.getElementById('fixtureForm').reset();
  document.getElementById('fixtureFormTitle').textContent = '新增治具';
  clearFormErrors();
}

// 关闭治具模态框
function closeFixtureModal() {
  document.getElementById('fixtureModal').classList.add('hidden');
}

// 处理治具表单提交
async function handleFixtureFormSubmit(event) {
  event.preventDefault();
  
  // 清除之前的错误信息
  clearFormErrors();
  
  // 获取表单数据
  const formData = {
    code: document.getElementById('fixtureCode').value.trim(),
    type: document.getElementById('fixtureType').value,
    capacity: document.getElementById('fixtureCapacity').value,
    scheduled: document.getElementById('fixtureScheduled').value,
    description: document.getElementById('fixtureDescription').value,
  };
  
  // 验证表单
  const errors = validateFixtureForm(formData);
  
  if (Object.keys(errors).length > 0) {
    showFormErrors(errors);
    return;
  }
  
  try {
    // 显示加载状态
    const submitButton = document.getElementById('submitFixtureBtn');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 提交中...';
    
    // 根据是新增还是编辑调用不同的API
    let response;
    if (isEditing) {
      response = await apiRequest(`/api/fixtures/${currentFixtureId}`, 'PUT', formData);
    } else {
      response = await apiRequest('/api/fixtures', 'POST', formData);
    }
    
    // 显示成功消息
    showToast(isEditing ? '治具更新成功' : '治具添加成功');
    
    // 关闭模态框并刷新列表
    document.getElementById('fixtureModal').classList.add('hidden');
    loadFixtures();
    
  } catch (error) {
    // 错误已在apiRequest中处理
  } finally {
    // 恢复按钮状态
    const submitButton = document.getElementById('submitFixtureBtn');
    submitButton.disabled = false;
    submitButton.innerHTML = isEditing ? '更新治具' : '添加治具';
  }
}

// 编辑治具
async function editFixture(id) {
  try {
    const fixture = await apiRequest(`/api/fixtures/${id}`);
    
    if (fixture) {
      isEditing = true;
      currentFixtureId = id;
      
      document.getElementById('fixtureModal').classList.remove('hidden');
      document.getElementById('fixtureFormTitle').textContent = '编辑治具';
      document.getElementById('fixtureCode').value = fixture.code;
      document.getElementById('fixtureType').value = fixture.type;
      document.getElementById('fixtureCapacity').value = fixture.capacity;
      document.getElementById('fixtureScheduled').value = fixture.scheduled;
      document.getElementById('fixtureDescription').value = fixture.description || '';
      
      clearFormErrors();
    }
  } catch (error) {
    // 错误已在apiRequest中处理
  }
}

// 删除治具确认
function confirmDeleteFixture(id) {
  if (confirm('确定要删除该治具吗？此操作不可撤销。')) {
    deleteFixture(id);
  }
}

// 删除治具
async function deleteFixture(id) {
  try {
    await apiRequest(`/api/fixtures/${id}`, 'DELETE');
    showToast('治具删除成功', 'success');
    loadFixtures();
  } catch (error) {
    // 错误已在apiRequest中处理
  }
}

// 全选/反选
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('.fixture-checkbox');
  const selectAllCheckbox = document.getElementById('selectAll');

  selectedFixtures = [];
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
    if (selectAllCheckbox.checked) {
      selectedFixtures.push(checkbox.getAttribute('data-id'));
    }
  });
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll('.fixture-checkbox');
  const selectAllCheckbox = document.getElementById('selectAll');
  const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
  selectAllCheckbox.checked = allChecked;
}

// 批量导出治具
async function exportSelectedFixtures() {
  if (selectedFixtures.length === 0) {
    showToast('请选择要导出的治具', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/fixtures/export?ids=${selectedFixtures.join(',')}`);
    if (!response.ok) throw new Error('导出治具失败');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `治具数据_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 打开批量导入模态框
function openBatchImportModal() {
  document.getElementById('batchImportModal').classList.remove('hidden');
  document.getElementById('importFile').value = '';
}

// 关闭批量导入模态框
function closeBatchImportModal() {
  document.getElementById('batchImportModal').classList.add('hidden');
}

// 处理文件选择
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('导入的数据格式不正确，应为JSON数组');
        }
        
        // 验证导入的数据
        const invalidItems = data.filter(item => 
          !item.code || !item.type || isNaN(item.capacity) || item.capacity <= 0
        );
        
        if (invalidItems.length > 0) {
          throw new Error(`导入的数据中有 ${invalidItems.length} 条记录格式不正确`);
        }
        
        // 显示确认对话框
        document.getElementById('batchImportConfirm').classList.remove('hidden');
        document.getElementById('batchImportSummary').textContent = 
          `即将导入 ${data.length} 条治具数据，是否继续？`;
        
        // 存储导入数据
        window.batchImportData = data;
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    showToast('文件读取失败', 'error');
  }
}

// 确认批量导入
async function confirmBatchImport() {
  const data = window.batchImportData;
  if (!data) {
    showToast('没有可导入的数据', 'error');
    return;
  }
  
  try {
    // 显示加载状态
    document.getElementById('batchImportConfirm').classList.add('hidden');
    document.getElementById('batchImportLoading').classList.remove('hidden');
    
    const response = await apiRequest('/api/fixtures/batch', 'POST', data);
    
    // 显示结果
    document.getElementById('batchImportLoading').classList.add('hidden');
    document.getElementById('batchImportResult').classList.remove('hidden');
    document.getElementById('batchImportSuccessCount').textContent = response.success || 0;
    document.getElementById('batchImportFailedCount').textContent = response.failed || 0;
    
    // 刷新数据
    loadFixtures();
  } catch (error) {
    // 显示错误
    document.getElementById('batchImportLoading').classList.add('hidden');
    document.getElementById('batchImportError').classList.remove('hidden');
    document.getElementById('batchImportErrorMessage').textContent = error.message;
  }
}

// 搜索处理
function handleSearch() {
  currentPage = 1;
  renderFixtureTable();
  updatePagination();
}

// 筛选条件变化处理
function handleFilterChange() {
  currentPage = 1;
  renderFixtureTable();
  updatePagination();
}

// 重置筛选条件
function resetFilters() {
  document.getElementById('typeFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('capacityFilter').value = '';
  document.getElementById('searchInput').value = '';
  currentPage = 1;
  renderFixtureTable();
  updatePagination();
}

// 工具函数 - 获取利用率进度条颜色
function getUtilizationBarColor(utilization) {
  if (utilization > 100) return 'bg-danger';
  if (utilization > 80) return 'bg-warning';
  return 'bg-success';
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 显示提示消息
const showToast = (message, type = 'success') => {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  // 设置提示类型和消息
  toastMessage.textContent = message;
  
  // 设置图标和背景色
  if (type === 'success') {
    toast.classList.remove('bg-danger');
    toast.classList.add('bg-dark');
    toastIcon.className = 'fa fa-check-circle mr-2';
  } else {
    toast.classList.remove('bg-dark');
    toast.classList.add('bg-danger');
    toastIcon.className = 'fa fa-exclamation-circle mr-2';
  }
  
  // 显示提示
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  
  // 3秒后隐藏提示
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
};