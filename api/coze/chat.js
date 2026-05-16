function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function getCozeChatUrl() {
  const base = (process.env.COZE_API_BASE || 'https://api.coze.cn').trim().replace(/\/$/, '');
  if (base.endsWith('/v3/chat')) return base;
  if (base.endsWith('/v3')) return `${base}/chat`;
  return `${base}/v3/chat`;
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: '只支持 POST 请求。' });
    return;
  }

  try {
    if (!process.env.COZE_API_TOKEN) {
      sendJson(res, 500, {
        error: '缺少 COZE_API_TOKEN，请先在部署平台配置扣子访问令牌。'
      });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const agentId = String(body.agentId || '').toUpperCase();
    const message = String(body.message || '').trim();
    const botId = process.env[`COZE_BOT_ID_${agentId}`] || process.env.COZE_BOT_ID;

    if (!message) {
      sendJson(res, 400, { error: '消息内容不能为空。' });
      return;
    }

    if (!botId) {
      sendJson(res, 500, {
        error: `缺少 COZE_BOT_ID_${agentId}，请在部署平台配置这个智能体对应的 Bot ID。`
      });
      return;
    }

    const cozeResponse = await fetch(getCozeChatUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: process.env.COZE_USER_ID || 'public-preview-user',
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
        error: '扣子没有返回可展示的文本回复，请检查 Token、Bot ID、Bot 发布状态和 API 权限。'
      });
      return;
    }

    sendJson(res, 200, parsed);
  } catch (error) {
    sendJson(res, 500, { error: error.message || '扣子接口调用失败。' });
  }
}
