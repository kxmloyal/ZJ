// 全局变量
let currentPage = 1;
const pageSize = 10;
let totalFixtures = 0;
let fixtures = [];
let selectedFixtures = [];

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  loadFixtures();
  initEventListeners();
  
  // 检查URL参数，是否需要编辑特定治具
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId) {
    // 等待数据加载完成后打开编辑模态框
    const checkDataLoaded = setInterval(() => {
      if (fixtures.length > 0) {
        clearInterval(checkDataLoaded);
        editFixture(editId);
      }
    }, 100);
  }
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
  document.getElementById('batchImportBtn').addEventListener('click', handleBatchImport);
  document.getElementById('batchDeleteBtn').addEventListener('click', batchDeleteFixtures);
  document.getElementById('cancelBatchAction').addEventListener('click', closeBatchActionModal);
  document.getElementById('confirmBatchAction').addEventListener('click', confirmBatchAction);
}

// 加载治具列表
async function loadFixtures() {
  try {
    const response = await fetch('/api/fixtures');
    if (!response.ok) throw new Error('获取治具数据失败');
    
    fixtures = await response.json();
    totalFixtures = fixtures.length;
    
    renderFixtureTable();
    updatePagination();
  } catch (error) {
    document.getElementById('fixtureTableBody').innerHTML = `
      <tr class="text-center">
        <td colspan="9" class="px-6 py-10 text-danger">
          <i class="fa fa-exclamation-circle text-xl mb-2"></i>
          <p>${error.message}</p>
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
    const utilization = (fixture.schedule / fixture.capacity) * 100;
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
        <td class="px-6 py-4 whitespace-nowrap font-medium">${fixture.id}</td>
        <td class="px-6 py-4 whitespace-nowrap">${fixture.type}</td>
        <td class="px-6 py-4 whitespace-nowrap">${fixture.capacity.toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap">${fixture.schedule.toLocaleString()}</td>
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
      const utilization = (fixture.schedule / fixture.capacity) * 100;
      if (statusFilter === 'normal' && (utilization > 100 || utilization > 80)) return false;
      if (statusFilter === 'warning' && !(utilization > 80 && utilization <= 100)) return false;
      if (statusFilter === 'over' && utilization <= 100) return false;
    }
    
    // 产能范围筛选
    if (capacityFilter) {
      const [min, max] = capacityFilter.split('-').map(Number);
      if (capacityFilter === '30000+') {
        if (fixture.capacity <= 30000) return false;
      } else if (fixture.capacity < min || (max && fixture.capacity > max)) {
        return false;
      }
    }
    
    // 搜索筛选
    if (searchTerm && !(
      fixture.id.toLowerCase().includes(searchTerm) || 
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

// 打开新增治具模态框
function openAddFixtureModal() {
  document.getElementById('modalTitle').textContent = '新增治具';
  document.getElementById('fixtureId').value = '';
  document.getElementById('fixtureType').value = '';
  document.getElementById('fixtureCapacity').value = '';
  document.getElementById('fixtureSchedule').value = '';
  document.getElementById('fixtureLocation').value = '';
  document.getElementById('fixtureDescription').value = '';
  document.getElementById('fixtureModal').classList.remove('opacity-0', 'pointer-events-none');
  document.getElementById('modalContent').classList.remove('scale-95');
}

// 关闭治具模态框
function closeFixtureModal() {
  document.getElementById('fixtureModal').classList.add('opacity-0', 'pointer-events-none');
  document.getElementById('modalContent').classList.add('scale-95');
}

// 处理治具表单提交
async function handleFixtureFormSubmit(event) {
  event.preventDefault();

  const fixtureType = document.getElementById('fixtureType').value;
  const fixtureCapacity = parseInt(document.getElementById('fixtureCapacity').value);
  const fixtureSchedule = parseInt(document.getElementById('fixtureSchedule').value);

  if (!fixtureType) {
    showToast('请选择治具类型', 'error');
    return;
  }

  if (isNaN(fixtureCapacity) || fixtureCapacity <= 0) {
    showToast('固定产能必须为正整数', 'error');
    return;
  }

  if (isNaN(fixtureSchedule) || fixtureSchedule < 0) {
    showToast('当前排程量必须为非负整数', 'error');
    return;
  }

  const fixtureId = document.getElementById('fixtureId').value;
  const fixtureLocation = document.getElementById('fixtureLocation').value;
  const fixtureDescription = document.getElementById('fixtureDescription').value;

  const formData = {
    type: fixtureType,
    capacity: fixtureCapacity,
    schedule: fixtureSchedule,
    location: fixtureLocation,
    description: fixtureDescription
  };

  try {
    let response;
    if (fixtureId) {
      // 更新治具
      response = await fetch(`/api/fixtures/${fixtureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
    } else {
      // 创建新治具
      response = await fetch('/api/fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
    }

    if (!response.ok) throw new Error('保存治具信息失败');

    showToast('治具信息保存成功', 'success');
    closeFixtureModal();
    loadFixtures();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 编辑治具
async function editFixture(id) {
  try {
    const response = await fetch(`/api/fixtures/${id}`);
    if (!response.ok) throw new Error('获取治具信息失败');

    const fixture = await response.json();

    document.getElementById('modalTitle').textContent = '编辑治具';
    document.getElementById('fixtureId').value = fixture.id;
    document.getElementById('fixtureType').value = fixture.type;
    document.getElementById('fixtureCapacity').value = fixture.capacity;
    document.getElementById('fixtureSchedule').value = fixture.schedule;
    document.getElementById('fixtureLocation').value = fixture.location;
    document.getElementById('fixtureDescription').value = fixture.description;

    document.getElementById('fixtureModal').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('modalContent').classList.remove('scale-95');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 确认删除治具
function confirmDeleteFixture(id) {
  if (confirm('确定要删除该治具吗？')) {
    deleteFixture(id);
  }
}

// 删除治具
async function deleteFixture(id) {
  try {
    const response = await fetch(`/api/fixtures/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('删除治具失败');

    showToast('治具删除成功', 'success');
    loadFixtures();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 批量删除治具
async function batchDeleteFixtures() {
  if (selectedFixtures.length === 0) {
    showToast('请选择要删除的治具', 'error');
    return;
  }

  if (confirm('确定要删除选中的治具吗？')) {
    try {
      const response = await fetch('/api/management/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedFixtures })
      });

      if (!response.ok) throw new Error('批量删除治具失败');

      showToast('批量删除治具成功', 'success');
      selectedFixtures = [];
      loadFixtures();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
}

// 批量导出治具
async function exportSelectedFixtures() {
  if (selectedFixtures.length === 0) {
    showToast('请选择要导出的治具', 'error');
    return;
  }

  try {
    const response = await fetch('/api/management/batch-export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: selectedFixtures })
    });

    if (!response.ok) throw new Error('批量导出治具失败');

    const data = await response.text();
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixtures.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 批量导入治具
async function handleBatchImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target.result;
        const fixturesData = parseCSV(csvData);

        try {
          const response = await fetch('/api/management/batch-import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(fixturesData)
          });

          if (!response.ok) throw new Error('批量导入治具失败');

          const results = await response.json();
          showToast(`批量导入完成，创建: ${results.filter(r => r.status === 'created').length} 条，更新: ${results.filter(r => r.status === 'updated').length} 条`, 'success');
          loadFixtures();
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      reader.readAsText(file);
    }
  });

  input.click();
}

// 解析 CSV 文件
function parseCSV(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  const fixtures = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const fixture = {};
      for (let j = 0; j < headers.length; j++) {
        fixture[headers[j].trim()] = values[j].trim();
      }
      fixtures.push(fixture);
    }
  }

  return fixtures;
}

// 工具函数 - 获取利用率进度条颜色
function getUtilizationBarColor(utilization) {
  if (utilization > 100) return 'bg-danger';
  if (utilization > 80) return 'bg-warning';
  return 'bg-success';
}

// 显示提示消息
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  // 设置消息内容和图标
  toastMessage.textContent = message;
  
  // 设置图标
  if (type === 'success') {
    toastIcon.className = 'fa fa-check-circle mr-2';
    toast.classList.remove('bg-danger');
    toast.classList.add('bg-dark');
  } else {
    toastIcon.className = 'fa fa-exclamation-circle mr-2';
    toast.classList.remove('bg-dark');
    toast.classList.add('bg-danger');
  }
  
  // 显示提示
  toast.classList.remove('translate-y-20', 'opacity-0');
  
  // 3秒后隐藏
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
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

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 切换全选状态
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('.fixture-checkbox');
  const isChecked = document.getElementById('selectAll').checked;

  selectedFixtures = [];
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
    if (isChecked) {
      selectedFixtures.push(checkbox.getAttribute('data-id'));
    }
  });
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll('.fixture-checkbox');
  const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
  document.getElementById('selectAll').checked = allChecked;
}

// 处理搜索事件
function handleSearch() {
  currentPage = 1;
  renderFixtureTable();
  updatePagination();
}

// 处理筛选器变化事件
function handleFilterChange() {
  currentPage = 1;
  renderFixtureTable();
  updatePagination();
}

// 重置筛选器
function resetFilters() {
  document.getElementById('typeFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('capacityFilter').value = '';
  document.getElementById('searchInput').value = '';
  currentPage = 1;
  renderFixtureTable();
  updatePagination();
}

// 关闭批量操作模态框
function closeBatchActionModal() {
  // 实现关闭模态框逻辑
}

// 确认批量操作
function confirmBatchAction() {
  // 实现确认批量操作逻辑
}

// 查看治具详情
function viewFixtureDetail(id) {
  // 实现查看详情逻辑
}