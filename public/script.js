// 全局变量
let fixtures = [];

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
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
  
  // 点击其他区域关闭用户菜单
  document.addEventListener('click', (event) => {
    const menuButton = document.getElementById('userMenuButton');
    const menu = document.getElementById('userMenu');
    
    if (!menuButton.contains(event.target) && !menu.contains(event.target)) {
      menu.classList.add('hidden');
    }
  });
}

// 加载仪表盘数据
async function loadDashboardData() {
  try {
    // 加载治具数据
    const response = await fetch('/api/fixtures');
    if (!response.ok) throw new Error('获取治具数据失败');
    
    fixtures = await response.json();
    
    // 更新统计卡片
    updateStatsCards();
    
    // 更新治具状态表格
    updateFixtureStatusTable();
    
    // 渲染图表
    renderCharts();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 更新统计卡片
function updateStatsCards() {
  // 总治具数量
  document.getElementById('totalFixtures').textContent = fixtures.length;
  
  // 产能利用率
  const totalCapacity = fixtures.reduce((sum, fixture) => sum + fixture.capacity, 0);
  const totalSchedule = fixtures.reduce((sum, fixture) => sum + fixture.schedule, 0);
  const utilizationRate = ((totalSchedule / totalCapacity) * 100).toFixed(1);
  document.getElementById('utilizationRate').textContent = `${utilizationRate}%`;
  
  // 超量治具
  const overloadedFixtures = fixtures.filter(fixture => fixture.schedule > fixture.capacity).length;
  document.getElementById('overloadedFixtures').textContent = overloadedFixtures;
  
  // 本月总产量（假设为排程总量）
  document.getElementById('totalOutput').textContent = totalSchedule.toLocaleString();
}

// 更新治具状态表格
function updateFixtureStatusTable() {
  const tableBody = document.getElementById('fixtureStatusTable');
  
  if (fixtures.length === 0) {
    tableBody.innerHTML = `
      <tr class="text-center">
        <td colspan="7" class="px-6 py-10 text-gray-500">
          <i class="fa fa-info-circle text-xl mb-2"></i>
          <p>暂无治具数据</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // 取前5个治具展示
  const topFixtures = fixtures.slice(0, 5);
  
  tableBody.innerHTML = topFixtures.map(fixture => {
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
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
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
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <a href="jig-management.html?edit=${fixture.id}" class="text-primary hover:text-primary/80">
            查看详情
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

// 渲染图表
function renderCharts() {
  // 产能趋势图
  const trendCtx = document.getElementById('capacityTrendChart').getContext('2d');
  
  // 模拟最近7天的数据
  const dates = [];
  const capacities = [];
  const schedules = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    
    // 随机生成数据
    const capacity = 25000 + Math.floor(Math.random() * 5000);
    const schedule = Math.floor(capacity * (0.7 + Math.random() * 0.4));
    
    capacities.push(capacity);
    schedules.push(schedule);
  }
  
  new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: '计划产能',
          data: capacities,
          borderColor: '#165DFF',
          backgroundColor: 'rgba(22, 93, 255, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: '实际排程',
          data: schedules,
          borderColor: '#00B42A',
          backgroundColor: 'rgba(0, 180, 42, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      }
    }
  });
  
  // 治具类型分布图
  const typeCtx = document.getElementById('fixtureTypeChart').getContext('2d');
  
  // 统计各类治具数量
  const typeCounts = {};
  fixtures.forEach(fixture => {
    typeCounts[fixture.type] = (typeCounts[fixture.type] || 0) + 1;
  });
  
  const typeLabels = Object.keys(typeCounts);
  const typeData = Object.values(typeCounts);
  
  // 随机颜色
  const backgroundColors = [
    'rgba(22, 93, 255, 0.7)',
    'rgba(0, 180, 42, 0.7)',
    'rgba(255, 125, 0, 0.7)',
    'rgba(245, 63, 63, 0.7)',
    'rgba(156, 39, 176, 0.7)',
    'rgba(255, 235, 59, 0.7)'
  ];
  
  new Chart(typeCtx, {
    type: 'doughnut',
    data: {
      labels: typeLabels,
      datasets: [{
        data: typeData,
        backgroundColor: backgroundColors.slice(0, typeLabels.length),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        }
      },
      cutout: '65%'
    }
  });
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