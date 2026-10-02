const mineflayer = require('mineflayer');
const http = require('http');

// ==================== WEB CEРВЕР ДЛЯ ХОСТИНГА (НЕ УДАЛЯТЬ) ====================
// Этот блок нужен, чтобы Koyeb/Render и UptimeRobot видели, что бот «жив» и не выключали его.
const WEB_PORT = process.env.PORT || 3000; // Хостинг сам передаст нужный порт
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Mineflayer бот работает 24/7!\n');
});

server.listen(WEB_PORT, () => {
  console.log(`[WEB] Сервер запущен на порту ${WEB_PORT}. Готов к пингам от UptimeRobot.`);
});
// ==============================================================================

const CONFIG = {
  host: 'survivers.space',
  port: 25565,
  username: 'online',
  password: '1234+5678',
  version: false,          // false = авто, или поставь точную, например '1.20.4'
};

let bot;
let authDone = false;
let reconnectTimeout = null;

function createBot() {
  // Очищаем старые таймеры переподключения, если они были
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  console.log(`[INFO] Подключаюсь к ${CONFIG.host}:${CONFIG.port} как ${CONFIG.username}...`);

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    auth: 'offline',       // ОБЯЗАТЕЛЬНО для пиратского сервера
    version: CONFIG.version,
    hideErrors: false,
  });

  bot.on('login', () => {
    console.log('[INFO] Успешный логин (протокол). Жду спавна...');
  });

  bot.once('spawn', () => {
    console.log('[INFO] Бот заспавнился. UUID:', bot.player.uuid);
    console.log('[INFO] Сейчас должен быть в /list');
  });

  bot.on('messagestr', (message) => {
    const msg = message.toLowerCase();
    console.log('[MSG]', message);   // смотри все сообщения сервера

    if (authDone) return;

    if (msg.includes('register') || msg.includes('зарегистр') || msg.includes('/reg')) {
      console.log('[AUTH] Регистрация...');
      bot.chat(`/register ${CONFIG.password} ${CONFIG.password}`);
      authDone = true;
    } else if (msg.includes('login') || msg.includes('авториз') || msg.includes('войти') || msg.includes('/l')) {
      console.log('[AUTH] Логин...');
      bot.chat(`/login ${CONFIG.password}`);
      authDone = true;
    }
  });

  bot.on('playerJoined', (player) => {
    if (player.username === bot.username) {
      console.log('[INFO] Бот появился в списке игроков');
    }
  });

  bot.on('kicked', (reason) => {
    console.log('[KICK]', reason);
  });

  bot.on('error', (err) => {
    console.error('[ERROR]', err);
  });

  bot.on('end', (reason) => {
    console.log(`[END] Отключился: ${reason}. Переподключение через 15 сек...`);
    authDone = false;
    
    // Удаляем старые слушатели, чтобы не копились в памяти при ошибках
    bot.removeAllListeners();
    
    // Переподключаемся через 15 секунд (чуть увеличил, чтобы сервер успел прогрузиться при рестарте)
    reconnectTimeout = setTimeout(createBot, 15000);
  });
}

createBot();
