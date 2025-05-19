const mineflayer = require('mineflayer');
const webInventory = require('mineflayer-web-inventory');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

let bot;
const INVENTORY_PORT = 3002;
let checkClockInterval;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;
let loggedIn = false;
let menuOpened = false;

function createBot() {
  // Reset trạng thái khi tạo bot mới
  loggedIn = false;
  menuOpened = false;

  bot = mineflayer.createBot({
    host: 'mc.luckyvn.com',
    username: 'Vanguard02',
    version: '1.18.2'
  });

  bot.loadPlugin(pathfinder);
  webInventory(bot, { port: INVENTORY_PORT });

  bot.once('spawn', () => {
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    reconnectAttempts = 0; // Reset số lần reconnect khi vào game thành công

    console.log("🟢 Bot đã vào game, chờ login...");
    console.log(`🌐 Xem inventory tại: http://localhost:${INVENTORY_PORT}`);

    // Kiểm tra Clock slot 4 mỗi 10s
    checkClockInterval = setInterval(() => {
      if (loggedIn && !menuOpened) {
        const slot4 = bot.inventory.slots[36 + 4]; // Hotbar slot 4 (index 40)
        
        if (slot4?.name === 'minecraft:clock') {
          bot.setQuickBarSlot(4);
          bot.activateItem();
        }
      }
    }, 10000);
  });

  bot.on('message', (message) => {
    const msg = message.toString();
    if (message.toAnsi) console.log(message.toAnsi());
    else console.log(msg);

    // Xử lý login
    if (msg.includes('/login') && !loggedIn) {
      bot.chat('/login Phuc2005');
      loggedIn = true;
      console.log("🔐 Đã gửi lệnh /login");
    }

    // Mở menu sau khi login
    if (msg.includes('Đăng nhập thành công') && !menuOpened) {
      setTimeout(() => {
        console.log("🕹 Dùng đồng hồ mở menu chọn chế độ");
        bot.setQuickBarSlot(4);
        bot.activateItem();
      }, 1000);
    }

    // Click chế độ
    if (msg.includes('Bạn đã mở bảng chọn máy chủ!') && !menuOpened) {
      console.log("📥 Menu mở, chuẩn bị click slot 22 và 34");
      menuOpened = true;

      setTimeout(() => {
        bot.clickWindow(22, 0, 0);
        console.log("✅ Click slot 22 - Survival");
      }, 1000);

      setTimeout(() => {
        bot.clickWindow(34, 0, 0);
        console.log("✅ Click slot 34 - Rainbow");
      }, 2500);
    }
  });

  // Reset trạng thái khi vào sảnh
  bot.on('respawn', () => {
    menuOpened = false;
    console.log('♻️ Đã reset trạng thái menu khi vào sảnh');
    
    // Đảm bảo bot cầm Clock khi vào sảnh
    setTimeout(() => {
      const clockSlot = bot.inventory.slots[36 + 4];
      if (clockSlot?.name.includes('clock')) {
        bot.setQuickBarSlot(4);
        console.log('🔁 Đã cầm lại Clock sau khi vào sảnh');
      }
    }, 2000);
  });

  // Xử lý mất kết nối
  bot.on('end', () => {
    clearInterval(checkClockInterval);
    console.log(`❌ Mất kết nối (lần thử ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("🛑 Đã thử lại quá số lần quy định");
      return process.exit(1);
    }

    const delays = [5000, 10000, 15000, 20000, 25000];
    const delay = delays[Math.min(reconnectAttempts, delays.length - 1)];
    
    console.log(`⌛ Thử kết nối lại sau ${delay/1000}s...`);
    setTimeout(() => {
      reconnectAttempts++;
      createBot();
    }, delay);
  });

  // Xử lý khi bị kick
  bot.on('kicked', (reason) => {
    clearInterval(checkClockInterval);
    console.log("❌ Bị kick:", reason);

    if (reason.includes("Tài khoản này hiện đang kết nối đến máy chủ rồi!") || reason.includes("already connected")) {
      console.log("⚠️ Phát hiện lỗi session, đợi 20s");
      setTimeout(() => {
        reconnectAttempts = 0; // Reset counter
        createBot();
      }, 20000);
    } else {
      reconnect();
    }
  });

  bot.on('error', err => console.log("⚠️ Lỗi:", err));

  // Lệnh điều khiển từ terminal
  process.stdin.on('data', async data => {
    const input = data.toString().trim();
    if (input.startsWith('#goto')) {
      // ... (giữ nguyên phần lệnh #goto)
    } else if (input.startsWith('#look')) {
      // ... (giữ nguyên phần lệnh #look)
    } else if (input) {
      bot.chat(input);
      console.log(`⌨️ Chat: ${input}`);
    }
  });
}

createBot();