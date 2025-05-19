const mineflayer = require('mineflayer');
const webInventory = require('mineflayer-web-inventory');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

let bot;
const INVENTORY_PORT = 3001;
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
    username: 'Vanguard01',
    version: '1.18.2'
  });

  bot.loadPlugin(pathfinder);
  webInventory(bot, { port: INVENTORY_PORT });

  bot.once('spawn', () => {
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    reconnectAttempts = 0;

    console.log("🟢 Bot đã vào game, chờ login...");
    console.log(`🌐 Xem inventory tại: http://localhost:${INVENTORY_PORT}`);

    checkClockInterval = setInterval(() => {
      if (loggedIn && !menuOpened) {
        const slot4 = bot.inventory.slots[36 + 4];
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

  bot.on('respawn', () => {
    menuOpened = false;
    console.log('♻️ Đã reset trạng thái menu khi vào sảnh');
    
    setTimeout(() => {
      const clockSlot = bot.inventory.slots[36 + 4];
      if (clockSlot?.name.includes('clock')) {
        bot.setQuickBarSlot(4);
        console.log('🔁 Đã cầm lại Clock sau khi vào sảnh');
      }
    }, 2000);
  });

  bot.on('end', () => {
    clearInterval(checkClockInterval);
    console.log(`❌ Mất kết nối (lần thử ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("🛑 Đã thử lại quá số lần quy định");
      return process.exit(1);
    }

    const delays = [5000, 10000, 15000, 20000, 25000];
    const delay = delays[Math.min(reconnectAttempts, delays.length - 1)];

    console.log(`⌛ Thử kết nối lại sau ${delay / 1000}s...`);
    setTimeout(() => {
      reconnectAttempts++;
      createBot();
    }, delay);
  });

  bot.on('kicked', (reason) => {
    clearInterval(checkClockInterval);
    console.log("❌ Bị kick:", reason);

    if (reason.includes("Tài khoản này hiện đang kết nối") || reason.includes("already connected")) {
      console.log("⚠️ Phát hiện lỗi session, đợi 20s");
      setTimeout(() => {
        reconnectAttempts = 0;
        createBot();
      }, 20000);
    } else {
      reconnect();
    }
  });

  bot.on('error', err => console.log("⚠️ Lỗi:", err));

  process.stdin.on('data', async data => {
    const input = data.toString().trim();

    if (input.startsWith('#goto')) {
      const args = input.split(' ').slice(1);
      if (args.length === 3) {
        const x = parseInt(args[0]);
        const y = parseInt(args[1]);
        const z = parseInt(args[2]);

        if ([x, y, z].some(v => isNaN(v))) {
          console.log("⚠️ Tọa độ không hợp lệ!");
          return;
        }

        try {
          console.log(`🧭 Bot đang đi đến tọa độ chính xác: ${x} ${y} ${z}`);
          await bot.pathfinder.goto(new GoalBlock(x, y, z));
          console.log("✅ Bot đã đến đúng tọa độ.");
        } catch (err) {
          console.log("⚠️ Lỗi khi di chuyển:", err.message);
        }
      } else {
        console.log("⚠️ Cú pháp đúng: #goto x y z");
      }
      return;
    }

    if (input.startsWith('#look')) {
      const args = input.split(' ').slice(1);
      if (args.length === 2) {
        const yawDeg = parseFloat(args[0]);
        const pitchDeg = parseFloat(args[1]);

        if (isNaN(yawDeg) || isNaN(pitchDeg)) {
          console.log("⚠️ Cú pháp không hợp lệ. Ví dụ: #look 90 0");
          return;
        }

        const yawRad = yawDeg * (Math.PI / 180);
        const pitchRad = pitchDeg * (Math.PI / 180);

        try {
          await bot.look(yawRad, pitchRad);
          console.log(`👀 Bot đã quay mặt: yaw ${yawDeg}°, pitch ${pitchDeg}°`);
        } catch (err) {
          console.log("⚠️ Lỗi khi quay đầu:", err.message);
        }
      } else {
        console.log("⚠️ Dùng đúng cú pháp: #look yaw pitch (VD: #look 90 0)");
      }
      return;
    }

    if (input.length > 0) {
      bot.chat(input);
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
