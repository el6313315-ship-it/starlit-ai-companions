function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function getCozeChatUrl(env) {
  const base = (env.COZE_API_BASE || 'https://api.coze.cn').trim().replace(/\/$/, '');
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
    if (!dataText || dataText === '"[DONE]" || dataText === '[DONE]') continue;

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
        error: payload.msg || `Coze API returned error code: ${payload.code}`
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

export async function onRequestPost({ request, env }) {
  try {
    if (!env.COZE_API_TOKEN) {
      return json(500, {
        error: 'Missing COZE_API_TOKEN. Configure it in EdgeOne Pages environment variables.'
      });
    }

    const body = await request.json();
    const agentId = String(body.agentId || '').toUpperCase();
    const message = String(body.message || '').trim();
    const botId = env[`COZE_BOT_ID_${agentId}`] || env.COZE_BOT_ID;

    if (!message) {
      return json(400, { error: 'Message cannot be empty.' });
    }

    if (!botId) {
      return json(500, {
        error: `Missing COZE_BOT_ID_${agentId}. Configure the bot ID in EdgeOne Pages environment variables.`
      });
    }

    const cozeResponse = await fetch(getCozeChatUrl(env), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: env.COZE_USER_ID || 'public-preview-user',
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
      return json(cozeResponse.status, {
        error: responseText || `Coze API request failed: ${cozeResponse.status}`
      });
    }

    const jsonPayload = parseCozeJson(responseText);
    if (jsonPayload?.error) {
      return json(502, {
        error: `Coze API error: ${jsonPayload.error}`
      });
    }

    const parsed = jsonPayload?.reply ? jsonPayload : parseCozeStream(responseText);
    if (!parsed.reply) {
      return json(502, {
        error: 'Coze did not return displayable text. Check token, bot ID, bot publish status, and API permissions.'
      });
    }

    return json(200, parsed);
  } catch (error) {
    return json(500, {
      error: error.message || 'Coze API call failed.'
    });
  }
}

export function onRequest() {
  return json(405, { error: 'Only POST requests are supported.' });
}
