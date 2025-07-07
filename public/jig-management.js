// 全局变量
let currentPage = 1;
const pageSize = 10;
let totalFixtures = 0;
let fixtures = [];
let selectedFixtures = [];

// 生成治具编号
function generateFixtureId(type) {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const models = {
    "注塑模具": "ZS",
    "冲压模具": "CY",
    "压铸模具": "YZ",
    "锻造模具": "DJ",
    "挤出模具": "JC",
    "其他": "QT",
    "钓鱼治具": "DY"
  };
  const modelCode = models[type] || 'OTHER';

  // 获取当前最大流水号
  let maxSerialNumber = 0;
  fixtures.forEach(fixture => {
    const serialNumberStr = fixture.id.split(modelCode).pop();
    const serialNumber = parseInt(serialNumberStr, 10);
    if (!isNaN(serialNumber) && serialNumber > maxSerialNumber) {
      maxSerialNumber = serialNumber;
    }
  });
  const serialNumber = (maxSerialNumber + 1).toString().padStart(3, '0');

  return `${date}${modelCode}${serialNumber}`;
}

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
  document.getElementById('batchDeleteBtn').addEventListener('click', openBatchDeleteModal);
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

// 打开新增治具模态框
function openAddFixtureModal() {
  const modal = document.getElementById('fixtureModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('fixtureForm');
  const fixtureIdInput = document.getElementById('fixtureId');

  title.textContent = '新增治具';
  form.reset();

  // 获取治具类型
  const fixtureType = document.getElementById('fixtureType').value;
  if (fixtureType) {
    const newFixtureId = generateFixtureId(fixtureType);
    fixtureIdInput.value = newFixtureId;
  }

  // 监听治具类型变化，重新生成编号
  document.getElementById('fixtureType').addEventListener('change', () => {
    const newType = document.getElementById('fixtureType').value;
    if (newType) {
      const newFixtureId = generateFixtureId(newType);
      fixtureIdInput.value = newFixtureId;
    }
  });

  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.classList.add('opacity-100', 'pointer-events-auto');
}

// 关闭治具模态框
function closeFixtureModal() {
  const modal = document.getElementById('fixtureModal');
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.classList.remove('opacity-100', 'pointer-events-auto');
}

// 处理治具表单提交
async function handleFixtureFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('fixtureForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    let response;
    if (data.id) {
      // 更新治具
      response = await fetch(`/api/fixtures/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } else {
      // 创建新治具
      data.id = generateFixtureId(data.type);
      response = await fetch('/api/fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    }

    if (!response.ok) throw new Error('保存治具信息失败');

    closeFixtureModal();
    showToast('治具信息保存成功', 'success');
    await loadFixtures();
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
    const modal = document.getElementById('fixtureModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('fixtureForm');
    const fixtureIdInput = document.getElementById('fixtureId');

    title.textContent = '编辑治具';
    form.reset();

    fixtureIdInput.value = fixture.id;
    document.getElementById('fixtureType').value = fixture.type;
    document.getElementById('fixtureCapacity').value = fixture.capacity;
    document.getElementById('fixtureSchedule').value = fixture.schedule;
    document.getElementById('fixtureLocation').value = fixture.location;
    document.getElementById('fixtureDescription').value = fixture.description;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 搜索治具
function handleSearch() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filteredFixtures = fixtures.filter(fixture => {
    return fixture.id.toLowerCase().includes(searchTerm) || fixture.type.toLowerCase().includes(searchTerm);
  });
  renderFixtureTable(filteredFixtures);
}

// 筛选治具
function handleFilterChange() {
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const capacityFilter = document.getElementById('capacityFilter').value;

  let filteredFixtures = fixtures;

  if (typeFilter) {
    filteredFixtures = filteredFixtures.filter(fixture => fixture.type === typeFilter);
  }

  if (statusFilter) {
    const utilization = (fixture.schedule / fixture.capacity) * 100;
    let status;
    if (utilization > 100) {
      status = 'over';
    } else if (utilization > 80) {
      status = 'warning';
    } else {
      status = 'normal';
    }
    filteredFixtures = filteredFixtures.filter(fixture => {
      const utilization = (fixture.schedule / fixture.capacity) * 100;
      let status;
      if (utilization > 100) {
        status = 'over';
      } else if (utilization > 80) {
        status = 'warning';
      } else {
        status = 'normal';
      }
      return status === statusFilter;
    });
  }

  if (capacityFilter) {
    const [min, max] = capacityFilter.split('-');
    if (max) {
      filteredFixtures = filteredFixtures.filter(fixture => fixture.capacity >= parseInt(min) && fixture.capacity <= parseInt(max));
    } else {
      filteredFixtures = filteredFixtures.filter(fixture => fixture.capacity >= parseInt(min.replace('+', '')));
    }
  }

  renderFixtureTable(filteredFixtures);
}

// 重置筛选器
function resetFilters() {
  document.getElementById('typeFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('capacityFilter').value = '';
  renderFixtureTable(fixtures);
}

// 渲染治具表格
function renderFixtureTable(filteredFixtures = fixtures) {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFixtures = filteredFixtures.slice(startIndex, endIndex);

  const tableBody = document.getElementById('fixtureTableBody');
  tableBody.innerHTML = '';

  paginatedFixtures.forEach(fixture => {
    const row = document.createElement('tr');
    const utilization = (fixture.schedule / fixture.capacity) * 100;
    let statusClass = 'bg-success/10 text-success';
    let statusText = '正常';

    if (utilization > 100) {
      statusClass = 'bg-danger/10 text-danger';
      statusText = '超量';
    } else if (utilization > 80) {
      statusClass = 'bg-warning/10 text-warning';
      statusText = '接近超量';
    }

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" class="h-4 w-4 text-primary focus:ring-primary/30 border-gray-300 rounded" data-id="${fixture.id}">
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
      <td class="px-6 py-4 whitespace-nowrap">${new Date(fixture.updated_at).toLocaleString()}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a href="jig-management.html?edit=${fixture.id}" class="text-primary hover:text-primary/80">
          编辑
        </a>
      </td>
    `;
    tableBody.appendChild(row);

    // 监听复选框变化
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedFixtures.push(fixture.id);
      } else {
        selectedFixtures = selectedFixtures.filter(id => id !== fixture.id);
      }
    });
  });

  const showingRange = document.getElementById('showingRange');
  const totalCount = document.getElementById('totalCount');
  showingRange.textContent = `${startIndex + 1}-${Math.min(endIndex, filteredFixtures.length)}`;
  totalCount.textContent = filteredFixtures.length;

  updatePagination(filteredFixtures.length);
}

