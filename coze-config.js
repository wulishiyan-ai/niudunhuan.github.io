// Coze聊天机器人配置
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载，准备初始化Coze聊天机器人');
  
  if (typeof CozeWebSDK !== 'undefined') {
    console.log('CozeWebSDK已加载');
    
    // 极简配置
    const config = {
      config: {
        bot_id: '7496026874678968331'
      },
      componentProps: {
        title: '牛顿环智能助手',
        position: 'right', // 尝试改变位置
        defaultOpen: true, // 默认打开聊天窗口
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
    window.cozeClient = chatClient;
    window.cozeConfig = config;
    
    console.log('Coze聊天机器人已初始化', config);
    
    // 监听错误事件
    window.addEventListener('error', function(e) {
      console.error('捕获到错误:', e.message);
    });
  } else {
    console.error('CozeWebSDK未加载，请检查网络连接和脚本引用');
  }
}); 