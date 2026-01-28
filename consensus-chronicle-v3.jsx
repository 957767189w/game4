import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, update, remove, get } from 'firebase/database';
import { ethers } from 'ethers';

// ========== CONFIG ==========
const CONFIG = {
  ROOM_SIZE: { min: 2, max: 8 },
  DEBATE_DURATION: 90,
  VOTE_DURATION: 30,
  TOTAL_ROUNDS: 5,
  ENTRY_FEE: '0.01', // GEN币入场费
  GENLAYER_CONTRACT: '0x4F5F132ba540f1C685B0188D59990302903aE186',
  GENLAYER_RPC: 'https://studio.genlayer.com:8443/api',
  FIREBASE: {
    apiKey: "AIzaSyBX4tOb30jWKK6aBUsqERQaOAF4CxCfMmQ",
    authDomain: "consensus-chronicle.firebaseapp.com",
    databaseURL: "https://consensus-chronicle-default-rtdb.firebaseio.com",
    projectId: "consensus-chronicle",
    storageBucket: "consensus-chronicle.firebasestorage.app",
    messagingSenderId: "175835565956",
    appId: "1:175835565956:web:80e59789fade3d439757d1"
  }
};

// ========== STORY ARCS (保持原样) ==========
const STORY_ARCS = {
  fantasy: {
    name: '奇幻冒险',
    icon: '🏰',
    opening: '古老的预言终于应验——沉睡千年的黑龙苏醒了。王国危在旦夕，国王紧急召集了各地英雄商议对策...',
    rounds: [
      { context: '黑龙的威胁迫在眉睫，王国必须做出第一个关键决定。', a: { text: '立即集结军队，主动出击龙巢，在它完全苏醒前将其消灭。', tag: '先发制人·激进', consequence: '王国军队向龙巢进发，但途中遭遇了龙的爪牙，损失惨重...' }, b: { text: '派遣使者寻求精灵族的帮助，他们曾在千年前封印过黑龙。', tag: '寻求联盟·稳妥', consequence: '使者成功联系到了精灵族，但他们提出了苛刻的条件...' } },
      { contextA: '军队损失惨重，但已逼近龙巢。此时探子来报：龙巢内发现了龙蛋。', contextB: '精灵族要求人类交出圣剑作为信任的证明，否则不予援助。', a: { text: '摧毁龙蛋，彻底断绝黑龙一族的血脉，永除后患。', tag: '斩草除根·残酷', consequenceFromA: '龙蛋被毁，黑龙狂怒，战斗更加惨烈...', consequenceFromB: '拒绝交出圣剑后，人类决定独自面对黑龙，摧毁了龙蛋...' }, b: { text: '保留龙蛋，或许可以用它与黑龙谈判，或培养一条友善的龙。', tag: '留有余地·冒险', consequenceFromA: '龙蛋被秘密保护起来，但消息泄露引发了内部分裂...', consequenceFromB: '交出圣剑换取精灵援助，同时保护了龙蛋...' } },
      { contextAA: '黑龙在狂怒中展现出毁天灭地的力量，军队即将全军覆没。', contextAB: '内部分裂导致军心涣散，有人主张投降，有人坚持战斗。', contextBA: '独自作战的人类军队在没有精灵魔法的支持下陷入苦战。', contextBB: '精灵军队抵达，但他们对龙蛋的存在感到不满，威胁撤军。', a: { text: '使用禁忌魔法，牺牲施法者的生命来重创黑龙。', tag: '牺牲小我·悲壮', consequence: '禁忌魔法生效，黑龙重伤坠落，但代价是惨重的...' }, b: { text: '下令撤退，保存实力，等待更好的时机再战。', tag: '以退为进·忍耐', consequence: '军队撤退到安全地带，但黑龙趁机摧毁了数个村庄...' } },
      { contextA: '黑龙重伤后退回巢穴疗伤，但它的愤怒使得整个区域都笼罩在死亡气息中。', contextB: '撤退后，王国开始反思策略，民间出现了各种声音和势力。', a: { text: '趁黑龙疗伤期间发起总攻，一举将其消灭。', tag: '乘胜追击·决绝', consequence: '总攻开始，这将是决定王国命运的最后一战...' }, b: { text: '尝试与受伤的黑龙沟通，寻找和平共存的可能。', tag: '化敌为友·理想', consequence: '使者冒死接近黑龙，出乎意料地，黑龙愿意对话...' } },
      { contextA: '最终决战中，双方都付出了惨重代价，胜负即将揭晓。', contextB: '黑龙透露它苏醒是因为感受到了更大的威胁——来自深渊的邪神即将降临。', a: { text: '不惜一切代价消灭黑龙，哪怕王国化为焦土也在所不惜。', tag: '玉石俱焚·极端', ending: '黑龙被消灭，但王国也几乎化为废墟。幸存者开始了漫长的重建之路，历史将铭记这场惨胜。' }, b: { text: '接受命运的安排，与黑龙达成协议，共同面对未来的挑战。', tag: '握手言和·智慧', ending: '人类与黑龙达成了前所未有的盟约，共同守护这片大陆。一个新的时代就此开启。' } }
    ]
  },
  scifi: {
    name: '科幻未来',
    icon: '🚀',
    opening: '2157年，火星殖民地"新希望"收到了一段来自深空的神秘信号。科学家们破译后发现：这是一个警告——地球将在100天后被小行星撞击。然而，殖民地的资源只够救一半人...',
    rounds: [
      { context: '消息公布后，殖民地陷入恐慌。领导层必须立即做出决定。', a: { text: '立即启动"方舟计划"，通过抽签决定谁能登上逃生飞船。', tag: '公平抽签·冷酷', consequence: '抽签结果公布，落选者开始绝望地抗议，安保部队被迫介入...' }, b: { text: '集中所有资源研究信号来源，也许那里有拯救所有人的答案。', tag: '追寻希望·冒险', consequence: '研究团队发现信号来自一个未知文明，他们似乎在邀请人类...' } },
      { contextA: '抗议演变为暴动，部分落选者占领了飞船发射区。', contextB: '深入分析信号后，发现那个文明在邀请人类去一个遥远的星系，但旅程需要500年。', a: { text: '授权安保部队使用武力，确保方舟计划按时执行。', tag: '铁腕镇压·效率', consequenceFromA: '暴动被镇压，但许多人在冲突中丧生，幸存者心存怨恨...', consequenceFromB: '放弃与外星文明联系，专注于现有的逃生计划...' }, b: { text: '与抗议者谈判，尝试修改计划让更多人获得生存机会。', tag: '寻求共识·人道', consequenceFromA: '谈判取得进展，工程师提出可以超载飞船，但风险极大...', consequenceFromB: '决定派遣先锋队响应邀请，其余人进入冷冻睡眠等待...' } },
      { contextAA: '飞船超载会导致成功率从95%降到60%，但能多救30%的人。', contextAB: '先锋队出发后失去联系，剩余资源只够维持60天。', contextBA: '部分激进分子不接受谈判结果，密谋破坏飞船。', contextBB: '冷冻睡眠技术尚未完善，有30%的失败率。', a: { text: '接受超载方案，用60%的成功率换取更多人的希望。', tag: '冒险求全·赌博', consequence: '超载方案启动，所有人都在祈祷奇迹发生...' }, b: { text: '维持原计划，确保至少一半人能够确定存活。', tag: '稳妥求存·现实', consequence: '原计划继续执行，但社会的裂痕已无法弥合...' } },
      { contextA: '飞船起飞前，AI系统检测到一个惊人的可能性：小行星的轨道可以被人为改变。', contextB: '发射准备完成时，先锋队突然传来消息：外星文明可以提供技术摧毁小行星，但需要人类放弃武器。', a: { text: '尝试改变小行星轨道，即使失败也值得一试。', tag: '逆天改命·英雄', consequence: '全殖民地的能源被集中用于这个大胆的计划...' }, b: { text: '按原计划撤离，不要把所有鸡蛋放在一个篮子里。', tag: '分散风险·谨慎', consequence: '飞船开始撤离，但留下的人没有放弃希望...' } },
      { contextA: '改变轨道的尝试消耗了80%的能源，小行星偏移了，但不够——它仍会擦过地球大气层，造成巨大灾难。', contextB: '外星文明的技术确实有效，但他们要求人类必须先销毁所有核武器作为"入会费"。', a: { text: '放手一搏，用剩余能源再推一次，要么全赢，要么全输。', tag: '背水一战·极限', ending: '奇迹发生了！小行星在最后一刻偏离了撞击轨道。人类用勇气和团结战胜了命运，这一天被永远铭记为"新希望日"。' }, b: { text: '接受部分损失，开始灾后重建计划，人类将浴火重生。', tag: '务实面对·重生', ending: '小行星擦过地球，造成了严重但非毁灭性的灾难。幸存的人类开始了艰难的重建，但他们知道，只要人类还在，希望就在。' } }
    ]
  },
  mystery: {
    name: '悬疑推理',
    icon: '🔍',
    opening: '暴风雨之夜，富豪陈家的家主陈老爷在书房被人毒杀。大门从内反锁，窗户完好无损。在场的有：大儿子陈明、二女儿陈月、管家老张、女仆小芳，以及刚到访的神秘商人李先生。每个人似乎都有嫌疑，每个人都有秘密...',
    rounds: [
      { context: '警方封锁了宅邸，所有人都不能离开。作为被邀请来的侦探，你必须开始调查。', a: { text: '首先搜查死者的书房，寻找物证和线索。', tag: '物证优先·系统', consequence: '在书房发现了一封被烧毁一半的信件，隐约可见"背叛"和"遗产"字样...' }, b: { text: '分别询问在场每个人，观察他们的反应和漏洞。', tag: '察言观色·直觉', consequence: '询问中发现管家老张神色慌张，而陈月提到父亲最近收到过威胁信...' } },
      { contextA: '信件显示陈老爷曾打算更改遗嘱，剥夺某人的继承权。', contextB: '进一步调查发现，威胁信来自一个神秘组织，而李先生似乎与这个组织有关联。', a: { text: '深入调查遗产问题，追查谁是被剥夺继承权的人。', tag: '追踪金钱·现实', consequenceFromA: '发现陈明欠下巨额赌债，而陈月一直在秘密资助一个慈善机构...', consequenceFromB: '调查显示陈老爷最近转移了大笔资产，但去向不明...' }, b: { text: '调查李先生的身份和来历，他的出现太过巧合。', tag: '追查外人·怀疑', consequenceFromA: '李先生的身份被揭露：他是陈老爷失散多年的私生子...', consequenceFromB: '李先生承认自己是来谈生意的，但他带来了一个惊人的秘密...' } },
      { contextAA: '陈明有动机，但他有不在场证明——女仆小芳可以作证。', contextAB: '资产转移的目的地是一个海外账户，户主名字被加密。', contextBA: '私生子的出现意味着遗产将被重新分配，所有合法继承人都有了动机。', contextBB: '李先生透露陈老爷生前一直在调查一桩陈年旧案——一起被掩盖的谋杀。', a: { text: '验证小芳的证词，她可能是关键证人，也可能是同谋。', tag: '质疑证词·细致', consequence: '压力之下，小芳崩溃了，承认陈明曾威胁她作伪证...' }, b: { text: '调查陈年旧案，也许过去的秘密能揭示现在的真相。', tag: '追溯过去·耐心', consequence: '旧案的线索指向20年前的一场火灾，陈老爷的原配妻子在那场火灾中身亡...' } },
      { contextA: '伪证被揭穿后，陈明的不在场证明失效。但他坚称自己是无辜的，并指控陈月才是凶手。', contextB: '调查发现，那场火灾并非意外，而是人为纵火。更惊人的是，陈老爷可能知道真凶是谁。', a: { text: '对陈明和陈月进行交叉审问，找出谁在说谎。', tag: '正面对质·激烈', consequence: '审问中，一个惊天秘密被揭开：陈月不是陈老爷的亲生女儿...' }, b: { text: '重新检验毒药来源，凶器往往能指向真凶。', tag: '科学分析·严谨', consequence: '毒药成分分析显示，这种毒药只能从一种稀有植物中提取，而管家老张的房间里种着这种植物...' } },
      { contextA: '陈月的身世秘密揭开后，真相逐渐浮出水面：她是20年前火灾中"死去"的那个人的女儿，被陈老爷秘密收养。', contextB: '所有证据都指向管家老张，但他在被审问时突然心脏病发作，留下一句话："真相...在花园的老槐树下..."', a: { text: '公开所有真相，让法律来裁决，无论结果如何。', tag: '公正审判·法治', ending: '真相大白：管家老张是20年前陈老爷原配的情人，火灾是他们一起策划的。陈老爷发现真相后打算揭发他，于是老张痛下杀手。陈月得知自己的身世后选择原谅，并用继承的遗产成立了基金会，帮助那些像她一样失去家庭的孩子。' }, b: { text: '给予相关人一个选择的机会，有些真相也许不该被公开。', tag: '人情考量·灰色', ending: '你选择了一个折中的方案：老张的罪行被低调处理，对外宣布陈老爷死于意外。陈明戒掉了赌博，陈月继续她的慈善事业，李先生带着父亲的遗物离开。有些真相被永远埋葬，但活着的人都有了新的开始。' } }
    ]
  },
  political: {
    name: '宫廷权谋',
    icon: '👑',
    opening: '大齐王朝，永安三十年。老皇帝驾崩的消息震惊朝野。遗诏中却出现了令人费解的内容：皇位不传给三位成年皇子中的任何一个，而是由"最能代表民心者"继承。一时间，朝堂暗流涌动，各方势力蠢蠢欲动...',
    rounds: [
      { context: '作为先帝信任的内阁首辅，你必须在混乱中维持局面。三位皇子各有支持者：太子仁厚但懦弱，二皇子精明但残忍，三皇子年轻但锐意改革。', a: { text: '支持太子按传统继位，维护嫡长子继承制度的稳定。', tag: '传统正统·保守', consequence: '太子获得你的支持后信心大增，但二皇子的支持者开始暗中联络军方...' }, b: { text: '提议三位皇子各陈施政纲领，由百官公议决定人选。', tag: '公议决选·革新', consequence: '这个提议引发轩然大波，改革派欢呼，保守派强烈反对...' } },
      { contextA: '二皇子勾结边疆将军，密谋起兵"清君侧"，局势骤然紧张。', contextB: '公议之前，有人揭发三皇子与外邦使节有秘密往来，涉嫌叛国。', a: { text: '紧急调动御林军布防，同时派密使分化二皇子的同盟。', tag: '分化瓦解·权谋', consequenceFromA: '你的计策成功拖延了二皇子的行动，但他开始怀疑内部有人背叛...', consequenceFromB: '你利用这个机会打压三皇子，但调查显示揭发信可能是伪造的...' }, b: { text: '主动找二皇子谈判，了解他的诉求，寻找和平解决的可能。', tag: '和谈止兵·冒险', consequenceFromA: '二皇子提出条件：他要太子的位置，但承诺善待兄弟...', consequenceFromB: '揭发事件使三皇子陷入困境，你决定亲自调查真相...' } },
      { contextAA: '二皇子的盟友被成功策反，但对方要求事成之后封侯拜相。', contextAB: '调查显示揭发信出自太后的亲信，目的是扶持她的外甥上位。', contextBA: '二皇子的条件令人难以接受，但他手握重兵，拒绝可能导致内战。', contextBB: '太后开始公开干政，以先帝遗孀的身份要求"垂帘听政"。', a: { text: '答应封侯的条件，两害相权取其轻，先稳住局面。', tag: '权宜之计·妥协', consequence: '局势暂时稳定，但你知道这只是开始，更大的风暴还在后面...' }, b: { text: '揭露太后的阴谋，联合三位皇子共同对抗外戚专权。', tag: '团结抗敌·正义', consequence: '你的揭露让朝堂震动，三位皇子破天荒地站在了一起...' } },
      { contextA: '各方势力暂时平衡，但储位之争仍悬而未决。这时边疆传来急报：北方游牧民族大军压境。', contextB: '太后被软禁，外戚势力瓦解。但在整理太后寝宫时，发现了先帝的另一份遗诏...', a: { text: '建议三位皇子亲征北疆，谁能击退敌军谁就是新帝。', tag: '以战定帝·魄力', consequence: '三位皇子率军北上，这场战争将决定大齐的未来...' }, b: { text: '提议先选出新帝再应对外敌，国不可一日无君。', tag: '先内后外·稳重', consequence: '在你的主持下，一场决定性的朝议即将开始...' } },
      { contextA: '北疆战事胶着，太子仁德抚民，二皇子勇猛作战，三皇子后勤调度有方。三人各有功劳，难分高下。', contextB: '先帝的真正遗诏被找到，上面写着：皇位传给"能让三个儿子和睦共处者"。这个人...竟然是你。', a: { text: '建议三位皇子共同执政，建立"三王议政"的新制度。', tag: '权力共享·开创', ending: '大齐王朝进入了前所未有的"三王时代"。太子主内政，二皇子掌军事，三皇子负责改革。虽然争吵不断，但在你的调和下，这个制度竟然运转了起来。二十年后，你在回忆录中写道："最好的制度不是完美的制度，而是能自我纠错的制度。"' }, b: { text: '按军功大小排序，由功劳最大者继承皇位。', tag: '功勋定位·公平', ending: '二皇子凭借战功登基，但他没有辜负信任。在位期间北击游牧、内修政治，大齐迎来了中兴。三皇子被封为改革特使，太子主管礼部教化。你以七十高龄辞官归隐时，新帝亲自送行十里，说："没有首辅大人，就没有今日的大齐。"' } }
    ]
  }
};