// 更新分页按钮状态
function updatePagination(total = totalFixtures) {
  const prevPageButton = document.getElementById('prevPage');
  const nextPageButton = document.getElementById('nextPage');

  prevPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage * pageSize >= total;
}

// 上一页
function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderFixtureTable();
  }
}

// 下一页
function goToNextPage() {
  const total = fixtures.length;
  if (currentPage * pageSize < total) {
    currentPage++;
    renderFixtureTable();
  }
}

// 全选/反选
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('#fixtureTableBody input[type="checkbox"]');
  const selectAllCheckbox = document.getElementById('selectAll');

  selectedFixtures = [];
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
    if (checkbox.checked) {
      selectedFixtures.push(checkbox.dataset.id);
    }
  });
}

// 批量导出治具
async function exportSelectedFixtures() {
  if (selectedFixtures.length === 0) {
    showToast('请选择要导出的治具', 'error');
    return;
  }

  try {
    const response = await fetch('/api/fixtures/batch-export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: selectedFixtures })
    });

    if (!response.ok) throw new Error('批量导出治具失败');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixtures.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('批量导出治具成功', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 批量导入治具
async function handleBatchImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const fixturesData = JSON.parse(event.target.result);
          const response = await fetch('/api/fixtures/batch-import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(fixturesData)
          });

          if (!response.ok) throw new Error('批量导入治具失败');

          showToast('批量导入治具成功', 'success');
          await loadFixtures();
        };
        reader.readAsText(file);
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  });
  input.click();
}

// 打开批量删除模态框
function openBatchDeleteModal() {
  if (selectedFixtures.length === 0) {
    showToast('请选择要删除的治具', 'error');
    return;
  }

  const modal = document.getElementById('batchActionModal');
  const title = document.getElementById('batchActionTitle');
  const message = document.getElementById('batchActionMessage');

  title.textContent = '批量删除治具';
  message.textContent = '确认删除选中的治具？';

  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.classList.add('opacity-100', 'pointer-events-auto');
}

// 关闭批量操作模态框
function closeBatchActionModal() {
  const modal = document.getElementById('batchActionModal');
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.classList.remove('opacity-100', 'pointer-events-auto');
}

// 确认批量操作
async function confirmBatchAction() {
  try {
    const response = await fetch('/api/fixtures/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: selectedFixtures })
    });

    if (!response.ok) throw new Error('批量删除治具失败');

    closeBatchActionModal();
    showToast('批量删除治具成功', 'success');
    selectedFixtures = [];
    await loadFixtures();
  } catch (error) {
    showToast(error.message, 'error');
  }
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