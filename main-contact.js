// main.html页面的Coze智能体接入配置
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载，准备初始化main页面的Coze聊天机器人');
  
  // 检查Coze SDK是否已加载
  if (typeof CozeWebSDK !== 'undefined') {
    console.log('main页面: CozeWebSDK已加载');
    
    // 配置智能体
    const config = {
      config: {
        bot_id: '7496026874678968331'
      },
      componentProps: {
        title: '牛顿环实验助手',
        position: 'right', // 设置位置为右侧
        defaultOpen: false, // 默认关闭聊天窗口
        style: {
          primaryColor: '#2979ff', // 主题色与页面保持一致
          bubbleColor: '#f0f4ff',
          iconBackgroundColor: '#4e6af0'
        }
      },
      auth: {
        type: 'token',
        token: 'pat_UrEEz3OopV7hspM8rkZvJVezGzgPQFEzXZoZ6JHiYUxCq98gE5LVBfi5zsEHMytq',
        onRefreshToken: function () {
          return 'pat_UrEEz3OopV7hspM8rkZvJVezGzgPQFEzXZoZ6JHiYUxCq98gE5LVBfi5zsEHMytq'
        }
      }
    };
    
    // 创建聊天客户端
    const chatClient = new CozeWebSDK.WebChatClient(config);
    
    // 保存到全局变量方便调试
    window.mainCozeClient = chatClient;
    window.mainCozeConfig = config;
    
    console.log('main页面: Coze聊天机器人已初始化', config);
    
    // 为不同的实验部分添加特殊互动功能
    setupExperimentHelpers(chatClient);
  } else {
    console.error('main页面: CozeWebSDK未加载，请检查网络连接和脚本引用');
  }
});

// 设置实验相关的辅助功能
function setupExperimentHelpers(chatClient) {
  // 获取所有实验标签页按钮
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // 为每个标签页按钮添加点击事件
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // 根据不同的标签页发送不同的消息到聊天机器人
      setTimeout(() => {
        let message = '';
        switch(tabName) {
          case 'theory':
            message = '我想了解更多牛顿环的实验原理';
            break;
          case '3d-demo':
            message = '请指导我如何使用3D实验演示';
            break;
          case 'simulation':
            message = '我需要帮助进行仿真实验';
            break;
          case 'ai-prediction':
            message = '请解释数据分析部分的功能';
            break;
          case 'extension':
            message = '我想了解实验的拓展内容';
            break;
          default:
            return; // 如果没有匹配的标签页，不发送消息
        }
        
        // 如果聊天窗口没有打开，显示提示消息
        if (!document.querySelector('.cozechat-container') || 
            document.querySelector('.cozechat-container').style.display === 'none') {
          showHelperNotification('有任何问题，可以随时点击右下角的智能助手图标寻求帮助！');
        }
      }, 1000);
    });
  });
}

// 显示帮助提示通知
function showHelperNotification(message) {
  // 检查是否已存在通知元素
  let notification = document.getElementById('helper-notification');
  
  // 如果不存在，创建一个新的通知元素
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'helper-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '80px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'rgba(41, 121, 255, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '300px';
    notification.style.fontSize = '14px';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    document.body.appendChild(notification);
  }
  
  // 更新通知内容并显示
  notification.textContent = message;
  notification.style.opacity = '1';
  
  // 3秒后淡出并移除通知
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
} 