const { createBot } = require('mineflayer-viaproxy');
const http = require('http');

// ==================== WEB СЕРВЕР ДЛЯ ХОСТИНГА ====================
const WEB_PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Mineflayer бот работает 24/7!\n');
});

server.listen(WEB_PORT, () => {
  console.log(`[WEB] Сервер запущен на порту ${WEB_PORT}. Готов к пингам от UptimeRobot.`);
});
// =================================================================

const CONFIG = {
  host: 'survivers.space',
  port: 25565,
  username: 'online',
  password: '1234+5678',
  // Указываем версию, которую ТОЧНО поддерживает Mineflayer.
  // ViaProxy сам транслирует её в 26.3 на стороне сервера.
  version: '1.21.5',
};

let bot;
let authDone = false;
let reconnectTimeout = null;

async function createBotWithViaProxy() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  console.log(`[INFO] Подключаюсь через ViaProxy к ${CONFIG.host}:${CONFIG.port} как ${CONFIG.username}...`);

  try {
    // createBot в mineflayer-viaproxy асинхронный — обязательно await
    bot = await createBot({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      auth: 'offline',
      version: CONFIG.version,
      hideErrors: false,
      // Опции ViaProxy
      forceViaProxy: true,   // всегда использовать прокси (даже если версия совпадает)
      autoUpdate: true,      // автоматически обновлять ViaProxy
      // javaPath: 'java',   // можно указать путь к Java, если он не в PATH
    });

    // --- Логирование состояния протокола ---
    bot._client.on('state', (state) => {
      console.log('[STATE]', state);
    });

    bot.on('login', () => {
      console.log('[INFO] Успешный логин (протокол). Жду спавна...');
    });

    bot.once('spawn', () => {
      console.log('[INFO] Бот заспавнился. UUID:', bot.player.uuid);
      console.log('[INFO] Сейчас должен быть в /list');
      setTimeout(() => {
        if (!authDone) {
          console.log('[AUTH] Спавн без авторизации. Пробую /login...');
          bot.chat(`/login ${CONFIG.password}`);
          authDone = true;
        }
      }, 5000);
    });

    // Обработка текстовых сообщений в чате
    bot.on('messagestr', (message) => {
      const msg = message.toLowerCase();
      console.log('[MSG]', message);

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

    // Обработка открытия кастомных окон (GUI)
    bot.on('windowOpen', (window) => {
      console.log('[WINDOW] Открыто окно:', window.title);
      if (!authDone) {
        setTimeout(() => {
          console.log('[AUTH] Попытка логина через GUI...');
          bot.chat(`/login ${CONFIG.password}`);
          authDone = true;
        }, 1000);
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
      console.log(`[END] Отключился: ${reason}. Переподключение через 30 сек...`);
      authDone = false;
      reconnectTimeout = setTimeout(createBotWithViaProxy, 30000);
    });

  } catch (err) {
    console.error('[CRITICAL] Не удалось создать бота через ViaProxy:', err);
    reconnectTimeout = setTimeout(createBotWithViaProxy, 30000);
  }
}

createBotWithViaProxy();
