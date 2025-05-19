const mineflayer = require('mineflayer');
const webInventory = require('mineflayer-web-inventory');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

let bot;
const INVENTORY_PORT = 3002;
let checkClockInterval;

function createBot() {
  let loggedIn = false;
  let menuOpened = false;

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
  });

  // Lệnh điều khiển từ terminal
  process.stdin.on('data', async data => {
    const input = data.toString().trim();

    // Lệnh #goto
    if (input.startsWith('#goto')) {
      const args = input.split(' ').slice(1);
      if (args.length === 3) {
        const z = parseInt(args[2]);
        if (isNaN(z)) return console.log("⚠️ Tọa độ z không hợp lệ!");
        
        const x = 23, y = 55;
        try {
          console.log(`🧭 Đang đi đến ${x} ${y} ${z}...`);
          await bot.pathfinder.goto(new GoalBlock(x, y, z));
          console.log("✅ Đã đến đích");
        } catch (err) {
          console.log("⚠️ Lỗi di chuyển:", err.message);
        }
      } else {
        console.log("⚠️ Dùng: #goto x y z");
      }
      return;
    }

    // Lệnh #look
    if (input.startsWith('#look')) {
      const args = input.split(' ').slice(1);
      if (args.length === 2) {
        const yaw = parseFloat(args[0]);
        const pitch = parseFloat(args[1]);
        if (isNaN(yaw) || isNaN(pitch)) return console.log("⚠️ Góc không hợp lệ");
        
        try {
          await bot.look(yaw * Math.PI/180, pitch * Math.PI/180);
          console.log(`👀 Đã xoay: yaw ${yaw}°, pitch ${pitch}°`);
        } catch (err) {
          console.log("⚠️ Lỗi xoay:", err.message);
        }
      } else {
        console.log("⚠️ Dùng: #look yaw pitch");
      }
      return;
    }

    // Gửi chat thường
    if (input) {
      bot.chat(input);
      console.log(`⌨️ Chat: ${input}`);
    }
  });

  // Xử lý sự kiện
  bot.on('kicked', (reason) => {
    clearInterval(checkClockInterval);
    console.log("❌ Bị kick:", reason);
    reconnect();
  });

  bot.on('end', () => {
    clearInterval(checkClockInterval);
    console.log("❌ Đã ngắt kết nối");
    reconnect();
  });

  bot.on('error', err => console.log("⚠️ Lỗi:", err));
}

function reconnect() {
  console.log("♻️ Tự động kết nối lại sau 5s...");
  setTimeout(createBot, 5000);
}

createBot();