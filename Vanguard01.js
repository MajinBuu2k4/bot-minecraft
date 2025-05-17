const mineflayer = require('mineflayer');
const webInventory = require('mineflayer-web-inventory');
const express = require('express');

let bot;
let loggedIn = false;
let menuOpened = false;

// Tạo server Express để phục vụ giao diện web
const app = express();
const PORT = 3000;

function createBot() {
  bot = mineflayer.createBot({
    host: 'mc.luckyvn.com',
    username: 'Vanguard01',
    version: '1.18.2'
  });

  // Gắn plugin web-inventory vào bot
  webInventory(bot, { port: PORT });

  bot.once('spawn', () => {
    console.log("🟢 Bot spawned, đợi login...");
    loggedIn = false;
    menuOpened = false;
    console.log(`🌐 Mở trình duyệt vào http://localhost:${PORT} để xem inventory bot`);
  });

  bot.on('message', (message) => {
    const msg = message.toString();
    console.log("📨 Chat:", msg);

    if (msg.includes('/login') && !loggedIn) {
      bot.chat('/login Phuc2005');
      loggedIn = true;
      console.log("🔐 Gửi /login");
    }

    if (msg.includes('Đăng nhập thành công') && !menuOpened) {
      setTimeout(() => {
        console.log("🕹 Dùng đồng hồ mở menu chọn chế độ");
        bot.setQuickBarSlot(4);
        bot.activateItem();
      }, 1000);
    }

    if (msg.includes('Bạn đã mở bảng chọn máy chủ!')) {
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

  bot.on('kicked', (reason) => {
    console.log("❌ Bị kick khỏi server:", reason);
    reconnect();
  });

  bot.on('end', () => {
    console.log("❌ Bot đã disconnect");
    reconnect();
  });

  bot.on('error', (err) => {
    console.log("⚠️ Lỗi bot:", err);
  });
}

function reconnect() {
  console.log("♻️ Đang reconnect sau 5s...");
  setTimeout(() => {
    createBot();
  }, 5000);
}

// Start bot lần đầu
createBot();