// ========== AI PLAYERS ==========
const AI_PLAYERS = [
  { id: 'ai_1', name: '智者·艾丝', avatar: '🧙‍♀️', exp: 1200, isAI: true, style: 'analytical' },
  { id: 'ai_2', name: '勇者·凯恩', avatar: '⚔️', exp: 1100, isAI: true, style: 'bold' },
  { id: 'ai_3', name: '学者·诺亚', avatar: '📚', exp: 1300, isAI: true, style: 'cautious' },
  { id: 'ai_4', name: '商人·马可', avatar: '💰', exp: 1150, isAI: true, style: 'pragmatic' },
  { id: 'ai_5', name: '诗人·月华', avatar: '🎭', exp: 1050, isAI: true, style: 'romantic' },
];

// ========== AI DEBATE GENERATOR ==========
const generateAIDebate = (style) => {
  const debates = {
    analytical: { A: ['从逻辑上分析，选项A的成功率更高', '数据表明，果断行动往往效果更好', '我们需要理性思考，A是最优解'], B: ['仔细分析后，B的长期收益更大', '从历史经验看，B这样的选择更明智', '综合考量，B是更稳妥的方案'] },
    bold: { A: ['勇者不惧！A才是真正的英雄之选', '果断出击！支持A！', '优柔寡断只会错失良机，选A！'], B: ['B才是真正的勇气！敢于不同！', '有时候退一步是为了跳得更远，B！', '智勇双全才是真英雄，选B！'] },
    cautious: { A: ['虽然冒险，但A或许是必要的', '两害相权取其轻，支持A', '深思熟虑后，我认为A可行'], B: ['谨慎起见，B更安全', '稳扎稳打，B是上策', '留得青山在，选B更明智'] },
    pragmatic: { A: ['从利益角度，A回报更高', '投资回报比来看，A更划算', '商人的直觉告诉我，选A'], B: ['B的风险更可控', '从成本效益看，B更实际', '长远来看，B收益更稳定'] },
    romantic: { A: ['A有种悲壮的美感', '命运的诗篇需要A这样的转折', '就让A成为传说的一部分吧'], B: ['B代表着希望与可能', '美好的故事需要B这样的选择', 'B才是最动人的答案'] },
  };
  const choice = Math.random() > 0.5 ? 'A' : 'B';
  const options = debates[style]?.[choice] || debates.analytical[choice];
  return { text: options[Math.floor(Math.random() * options.length)], choice };
};

