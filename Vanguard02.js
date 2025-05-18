const mineflayer = require('mineflayer');
const webInventory = require('mineflayer-web-inventory');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

let bot;
const INVENTORY_PORT = 3000;

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
  });

  bot.on('message', (message) => {
    const msg = message.toString();
    console.log(message.toAnsi()); // Log chat màu sắc

    if (msg.includes('/login') && !loggedIn) {
      bot.chat('/login Phuc2005');
      loggedIn = true;
      console.log("🔐 Đã gửi lệnh /login");
    }

    if (msg.includes('Đăng nhập thành công') && !menuOpened) {
      setTimeout(() => {
        console.log("🕹 Dùng đồng hồ mở menu chọn chế độ");
        bot.setQuickBarSlot(4);
        bot.activateItem();
      }, 1000);
    }

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

  bot.on('kicked', (reason) => {
    console.log("❌ Bị kick khỏi server:", reason);
    reconnect();
  });

  bot.on('end', () => {
    console.log("❌ Bot bị disconnect");
    reconnect();
  });

  bot.on('error', (err) => {
    console.log("⚠️ Lỗi:", err);
  });

  // Lệnh điều khiển riêng tư qua terminal
  process.stdin.on('data', async data => {
    const input = data.toString().trim();

    if (input.startsWith('#goto')) {
      const args = input.split(' ').slice(1);
      if (args.length === 3) {
        const z = parseInt(args[2]);
        if (isNaN(z)) {
          console.log("⚠️ Tọa độ z không hợp lệ!");
          return;
        }

        const x = 23;
        const y = 55;

        try {
          console.log(`🧭 Bot đang đi đến chính xác: ${x} ${y} ${z}`);
          await bot.pathfinder.goto(new GoalBlock(x, y, z));
          console.log("✅ Bot đã đến đúng tọa độ.");
        } catch (err) {
          console.log("⚠️ Lỗi khi di chuyển:", err.message);
        }
      } else {
        console.log("⚠️ Cú pháp đúng: #goto x y z (x=23, y=55 mặc định)");
      }
    } else if (input.length > 0) {
      bot.chat(input); // Gửi chat nếu không phải #goto
      console.log(`⌨️ Gửi chat: ${input}`);
    }
  });
}

function reconnect() {
  console.log("♻️ Tự động reconnect sau 5s...");
  setTimeout(() => {
    createBot();
  }, 5000);
}

createBot();
