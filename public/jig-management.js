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

// 搜索处理
function handleSearch() {
  currentPage = 1; // 重置到第一页
  renderFixtureTable();
  updatePagination();
}

// 筛选条件变化
function handleFilterChange() {
  currentPage = 1; // 重置到第一页
  renderFixtureTable();
  updatePagination();
}

// 重置筛选条件
function resetFilters() {
  document.getElementById('typeFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('capacityFilter').value = '';
  document.getElementById('searchInput').value = '';
  
  currentPage = 1; // 重置到第一页
  renderFixtureTable();
  updatePagination();
}

// 打开新增治具模态框
function openAddFixtureModal() {
  document.getElementById('modalTitle').textContent = '新增治具';
  document.getElementById('fixtureForm').reset();
  document.getElementById('fixtureId').value = '';
  
  const fixtureModal = document.getElementById('fixtureModal');
  fixtureModal.classList.remove('hidden');
  setTimeout(() => {
    fixtureModal.style.opacity = '1';
    fixtureModal.querySelector('#modalContent').style.transform = 'scale(1)';
  }, 10);
}

// 打开编辑治具模态框
function editFixture(id) {
  const fixture = fixtures.find(f => f.id === id);
  if (!fixture) return;
  
  document.getElementById('modalTitle').textContent = '编辑治具';
  document.getElementById('fixtureId').value = fixture.id;
  document.getElementById('fixtureType').value = fixture.type;
  document.getElementById('fixtureCapacity').value = fixture.capacity;
  document.getElementById('fixtureSchedule').value = fixture.schedule;
  document.getElementById('fixtureLocation').value = fixture.location || '';
  document.getElementById('fixtureDescription').value = fixture.description || '';
  
  const fixtureModal = document.getElementById('fixtureModal');
  fixtureModal.classList.remove('hidden');
  setTimeout(() => {
    fixtureModal.style.opacity = '1';
    fixtureModal.querySelector('#modalContent').style.transform = 'scale(1)';
  }, 10);
}

// 关闭治具模态框
function closeFixtureModal() {
  const fixtureModal = document.getElementById('fixtureModal');
  fixtureModal.style.opacity = '0';
  fixtureModal.querySelector('#modalContent').style.transform = 'scale(0.95)';
  setTimeout(() => {
    fixtureModal.classList.add('hidden');
  }, 300);
}

// 处理表单提交
async function handleFixtureFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('fixtureId').value;
  const type = document.getElementById('fixtureType').value;
  const capacity = parseInt(document.getElementById('fixtureCapacity').value);
  const schedule = parseInt(document.getElementById('fixtureSchedule').value);
  const location = document.getElementById('fixtureLocation').value;
  const description = document.getElementById('fixtureDescription').value;
  
  if (!type || !capacity || !schedule) {
    showToast('请填写所有必填字段', 'error');
    return;
  }
  
  try {
    const fixtureData = {
      type,
      capacity,
      schedule,
      location,
      description,
      updatedAt: new Date().toISOString()
    };
    
    let response;
    if (id) {
      // 更新治具
      response = await fetch(`/api/fixtures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixtureData)
      });
    } else {
      // 创建新治具
      response = await fetch('/api/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixtureData)
      });
    }
    
    if (!response.ok) throw new Error(id ? '更新治具失败' : '创建治具失败');
    
    closeFixtureModal();
    loadFixtures();
    showToast(id ? '治具更新成功' : '治具创建成功');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 查看治具详情
function viewFixtureDetail(id) {
  // 在实际应用中，可跳转到详情页或弹出详情模态框
  showToast(`查看治具 ${id} 的详情`, 'info');
}

// 确认删除治具
function confirmDeleteFixture(id) {
  document.getElementById('batchActionTitle').textContent = '删除治具确认';
  document.getElementById('batchActionMessage').innerHTML = 
    `确定要删除治具 <span class="font-medium">${id}</span> 吗？此操作不可撤销。`;
  document.getElementById('confirmBatchAction').setAttribute('data-action', 'delete');
  document.getElementById('confirmBatchAction').setAttribute('data-id', id);
  
  openBatchActionModal();
}

// 打开批量操作模态框
function openBatchActionModal() {
  const modal = document.getElementById('batchActionModal');
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'scale(1)';
  }, 10);
}

// 关闭批量操作模态框
function closeBatchActionModal() {
  const modal = document.getElementById('batchActionModal');
  modal.style.opacity = '0';
  modal.querySelector('div').style.transform = 'scale(0.95)';
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

// 确认批量操作
async function confirmBatchAction() {
  const action = document.getElementById('confirmBatchAction').getAttribute('data-action');
  const singleId = document.getElementById('confirmBatchAction').getAttribute('data-id');
  
  try {
    if (action === 'delete') {
      // 删除单个或多个治具
      const ids = singleId ? [singleId] : selectedFixtures;
      
      for (const id of ids) {
        const response = await fetch(`/api/fixtures/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('删除治具失败');
      }
      
      closeBatchActionModal();
      selectedFixtures = [];
      document.getElementById('selectAll').checked = false;
      loadFixtures();
      showToast(`成功删除 ${ids.length} 个治具`);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 全选/取消全选
function toggleSelectAll() {
  const isChecked = document.getElementById('selectAll').checked;
  const filteredFi