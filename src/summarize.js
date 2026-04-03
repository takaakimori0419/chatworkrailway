import OpenAI from 'openai';
import { config } from './config.js';

const client = new OpenAI({ apiKey: config.openAiApiKey });

function buildTranscript(messages) {
  return messages
    .map((m) => {
      const iso = new Date(m.send_time * 1000).toISOString();
      return `[${iso}][room:${m.room_id}] ${m.body}`;
    })
    .join('\n');
}

export async function summarizeMessages(messages, startTs, endTs) {
  const transcript = buildTranscript(messages);

  const prompt = `
以下は Chatwork のメッセージログです。
推測は禁止です。ログに明示されている内容だけを使ってください。
重要でない雑談は省略してください。

出力形式:
1. 決定事項
2. 要対応
3. 締切・日程
4. 保留事項
5. その他重要事項

各項目は箇条書きにしてください。該当がなければ「なし」と書いてください。
最後に「一言まとめ」を1行で書いてください。

対象期間:
${new Date(startTs * 1000).toISOString()} - ${new Date(endTs * 1000).toISOString()}

ログ:
${transcript}
`;

  const response = await client.responses.create({
    model: config.openAiModel,
    input: prompt,
  });

  return response.output_text?.trim() || '要約結果を取得できませんでした。';
}
