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

// 其他已有函数保持不变...