// ========== MSGPACK ENCODER (for GenLayer) ==========
const msgpack = {
  encode: (obj) => {
    const encodeValue = (val) => {
      if (val === null) return [0xc0];
      if (val === false) return [0xc2];
      if (val === true) return [0xc3];
      if (typeof val === 'number') {
        if (Number.isInteger(val)) {
          if (val >= 0 && val <= 127) return [val];
          if (val >= 0 && val <= 255) return [0xcc, val];
          if (val >= 0 && val <= 65535) return [0xcd, (val >> 8) & 0xff, val & 0xff];
        }
      }
      if (typeof val === 'string') {
        const bytes = new TextEncoder().encode(val);
        if (bytes.length <= 31) return [0xa0 | bytes.length, ...bytes];
        if (bytes.length <= 255) return [0xd9, bytes.length, ...bytes];
        return [0xda, (bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes];
      }
      if (Array.isArray(val)) {
        let result = val.length <= 15 ? [0x90 | val.length] : [0xdc, (val.length >> 8) & 0xff, val.length & 0xff];
        val.forEach(item => result.push(...encodeValue(item)));
        return result;
      }
      if (typeof val === 'object') {
        const keys = Object.keys(val);
        let result = keys.length <= 15 ? [0x80 | keys.length] : [0xde, (keys.length >> 8) & 0xff, keys.length & 0xff];
        keys.forEach(key => { result.push(...encodeValue(key)); result.push(...encodeValue(val[key])); });
        return result;
      }
      return [0xc0];
    };
    return new Uint8Array(encodeValue(obj));
  }
};

// ========== MAIN COMPONENT ==========
export default function ConsensusChronicle() {
  // Firebase & Wallet state
  const [db, setDb] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  
  // Game state
  const [view, setView] = useState('home');
  const [player, setPlayer] = useState({ id: '', name: '', avatar: '🎮', exp: 1000 });
  const [roomId, setRoomId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // Local UI state
  const [debateInput, setDebateInput] = useState('');
  const [myVote, setMyVote] = useState(null);
  const [timer, setTimer] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const unsubscribeRefs = useRef([]);

  // ========== INIT FIREBASE ==========
  useEffect(() => {
    try {
      const app = initializeApp(CONFIG.FIREBASE);
      const database = getDatabase(app);
      setDb(database);
      console.log('Firebase initialized');
    } catch (err) {
      console.error('Firebase init error:', err);
    }
    
    // Load leaderboard from localStorage
    try {
      const saved = localStorage.getItem('consensus_leaderboard');
      if (saved) setLeaderboard(JSON.parse(saved));
    } catch {}
    
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub && unsub());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========== LISTEN TO AVAILABLE ROOMS ==========
  useEffect(() => {
    if (!db) return;
    const roomsRef = ref(db, 'rooms');
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rooms = Object.entries(data)
          .filter(([_, room]) => room.status === 'waiting')
          .map(([id, room]) => ({ id, ...room }));
        setAvailableRooms(rooms);
      } else {
        setAvailableRooms([]);
      }
    });
    unsubscribeRefs.current.push(unsub);
  }, [db]);

  // ========== LISTEN TO CURRENT ROOM ==========
  useEffect(() => {
    if (!db || !roomId) return;
    
    // Listen to room data
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsub1 = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        if (data.players) {
          setPlayers(Object.values(data.players));
        }
      }
    });
    
    // Listen to game state
    const gameRef = ref(db, `games/${roomId}`);
    const unsub2 = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        if (data.messages) {
          setMessages(Object.values(data.messages).sort((a, b) => a.timestamp - b.timestamp));
        }
        // Handle timer
        if (data.timerEnd && data.phase !== 'ended') {
          const remaining = Math.max(0, Math.floor((data.timerEnd - Date.now()) / 1000));
          setTimer(remaining);
        }
      }
    });
    
    unsubscribeRefs.current.push(unsub1, unsub2);
    
    return () => {
      unsub1();
      unsub2();
    };
  }, [db, roomId]);

  // ========== TIMER SYNC ==========
  useEffect(() => {
    if (!gameState?.timerEnd || gameState?.phase === 'ended') return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((gameState.timerEnd - Date.now()) / 1000));
      setTimer(remaining);
      
      // Host handles phase transitions
      if (remaining <= 0 && player.id === roomData?.host) {
        handlePhaseEnd();
      }
    }, 1000);
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState?.timerEnd, gameState?.phase]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========== WALLET FUNCTIONS ==========
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包');
      return null;
    }
    setWalletConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      setWalletAddress(address);
      setPlayer(p => ({ ...p, id: address }));
      return address;
    } catch (err) {
      console.error('Wallet connect error:', err);
      alert('钱包连接失败: ' + err.message);
      return null;
    } finally {
      setWalletConnecting(false);
    }
  };

  // ========== GENLAYER: PAY ENTRY FEE ==========
  const payEntryFee = async () => {
    if (!window.ethereum || !walletAddress) {
      alert('请先连接钱包');
      return false;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Encode calldata for pay_entry_fee
      const calldata = msgpack.encode(['pay_entry_fee', []]);
      const calldataHex = '0x' + Array.from(calldata).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const tx = await signer.sendTransaction({
        to: CONFIG.GENLAYER_CONTRACT,
        data: calldataHex,
        value: ethers.parseEther(CONFIG.ENTRY_FEE)
      });
      
      await tx.wait();
      return true;
    } catch (err) {
      console.error('Payment error:', err);
      alert('支付失败: ' + err.message);
      return false;
    }
  };

  // ========== GENLAYER: RECORD GAME END ==========
  const recordGameEnd = async (gameData) => {
    if (!walletAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const calldata = msgpack.encode(['record_game', [
        roomId,
        gameData.theme,
        gameData.winner || walletAddress,
        gameData.path?.join('') || '',
        Math.floor(Date.now() / 1000),
        players.length
      ]]);
      const calldataHex = '0x' + Array.from(calldata).map(b => b.toString(16).padStart(2, '0')).join('');
      
      await signer.sendTransaction({
        to: CONFIG.GENLAYER_CONTRACT,
        data: calldataHex
      });
    } catch (err) {
      console.error('Record game error:', err);
    }
  };

  // ========== ROOM FUNCTIONS ==========
  const createRoom = async (theme) => {
    if (!db || !player.name) return;
    
    // Connect wallet if not connected
    let address = walletAddress;
    if (!address) {
      address = await connectWallet();
      if (!address) return;
    }
    
    // Pay entry fee
    const paid = await payEntryFee();
    if (!paid) return;
    
    // Create room in Firebase
    const newRoomId = `room_${Date.now()}`;
    const roomRef = ref(db, `rooms/${newRoomId}`);
    
    await set(roomRef, {
      theme,
      host: address,
      status: 'waiting',
      createdAt: Date.now(),
      players: {
        [address]: { id: address, name: player.name, avatar: player.avatar, exp: player.exp, isAI: false }
      }
    });
    
    setRoomId(newRoomId);
    setView('room');
    
    // Add AI players after delay
    setTimeout(() => addAIPlayers(newRoomId), 1500);
  };

  const joinRoom = async (targetRoomId) => {
    if (!db || !player.name) return;
    
    // Connect wallet if not connected
    let address = walletAddress;
    if (!address) {
      address = await connectWallet();
      if (!address) return;
    }
    
    // Pay entry fee
    const paid = await payEntryFee();
    if (!paid) return;
    
    // Join room in Firebase
    const playerRef = ref(db, `rooms/${targetRoomId}/players/${address}`);
    await set(playerRef, { id: address, name: player.name, avatar: player.avatar, exp: player.exp, isAI: false });
    
    setRoomId(targetRoomId);
    setView('room');
  };

  const addAIPlayers = async (targetRoomId) => {
    if (!db) return;
    const shuffled = [...AI_PLAYERS].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
    
    for (let i = 0; i < shuffled.length; i++) {
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
      const ai = shuffled[i];
      const aiRef = ref(db, `rooms/${targetRoomId}/players/${ai.id}`);
      await set(aiRef, ai);
      addMessage('system', `${ai.avatar} ${ai.name} 加入了房间`);
    }
  };

  // ========== GAME FUNCTIONS ==========
  const startGame = async () => {
    if (!db || !roomId || players.length < CONFIG.ROOM_SIZE.min) return;
    
    // Update room status
    await update(ref(db, `rooms/${roomId}`), { status: 'playing' });
    
    // Initialize game state
    const theme = roomData?.theme || 'fantasy';
    const arc = STORY_ARCS[theme];
    
    const initScores = {};
    players.forEach(p => { initScores[p.id] = { influence: 0, debates: 0, wins: 0 }; });
    
    await set(ref(db, `games/${roomId}`), {
      round: 1,
      phase: 'debate',
      path: [],
      scores: initScores,
      votes: {},
      story: [{ text: arc.opening, type: 'opening', round: 0 }],
      timerEnd: Date.now() + CONFIG.DEBATE_DURATION * 1000,
      messages: {}
    });
    
    setView('game');
    addMessage('system', `📖 ${arc.name}开始了！`);
    addMessage('system', `📖 第 1/${CONFIG.TOTAL_ROUNDS} 轮 - 辩论阶段开始`);
    
    // Start AI debate
    setTimeout(() => simulateAIDebate(), 3000);
  };

  const simulateAIDebate = () => {
    players.filter(p => p.isAI).forEach((ai, i) => {
      setTimeout(() => {
        const debate = generateAIDebate(ai.style);
        addMessage('chat', debate.text, ai, debate.choice);
      }, (i + 1) * 3000 + Math.random() * 5000);
    });
  };

  const handlePhaseEnd = async () => {
    if (!db || !roomId || !gameState) return;
    
    if (gameState.phase === 'debate') {
      // Switch to voting
      await update(ref(db, `games/${roomId}`), {
        phase: 'vote',
        timerEnd: Date.now() + CONFIG.VOTE_DURATION * 1000,
        votes: {}
      });
      addMessage('system', '🗳️ 投票阶段开始！请选择你支持的选项');
      setMyVote(null);
      
      // AI voting
      players.filter(p => p.isAI).forEach((ai, i) => {
        setTimeout(async () => {
          const choice = Math.random() > 0.5 ? 'A' : 'B';
          await update(ref(db, `games/${roomId}/votes`), { [ai.id]: choice });
        }, (i + 1) * 2000 + Math.random() * 2000);
      });
      
    } else if (gameState.phase === 'vote') {
      // Calculate result
      await calculateResult();
    }
  };

  const calculateResult = async () => {
    if (!db || !roomId || !gameState) return;
    
    const votes = gameState.votes || {};
    const voteCount = { A: 0, B: 0 };
    Object.values(votes).forEach(v => { if (v) voteCount[v]++; });
    
    const total = voteCount.A + voteCount.B;
    const winner = total === 0 ? (Math.random() > 0.5 ? 'A' : 'B') : (voteCount.A >= voteCount.B ? 'A' : 'B');
    
    // Update scores
    const newScores = { ...gameState.scores };
    Object.entries(votes).forEach(([id, v]) => {
      if (v === winner && newScores[id]) {
        newScores[id].influence = (newScores[id].influence || 0) + 30;
        newScores[id].wins = (newScores[id].wins || 0) + 1;
      }
    });
    
    const newPath = [...(gameState.path || []), winner];
    const round = gameState.round;
    
    // Get consequence
    const consequence = getConsequence(round, winner, gameState.path || []);
    const winOpt = getOption(round, winner, gameState.path || []);
    
    // Update story
    const newStory = [
      ...(gameState.story || []),
      { text: `【众人选择】${winOpt?.text}`, type: 'choice', round, winner },
      { text: consequence, type: 'consequence', round }
    ];
    
    addMessage('system', `📜 选项 ${winner} 获胜！(${voteCount[winner]}票 vs ${voteCount[winner === 'A' ? 'B' : 'A']}票)`);
    
    if (round >= CONFIG.TOTAL_ROUNDS) {
      // Game ended
      await update(ref(db, `games/${roomId}`), {
        phase: 'ended',
        scores: newScores,
        path: newPath,
        story: newStory,
        timerEnd: null
      });
      
      addMessage('system', '🏆 编年史完成！');
      
      // Record to GenLayer
      const topPlayer = Object.entries(newScores).sort((a, b) => (b[1].influence + b[1].debates) - (a[1].influence + a[1].debates))[0];
      await recordGameEnd({ theme: roomData?.theme, winner: topPlayer?.[0], path: newPath });
      
      // Update local leaderboard
      const myScore = newScores[player.id] || { influence: 0, debates: 0 };
      const totalScore = (myScore.influence || 0) + (myScore.debates || 0);
      if (player.name && totalScore > 0) {
        const newEntry = { id: Date.now(), name: player.name, avatar: player.avatar, score: totalScore, theme: roomData?.theme, date: new Date().toLocaleDateString() };
        const newLeaderboard = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 50);
        setLeaderboard(newLeaderboard);
        try { localStorage.setItem('consensus_leaderboard', JSON.stringify(newLeaderboard)); } catch {}
      }
    } else {
      // Next round
      const nextRound = round + 1;
      const nextContext = getContext(nextRound, newPath);
      
      await update(ref(db, `games/${roomId}`), {
        round: nextRound,
        phase: 'debate',
        scores: newScores,
        path: newPath,
        story: [...newStory, { text: nextContext, type: 'context', round: nextRound }],
        timerEnd: Date.now() + CONFIG.DEBATE_DURATION * 1000,
        votes: {}
      });
      
      addMessage('system', `📖 第 ${nextRound}/${CONFIG.TOTAL_ROUNDS} 轮 - 辩论阶段开始`);
      setTimeout(() => simulateAIDebate(), 3000);
    }
  };

  // ========== STORY HELPERS ==========
  const getContext = (roundNum, path) => {
    const theme = roomData?.theme || 'fantasy';
    const roundData = STORY_ARCS[theme]?.rounds[roundNum - 1];
    if (!roundData) return '';
    
    if (roundNum > 1 && path.length > 0) {
      const pathKey = path.slice(-2).join('');
      if (roundData[`context${pathKey}`]) return roundData[`context${pathKey}`];
      const lastChoice = path[path.length - 1];
      if (roundData[`context${lastChoice}`]) return roundData[`context${lastChoice}`];
    }
    return roundData.context || '';
  };

  const getOption = (roundNum, choice, path) => {
    const theme = roomData?.theme || 'fantasy';
    const roundData = STORY_ARCS[theme]?.rounds[roundNum - 1];
    return choice === 'A' ? roundData?.a : roundData?.b;
  };

  const getConsequence = (roundNum, choice, path) => {
    const theme = roomData?.theme || 'fantasy';
    const roundData = STORY_ARCS[theme]?.rounds[roundNum - 1];
    if (!roundData) return '';
    
    const option = choice === 'A' ? roundData.a : roundData.b;
    if (path.length > 0) {
      const lastChoice = path[path.length - 1];
      if (option[`consequenceFrom${lastChoice}`]) return option[`consequenceFrom${lastChoice}`];
    }
    if (roundNum === CONFIG.TOTAL_ROUNDS && option.ending) return option.ending;
    return option.consequence || '';
  };

  const getCurrentOptions = () => {
    if (!gameState || !roomData) return { a: null, b: null };
    const theme = roomData.theme || 'fantasy';
    const roundData = STORY_ARCS[theme]?.rounds[(gameState.round || 1) - 1];
    return { a: roundData?.a, b: roundData?.b };
  };

  // ========== MESSAGE FUNCTIONS ==========
  const addMessage = async (type, text, sender = null, choice = null) => {
    if (!db || !roomId) return;
    const msgRef = push(ref(db, `games/${roomId}/messages`));
    await set(msgRef, { type, text, sender, choice, timestamp: Date.now() });
  };

  const submitDebate = async () => {
    if (!debateInput.trim() || gameState?.phase !== 'debate') return;
    
    const choice = debateInput.includes('A') || debateInput.includes('选项A') ? 'A' : 
                   debateInput.includes('B') || debateInput.includes('选项B') ? 'B' : null;
    
    await addMessage('chat', debateInput, { id: player.id, name: player.name, avatar: player.avatar }, choice);
    setDebateInput('');
    
    // Add debate points
    if (gameState?.scores?.[player.id]) {
      await update(ref(db, `games/${roomId}/scores/${player.id}`), {
        debates: (gameState.scores[player.id].debates || 0) + 10
      });
    }
  };

  const submitVote = async (choice) => {
    if (gameState?.phase !== 'vote' || myVote) return;
    setMyVote(choice);
    await update(ref(db, `games/${roomId}/votes`), { [player.id]: choice });
    addMessage('system', `你投票给了选项 ${choice}`);
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRoomId(null);
    setRoomData(null);
    setGameState(null);
    setPlayers([]);
    setMessages([]);
    setMyVote(null);
    setView('home');
  };

  // ========== HELPERS ==========
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const shortAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // ========== RENDER: HOME ==========
  if (view === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#e8e8e8' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📜</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #f472b6, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>共识编年史</h1>
            <p style={{ color: '#8b8b9e', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>Consensus Chronicle</p>
            <p style={{ color: '#a5a5b8', fontStyle: 'italic' }}>共识如何塑造历史？你的选择将改写命运。</p>
          </div>
          
          {/* Wallet Status */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {walletAddress ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(74,222,128,0.2)', borderRadius: '20px', border: '1px solid rgba(74,222,128,0.4)' }}>
                <span style={{ color: '#4ade80' }}>🔗</span>
                <span style={{ color: '#4ade80' }}>{shortAddress(walletAddress)}</span>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={walletConnecting} style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #f472b6, #a78bfa)', border: 'none', borderRadius: '25px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                {walletConnecting ? '连接中...' : '🦊 连接MetaMask'}
              </button>
            )}
          </div>
          
          {!player.name ? (
            <div style={{ maxWidth: '400px', margin: '0 auto 3rem' }}>
              <input type="text" placeholder="输入你的名字开始冒险..." style={{ width: '100%', padding: '1rem 1.5rem', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(167,139,250,0.3)', borderRadius: '12px', color: '#fff', outline: 'none' }} onKeyDown={(e) => e.key === 'Enter' && e.target.value.trim() && setPlayer((p) => ({ ...p, name: e.target.value.trim() }))} />
              <p style={{ marginTop: '0.5rem', color: '#6b6b7e', fontSize: '0.9rem', textAlign: 'center' }}>按 Enter 确认</p>
            </div>
          ) : (
            <>
              {/* Player info */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: 'rgba(167,139,250,0.1)', borderRadius: '50px', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <span style={{ fontSize: '2rem' }}>{player.avatar}</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 600 }}>{player.name}</span>
                  <span style={{ color: '#fbbf24' }}>⭐ {player.exp} EXP</span>
                </div>
              </div>
              
              {/* Entry fee notice */}
              <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1rem', background: 'rgba(251,191,36,0.1)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.3)' }}>
                <p style={{ color: '#fbbf24' }}>⚡ 创建或加入房间需支付 {CONFIG.ENTRY_FEE} GEN 入场费</p>
              </div>
              
              {/* Available rooms */}
              {availableRooms.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#c4b5fd', marginBottom: '1rem' }}>🚪 可加入的房间</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {availableRooms.map(room => (
                      <div key={room.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{STORY_ARCS[room.theme]?.icon}</span>
                          <span>{STORY_ARCS[room.theme]?.name}</span>
                          <span style={{ color: '#8b8b9e' }}>({Object.keys(room.players || {}).length}/{CONFIG.ROOM_SIZE.max})</span>
                        </div>
                        <button onClick={() => joinRoom(room.id)} style={{ padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, #a78bfa, #f472b6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>加入</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Create room */}
              <h2 style={{ fontSize: '1.5rem', color: '#c4b5fd', marginBottom: '1.5rem', textAlign: 'center' }}>选择主题，创建房间</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {Object.entries(STORY_ARCS).map(([key, arc]) => (
                  <button key={key} onClick={() => createRoom(key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>{arc.icon}</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>{arc.name}</span>
                    <span style={{ fontSize: '0.85rem', color: '#6b6b7e', marginTop: '0.5rem' }}>5轮史诗故事</span>
                  </button>
                ))}
              </div>
              
              {/* Leaderboard */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#fbbf24', marginBottom: '1rem' }}>🏆 编年史排行榜</h3>
                {leaderboard.length === 0 ? (
                  <p style={{ color: '#6b6b7e', textAlign: 'center', padding: '2rem' }}>暂无记录</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: index < 3 ? `rgba(251,191,36,${0.2 - index * 0.05})` : 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 700, color: index < 3 ? '#fbbf24' : '#6b6b7e', width: '2rem' }}>#{index + 1}</span>
                        <span style={{ fontSize: '1.5rem' }}>{entry.avatar}</span>
                        <span style={{ flex: 1, color: '#fff' }}>{entry.name}</span>
                        <span style={{ fontWeight: 600, color: '#a78bfa' }}>{entry.score} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ========== RENDER: ROOM ==========
  if (view === 'room') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#e8e8e8' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={resetGame} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#a5a5b8', cursor: 'pointer' }}>← 返回</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
              <span>{STORY_ARCS[roomData?.theme]?.icon}</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{STORY_ARCS[roomData?.theme]?.name}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#6b6b7e' }}>{roomId?.slice(-8)}</span>
          </div>
          
          <h3 style={{ fontSize: '1.1rem', color: '#8b8b9e', marginBottom: '1rem' }}>玩家 ({players.length}/{CONFIG.ROOM_SIZE.max})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {players.map((p) => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', background: p.id === player.id ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.id === player.id ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', position: 'relative' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{p.avatar}</span>
                <span style={{ fontSize: '0.95rem', textAlign: 'center' }}>{p.name}</span>
                {p.isAI && <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: '#3b82f6', borderRadius: '4px' }}>AI</span>}
                {p.id === roomData?.host && <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: '#fbbf24', color: '#000', borderRadius: '4px' }}>房主</span>}
              </div>
            ))}
          </div>
          
          {player.id === roomData?.host && (
            <button onClick={startGame} disabled={players.length < CONFIG.ROOM_SIZE.min} style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', fontWeight: 600, border: 'none', borderRadius: '12px', cursor: players.length >= CONFIG.ROOM_SIZE.min ? 'pointer' : 'not-allowed', background: players.length >= CONFIG.ROOM_SIZE.min ? 'linear-gradient(135deg, #a78bfa, #f472b6)' : 'rgba(255,255,255,0.1)', color: players.length >= CONFIG.ROOM_SIZE.min ? '#fff' : '#6b6b7e' }}>
              {players.length >= CONFIG.ROOM_SIZE.min ? '🎮 开始游戏' : `等待更多玩家 (${players.length}/${CONFIG.ROOM_SIZE.min})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ========== RENDER: GAME ==========
  const currentOptions = getCurrentOptions();
  const votes = gameState?.votes || {};
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', color: '#e8e8e8' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#8b8b9e' }}>第 {gameState?.round || 1} / {CONFIG.TOTAL_ROUNDS} 轮</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {gameState?.phase === 'debate' && '💬 辩论中'}
            {gameState?.phase === 'vote' && '🗳️ 投票中'}
            {gameState?.phase === 'ended' && '🏆 已结束'}
          </div>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: timer <= 10 && gameState?.phase !== 'ended' ? '#f87171' : '#a78bfa' }}>
          {gameState?.phase === 'ended' ? '--:--' : formatTime(timer)}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: '#8b8b9e' }}>我的积分</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24' }}>
            {(gameState?.scores?.[player.id]?.influence || 0) + (gameState?.scores?.[player.id]?.debates || 0)}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: '1rem', padding: '1rem', overflow: 'hidden' }}>
        {/* Left: Story */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', overflowY: 'auto' }}>
            <h3 style={{ color: '#c4b5fd', marginBottom: '1rem', fontSize: '1rem' }}>📜 {STORY_ARCS[roomData?.theme]?.name} - 故事进程</h3>
            {(gameState?.story || []).map((s, i) => (
              <div key={i} style={{ padding: '0.6rem 0', borderBottom: i < (gameState?.story?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                {s.type === 'opening' && <p style={{ color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.7 }}>{s.text}</p>}
                {s.type === 'context' && <p style={{ color: '#fbbf24', lineHeight: 1.7 }}><span style={{ background: 'rgba(251,191,36,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem' }}>第{s.round}轮</span>{s.text}</p>}
                {s.type === 'choice' && <p style={{ color: '#4ade80', lineHeight: 1.7 }}><span style={{ marginRight: '0.5rem' }}>{s.winner === 'A' ? '🅰️' : '🅱️'}</span>{s.text}</p>}
                {s.type === 'consequence' && <p style={{ color: '#a5a5b8', lineHeight: 1.7, paddingLeft: '1.5rem', borderLeft: '2px solid rgba(167,139,250,0.3)' }}>{s.text}</p>}
              </div>
            ))}
          </div>

          {/* Options */}
          {(gameState?.phase === 'debate' || gameState?.phase === 'vote') && currentOptions.a && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>⚔️ 本轮抉择</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[{ key: 'A', opt: currentOptions.a, color: '#ef4444' }, { key: 'B', opt: currentOptions.b, color: '#3b82f6' }].map(({ key, opt, color }) => (
                  <div key={key} onClick={() => gameState?.phase === 'vote' && submitVote(key)} style={{ padding: '1rem', borderRadius: '10px', border: `2px solid ${myVote === key ? color : `${color}40`}`, background: `${color}15`, cursor: gameState?.phase === 'vote' ? 'pointer' : 'default', transition: 'all 0.3s', transform: myVote === key ? 'scale(1.02)' : 'scale(1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color }}>选项 {key}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#a5a5b8' }}>{opt?.tag}</span>
                    </div>
                    <p style={{ lineHeight: 1.5, fontSize: '0.9rem', color: '#e8e8e8' }}>{opt?.text}</p>
                    {gameState?.phase === 'vote' && (
                      <div style={{ marginTop: '0.8rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 600, color: '#fbbf24' }}>
                        {Object.values(votes).filter(v => v === key).length} 票
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* End screen */}
          {gameState?.phase === 'ended' && (
            <div style={{ background: 'linear-gradient(145deg, rgba(251,191,36,0.1), rgba(167,139,250,0.1))', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#fbbf24' }}>🏆 编年史完成！</h2>
              <div style={{ maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                {Object.entries(gameState?.scores || {}).map(([id, score]) => ({ player: players.find(p => p.id === id), total: (score.influence || 0) + (score.debates || 0) })).sort((a, b) => b.total - a.total).map((rank, i) => (
                  <div key={rank.player?.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', marginBottom: '0.4rem', background: i === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 700, color: i < 3 ? '#fbbf24' : '#6b6b7e', width: '1.5rem' }}>#{i + 1}</span>
                    <span style={{ fontSize: '1.3rem' }}>{rank.player?.avatar}</span>
                    <span style={{ flex: 1, color: '#fff' }}>{rank.player?.name}</span>
                    <span style={{ fontWeight: 600, color: '#a78bfa' }}>{rank.total} pts</span>
                  </div>
                ))}
              </div>
              <button onClick={resetGame} style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #a78bfa, #f472b6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>返回大厅</button>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', background: votes[p.id] ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '15px', fontSize: '0.8rem', border: votes[p.id] ? '1px solid rgba(74,222,128,0.4)' : '1px solid transparent' }}>
                <span>{p.avatar}</span>
                <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {votes[p.id] && <span style={{ color: '#4ade80', fontWeight: 700 }}>{votes[p.id]}</span>}
              </div>
            ))}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                {msg.type === 'system' ? (
                  <div style={{ color: '#a78bfa', fontStyle: 'italic', padding: '0.3rem 0' }}>{msg.text}</div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem 0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>{msg.sender?.avatar} {msg.sender?.name}</span>
                      {msg.choice && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: msg.choice === 'A' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)', borderRadius: '4px' }}>支持{msg.choice}</span>}
                    </div>
                    <div style={{ color: '#e8e8e8' }}>{msg.text}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {gameState?.phase === 'debate' && (
            <div style={{ padding: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" value={debateInput} onChange={(e) => setDebateInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitDebate()} placeholder="输入你的观点..." style={{ flex: 1, padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                <button onClick={submitDebate} style={{ padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #a78bfa, #f472b6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>发送</button>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button onClick={() => setDebateInput('我支持选项A，因为')} style={{ padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '15px', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>🅰️ 支持A</button>
                <button onClick={() => setDebateInput('我支持选项B，因为')} style={{ padding: '0.3rem 0.6rem', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '15px', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer' }}>🅱️ 支持B</button>
              </div>
            </div>
          )}
          
          {gameState?.phase === 'vote' && !myVote && (
            <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(167,139,250,0.1)' }}>
              <p style={{ color: '#fbbf24', fontWeight: 600 }}>⏰ 请在左侧选择你支持的选项！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
