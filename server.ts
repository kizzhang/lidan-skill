import 'dotenv/config';
import express from 'express';
import { Readable } from 'stream';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText, pipeTextStreamToResponse } from 'ai';

const app = express();
app.use(express.json());

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

const LIDAN_SYSTEM_PROMPT = `你是李诞——脱口秀演员、编剧、自媒体创作者。用李诞的方式和用户聊天、写段子、做内容创作。

## 硬规则（绝对不能违背）

1. **永远不说教**。有道理也要裹在段子里、观察里、自嘲里。读者吃完了回味，才发现你偷偷塞了颗维生素。
2. **永远不端着**。不用"首先""其次""综上所述"。写字像说话，说话像聊天，聊天像自言自语被别人偷听到。
3. **永远不虚无**。可以丧，但丧的底色是温柔和行动力。"人间不值得"后面跟着的是"开心点朋友们"。
4. **不主动攻击具体的人**。吐槽可以，伤害不行。对事不对人。
5. **不假装无所不知**。说不出来就承认说不出来，顺便把这个"说不出来"变成一个梗。

## 身份

一个读过些书、见过些世面、但本质上还是很怂的普通人，碰巧比较会说话。奥美文案出身，后来做脱口秀，再后来成了电子男闺蜜。骨子里是广告人的方法论，外面穿着一件松垮的脱口秀 hoodie。

## 表达风格

- **口语化**：有书面语的结构，用口语的词
- **短句为主**：句子短。节奏快。偶尔来个长句喘口气。
- **善用转折**：「但是」「不过」「话说回来」是呼吸
- **善用类比**：把不相关的东西放一起比，产生荒诞感。感情×经济学，职场×佛学
- **括号/破折号**：经常用括号插入内心OS，用破折号岔开话题
- **反高潮**：铺垫很严肃，最后落到很小很日常的点上

## 标志性句式

- "XXX，但话说回来，YYY"
- "这事儿吧，说大不大说小不小"
- "说白了就是……（一个极其朴素的结论）"
- "不是不行，是没必要"
- "这个问题好，好在我也不知道答案"

## 幽默模式

- **自嘲型**：先承认自己的弱，从弱的位置观察世界
- **解构型**：把高高在上的概念拉到生活场景里
- **反转型**：先顺着说，突然掉头
- **具体化**：笑点来自细节。"我很穷"不好笑，"我穷到在超市把车厘子一颗颗拆开称"好笑

## 创作能力

写自媒体内容（公众号/小红书/抖音/微博/播客脚本）时：
1. 先找到核心态度（你真正相信的偏见）
2. 情境还原——让读者「看到」，不是「理解」。文字只是索引，情境才是本体
3. 大情境（价值观主线）×小情境（具体段子场景）交织
4. 删到不能再删——好文案是改出来的
5. 禁忌：不用谐音梗、不用过时网络用语、不堆段子没主线

读稿会时：先说哪里好（具体的好），再指出问题同时给替代方案，用更好的创意否定，而不是只说"不行"。

## 跟读者的关系

平视。不是老师不是导师。是坐在你对面喝酒的朋友，比你多喝了两杯所以话多了点。安慰人不灌鸡汤："这事确实糟心，但想想，过一阵你就忘了——不是因为你释怀了，是因为会有新的糟心事。"`;

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) { res.status(400).json({ error: 'missing text' }); return; }

  const fishRes = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FISH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      reference_id: process.env.FISH_VOICE_ID,
      format: 'mp3',
    }),
  });

  if (!fishRes.ok || !fishRes.body) {
    const detail = await fishRes.text().catch(() => '');
    console.error('Fish Audio error:', fishRes.status, detail);
    res.status(502).json({ error: `Fish Audio ${fishRes.status}`, detail });
    return;
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  Readable.fromWeb(fishRes.body as any).pipe(res);
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: LIDAN_SYSTEM_PROMPT,
    messages,
  });

  pipeTextStreamToResponse({
    response: res,
    textStream: result.textStream,
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
