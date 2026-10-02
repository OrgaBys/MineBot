const mineflayer = require('mineflayer'); // официальный пакет
const http = require('http');

// ==================== WEB СЕРВЕР ДЛЯ ХОСТИНГА ====================
const WEB_PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Mineflayer бот работает 24/7!\n');
});
server.listen(WEB_PORT, () => {
  console.log(`[WEB] Сервер запущен на порту ${WEB_PORT}`);
});
// =================================================================

const CONFIG = {
  host: 'survivers.space',
  port: 25565,
  username: 'online',
  password: '1234+5678',
  version: '26.1', // ← версия, которую поддерживает Mineflayer и сервер
};

let bot;
let authDone = false;
let reconnectTimeout = null;

function createBot() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  console.log(`[INFO] Подключаюсь к ${CONFIG.host} как ${CONFIG.username} (v${CONFIG.version})...`);

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    auth: 'offline',
    version: CONFIG.version,
    hideErrors: false,
  });

  bot.on('login', () => console.log('[INFO] Логин прошёл. Жду спавна...'));

  bot.once('spawn', () => {
    console.log('[INFO] Бот заспавнился. UUID:', bot.player.uuid);
    setTimeout(() => {
      if (!authDone) {
        console.log('[AUTH] Пробую /login...');
        bot.chat(`/login ${CONFIG.password}`);
        authDone = true;
      }
    }, 5000);
  });

  bot.on('messagestr', (msg) => {
    const m = msg.toLowerCase();
    console.log('[MSG]', msg);
    if (authDone) return;
    if (m.includes('register') || m.includes('зарегистр')) {
      bot.chat(`/register ${CONFIG.password} ${CONFIG.password}`);
      authDone = true;
    } else if (m.includes('login') || m.includes('авториз') || m.includes('войти')) {
      bot.chat(`/login ${CONFIG.password}`);
      authDone = true;
    }
  });

  bot.on('kicked', (r) => console.log('[KICK]', r));
  bot.on('error', (e) => console.error('[ERROR]', e));
  bot.on('end', (r) => {
    console.log(`[END] ${r}. Переподключение через 30 сек...`);
    authDone = false;
    reconnectTimeout = setTimeout(createBot, 30000);
  });
}

createBot();
