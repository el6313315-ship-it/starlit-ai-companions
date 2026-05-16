import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('请求内容过大'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('请求 JSON 格式不正确'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parseCozeStream(text) {
  let answer = '';
  let deltaAnswer = '';
  let conversationId = '';
  let chatId = '';

  for (const block of text.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const eventLine = lines.find((line) => line.startsWith('event:'));
    const dataLines = lines.filter((line) => line.startsWith('data:'));
    if (!eventLine || !dataLines.length) continue;

    const event = eventLine.replace(/^event:\s*/, '').trim();
    const dataText = dataLines.map((line) => line.replace(/^data:\s*/, '')).join('\n').trim();
    if (!dataText || dataText === '"[DONE]"' || dataText === '[DONE]') continue;

    try {
      const data = JSON.parse(dataText);
      conversationId = data.conversation_id || conversationId;
      chatId = data.chat_id || data.id || chatId;

      if (event === 'conversation.message.delta' && data.type === 'answer') {
        deltaAnswer += data.content || '';
      }

      if (
        event === 'conversation.message.completed' &&
        data.role === 'assistant' &&
        data.type === 'answer' &&
        data.content_type === 'text'
      ) {
        answer = data.content || answer;
      }
    } catch {
      // Ignore non-JSON heartbeat or done payloads.
    }
  }

  return {
    reply: answer || deltaAnswer,
    conversationId,
    chatId
  };
}

function parseCozeJson(text) {
  try {
    const payload = JSON.parse(text);
    if (payload.code && payload.code !== 0) {
      return {
        error: payload.msg || `扣子接口返回错误码：${payload.code}`
      };
    }

    const data = payload.data || payload;
    const messages = Array.isArray(data.messages) ? data.messages : Array.isArray(payload.messages) ? payload.messages : [];
    const answerMessage = messages.find((item) => item.type === 'answer' || item.role === 'assistant');
    const reply = answerMessage?.content || data.answer || data.content || payload.answer || payload.content || '';

    return {
      reply,
      conversationId: data.conversation_id || payload.conversation_id || '',
      chatId: data.id || data.chat_id || payload.id || payload.chat_id || ''
    };
  } catch {
    return null;
  }
}

function cozeApiPlugin(env) {
  const cozeBase = (env.COZE_API_BASE || 'https://api.coze.cn').trim().replace(/\/$/, '');
  const cozeChatUrl = cozeBase.endsWith('/v3/chat')
    ? cozeBase
    : cozeBase.endsWith('/v3')
      ? `${cozeBase}/chat`
      : `${cozeBase}/v3/chat`;
  const token = env.COZE_API_TOKEN;

  const handler = async (req, res, next) => {
    if (req.method !== 'POST' || !req.url?.startsWith('/api/coze/chat')) {
      next();
      return;
    }

    try {
      if (!token) {
        sendJson(res, 500, {
          error: '缺少 COZE_API_TOKEN，请先在 .env 中配置扣子访问令牌。'
        });
        return;
      }

      const body = await readJsonBody(req);
      const agentId = String(body.agentId || '').toUpperCase();
      const message = String(body.message || '').trim();
      const botId = env[`COZE_BOT_ID_${agentId}`] || env.COZE_BOT_ID;

      if (!message) {
        sendJson(res, 400, { error: '消息内容不能为空。' });
        return;
      }

      if (!botId) {
        sendJson(res, 500, {
          error: `缺少 COZE_BOT_ID_${agentId}，请在 .env 中配置这个智能体对应的 Bot ID。`
        });
        return;
      }

      const cozeResponse = await fetch(cozeChatUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: botId,
          user_id: env.COZE_USER_ID || 'local-preview-user',
          stream: true,
          auto_save_history: true,
          additional_messages: [
            {
              role: 'user',
              type: 'question',
              content: message,
              content_type: 'text'
            }
          ]
        })
      });

      const responseText = await cozeResponse.text();
      if (!cozeResponse.ok) {
        sendJson(res, cozeResponse.status, {
          error: responseText || `扣子接口请求失败：${cozeResponse.status}`
        });
        return;
      }

      const jsonPayload = parseCozeJson(responseText);
      if (jsonPayload?.error) {
        sendJson(res, 502, {
          error: `扣子认证/接口错误：${jsonPayload.error}`
        });
        return;
      }

      const parsed = jsonPayload?.reply ? jsonPayload : parseCozeStream(responseText);
      if (!parsed.reply) {
        sendJson(res, 502, {
          error: '扣子没有返回可展示的文本回复，请检查 Bot 是否已发布为 API 服务。'
        });
        return;
      }

      sendJson(res, 200, parsed);
    } catch (error) {
      sendJson(res, 500, { error: error.message || '扣子接口调用失败。' });
    }
  };

  return {
    name: 'local-coze-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), cozeApiPlugin(env)]
  };
});
