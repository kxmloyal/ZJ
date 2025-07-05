// ZJ/public/settings.js
// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
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

  // 数据存储设置表单提交事件
  document.getElementById('storageSettingsForm').addEventListener('submit', handleStorageSettingsSubmit);

  // 分页设置表单提交事件
  document.getElementById('paginationSettingsForm').addEventListener('submit', handlePaginationSettingsSubmit);
}

// 处理数据存储设置表单提交
async function handleStorageSettingsSubmit(event) {
  event.preventDefault();
  const storageType = document.getElementById('storageType').value;

  try {
    const response = await fetch('/api/settings/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ storageType })
    });

    if (!response.ok) throw new Error('保存数据存储设置失败');

    showToast('数据存储设置保存成功', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 处理分页设置表单提交
async function handlePaginationSettingsSubmit(event) {
  event.preventDefault();
  const pageSize = parseInt(document.getElementById('pageSize').value);

  if (isNaN(pageSize) || pageSize < 1) {
    showToast('每页显示数量必须是大于 0 的整数', 'error');
    return;
  }

  try {
    const response = await fetch('/api/settings/pagination', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pageSize })
    });

    if (!response.ok) throw new Error('保存分页设置失败');

    showToast('分页设置保存成功', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// 显示提示消息
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.classList.add('fixed', 'bottom-6', 'right-6', 'bg-dark', 'text-white', 'px-4', 'py-3', 'rounded-lg', 'shadow-lg', 'flex', 'items-center', 'z-50');

  const icon = document.createElement('i');
  if (type === 'success') {
    icon.className = 'fa fa-check-circle mr-2';
  } else {
    icon.className = 'fa fa-exclamation-circle mr-2';
    toast.classList.remove('bg-dark');
    toast.classList.add('bg-danger');
  }
  toast.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}