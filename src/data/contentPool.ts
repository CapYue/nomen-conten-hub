export interface ContentTopic {
  id: number;
  title: string;
  coverPrompt: string;
  bodyText: string;
  tags: string[];
  status: 'planned' | 'drafted' | 'generated' | 'published' | 'review';
  scheduledDate?: string;
  coverImageUrl?: string;
  xiaohongshuId?: string;
  notes?: string;
  month?: string; // e.g. "2026-04"
  generatedAt?: string;
  publishedAt?: string;
}

export const TOPIC_POOL: ContentTopic[] = [
  {
    id: 1,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575526_a2187201.png',
    title: '蒙古包门为何总是朝南？',
    coverPrompt: 'A traditional Mongolian yurt (ger) on vast green grassland, door facing south toward warm sunlight, blue sky with white clouds, cinematic documentary photography, golden hour light, ultra-wide angle, 9:16 vertical format for social media',
    bodyText: `🔓 草原上的密码 | 蒙古包的门为什么朝南？

很多人第一次住进草原
都会问我这个问题

✅ 答案很简单：
蒙古包的门朝南，是一场关于生存的浪漫设计

1.
北风凛冽，北方是西伯利亚寒流的方向
门朝南，刚好把寒风挡在身后
牧民不需要暖气，靠的是这个"被动技能"

2.
阳光从早到晚都能照进包里
冬天暖阳进包，夏天凉风穿堂
一开门就是整片草原

3.
蒙古包里最重要的位置是"火撑子"（炉子）
正对着门，朝南开门，火力不被打散
这是蒙古族火文化的核心

---
游牧几千年
不是"随便住住"
是把整个草原的气候、地形、光照
都读进了这个圆里

下次你来草原
记得在日落前走进一顶蒙古包
摸摸北边的毛毡——冰的
看看南边的门——光涌进来的地方

#游牧文化 #蒙古包 #草原生活 #内蒙古 #民族文化`,
    tags: ['建筑文化', '生活智慧', '必火选题'],
    status: 'published',
    month: '2026-04'
  },
  {
    id: 2,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575547_f7503a4c.png',
    title: '勒勒车：游牧文明的活化石',
    coverPrompt: 'Traditional Mongolian cart (lele cart) on vast grassland, handcrafted wooden wheels, pulled by cattle, Mongolian nomad in traditional deel clothing walking alongside, sunset golden light, cinematic documentary style, 9:16 vertical',
    bodyText: `🌿 游牧文明的活化石 | 勒勒车

在草原上
有一种声音比风声还老

"吱呀——吱呀——"
那是勒勒车在说话

---
【什么是勒勒车】

勒勒车，蒙古语叫"Tchelome"
是蒙古族用了上千年的交通工具

它的轮子比我还高
不用一颗铁钉
全靠榫卯结构咬合

---
【为什么叫"活化石"】

考古队在红山文化遗址里
就挖到过勒勒车的痕迹

那时候没有GPS
牧民跟着草走，车跟着牧民走
车辙到哪里，文明就到哪里

---
【它现在还在用吗】

少了。
但在内蒙的一些牧区
它没有消失

牧民搬家的时候用它
祭祀敖包的时候用它
娶媳妇的时候——它还要走在最前面

---
草原上没有铁路
牧民搬家靠的不是地图
是经验和记忆

勒勒车就是这段记忆的轨道

#游牧文化 #勒勒车 #蒙古族 #草原生活 #非遗传承`,
    tags: ['交通工具', '非遗', '历史文化'],
    status: 'published',
    month: '2026-04'
  },
  {
    id: 3,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575571_4d004d78.png',
    title: '草原最温柔的信物——哈达',
    coverPrompt: 'Two Mongolian elders presenting a blue Hada (ceremonial scarf) to a young nomad, warm golden interior of a yurt, respectful atmosphere, documentary photography, soft natural light, 9:16 vertical format',
    bodyText: `💙 草原最温柔的信物 | 哈达

在草原上
有一条布
比金子还贵重

它不是衣服
不是装饰品
却承载着草原人所有的情感

---
【什么是哈达】

哈达，是蒙古族和藏族人民
在社交礼仪中使用的丝巾

白色最常见
蓝色是内蒙古草原的专属
五彩哈达，是献给菩萨的

---
【怎么献，有规矩】

✅ 双手捧起，弯腰献上
✅ 献哈达时，长辈在前，晚辈在后
✅ 接哈达的人，要以同样的姿势接过
✅ 哈达不能随便扔，不能踩

这不是形式
这是草原人表达尊重的方式

---
【哈达里藏着什么】

哈达的本意是"洁白的丝"
但草原人给了它更重的意义：

它代表一条无形的路
连接着献者与接者的心

拿到哈达的人
不是收了一份礼物
而是承接了一段关系

---
下次有人送你哈达
记得：
接住的不只是布
是整片草原的信任

#蒙古族文化 #哈达 #草原礼仪 #民族文化`,
    tags: ['礼仪文化', '情感故事', '必火选题'],
    status: 'review',
    month: '2026-04',
  },
  {
    id: 4,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575591_8e518c29.png',
    title: '草原上的"移动厨房"：牧民一日三餐都吃什么？',
    coverPrompt: 'Mongolian nomad woman in traditional clothing preparing food inside a yurt, cast iron pot over open fire, steam rising, warm golden light, rustic wooden table with dairy products, documentary photography, 9:16 vertical',
    bodyText: `🍵 草原上的"移动厨房"：牧民吃什么？

很多人问我
"草原上没超市，你们吃什么？"

答案是：
草原上什么都有
只是不是你想的那样

---
【早餐：奶茶+炒米】

牧民的早晨
从一锅咸奶茶开始

蒙古族人每天要喝三锅茶
锅里放砖茶、牛奶、盐
泡着炒米、肉干、奶豆腐

这锅茶，一个人喝一天

---
【午餐：手把肉']

手把肉
是草原上最硬核的一餐

水煮羊肉，熟了直接上手
不切，不炒，不过油
就这一招，草原牧民吃了几千年

好羊，不需要调料

---
【晚餐：面条或饺子】

晚上天气凉
牧民会煮面条汤或饺子
驱寒、暖胃、补充体力

---
【草原上没有的东西】

❌ 白米饭（草原不产稻米）
❌ 新鲜蔬菜（气候不允许）
✅ 但有羊肉、牛奶、奶制品

游牧民族的饮食智慧：
吃什么，取决于脚下这片土地长什么

#草原美食 #游牧生活 #蒙古族饮食 #牧民生活`,
    tags: ['美食文化', '生活记录', '猎奇选题'],
    status: 'generated',
    month: '2026-04',
    scheduledDate: '2026-04-14'
  },
  {
    id: 5,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575629_f5559d52.png',
    title: '蒙古袍：穿在身上的草原美学',
    coverPrompt: 'Mongolian elder woman and young girl wearing traditional Mongolian deel (national costume), intricate embroidery details on the clothing, standing on grassland with mountains behind, golden hour photography, cultural portrait, 9:16 vertical',
    bodyText: `👘 蒙古袍：草原上最古老的"高定"

在草原上
判断一个人的身份
不用看脸
看她的袍子就够了

---
【蒙古袍的结构】

蒙古袍可不是一块布缝起来的

✅ 宽大的袖子——骑马时护手
✅ 高高的腰带——固定重心不散
✅ 绣花边——每一针都是家族徽章
✅ 两侧开衩——方便骑马、方便走路

这不是裁缝设计出来的
是马背上的生活雕琢出来的

---
【颜色即语言】

🟢 绿色——草原，年轻人常穿
🔵 蓝色——天空，婚嫁时穿
⚪ 白色——白云，过年过节穿
🔴 红色——太阳，新娘专属

---
【现在还穿吗】

在内蒙古
蒙古袍是法定节日服装

那达慕、婚丧嫁娶、祭祀敖包
草原人都会穿上袍子

穿上的那一刻
人就不一样了
走路有风，站里有根

---
一件蒙古袍
就是一部草原文明的微型史记

#蒙古袍 #民族服饰 #草原美学 #非遗文化 #穿搭`,
    tags: ['服饰文化', '美学', '易火选题'],
    status: 'generated',
    month: '2026-04',
    scheduledDate: '2026-04-18'
  },
  {
    id: 6,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575652_43a082a9.png',
    title: '马头琴：草原上最悲伤的乐器',
    coverPrompt: 'Mongolian musician playing the morin khuur (horsehead fiddle) inside a yurt, horse carved at the top of the instrument, warm firelight illuminating the musicians face, emotional atmosphere, documentary photography, 9:16 vertical',
    bodyText: `🎻 草原上最悲伤的乐器 | 马头琴

传说
一匹白马死后
主人用它的皮、它的骨、它的弦
做成了这把琴

从此
每一个拉响马头琴的人
都在为那匹马唱一首永不结束的歌

---
【什么是马头琴】

马头琴，蒙古语叫"Morin Khuur"
意思是"有马的琴"

它的琴头是一匹马的雕刻
两根弦，用马尾制成
声音低沉、苍凉、悠长

---
【马头琴难学吗】

难。
不是难在技巧
是难在你能不能安静下来

拉马头琴的人
手要动，心要静
草原的辽阔
就藏在这份动静之间

---
【听过马头琴演奏的人说】

"我不懂音乐
但我听懂了马头琴的声音里
有一整片草原在呼吸"

#马头琴 #蒙古族乐器 #非遗传承 #草原音乐 #内蒙古`,
    tags: ['音乐文化', '非遗', '情感深度选题'],
    status: 'generated',
    month: '2026-04',
    scheduledDate: '2026-04-21'
  },
  {
    id: 7,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575704_a185140c.png',
    title: '游牧民族：为什么他们不停搬家？',
    coverPrompt: 'Mongolian nomad family packing up a yurt and loading it onto a truck, grassland stretching to horizon under dramatic sky, migration scene, epic documentary photography, golden hour, 9:16 vertical format',
    bodyText: `🏕️ 游牧民族：为什么我们总在搬家？

很多人问我：
"你们总搬家，不累吗？"

答案是：
累，但这是草原给我们的生存法则

---
【不是想搬家，是必须搬】

一片草原
养一群羊，够一个月
养一群羊，再一个月——草就没了

草没了
羊就没得吃
羊没了
人就没法活

所以：
不是"搬家"
是"跟着草走"

---
【搬家有规矩】

草原上的搬家不是随机的

✅ 每年6月，去夏营地——那里草最绿
✅ 每年9月，去秋营地——准备过冬
✅ 每年11月，去冬营地——避风、保暖
✅ 每年3月，回春营地——迎接新生

四季轮转
牧场是草原人的日历

---
下次有人问你"你们怎么总搬家"
你就告诉他：
"不是我们离开了草原
是草原教会我们跟着它走"

#游牧文化 #草原生活 #牧民智慧 #生活方式`,
    tags: ['生活方式', '文化解读', '深度选题'],
    status: 'generated',
    month: '2026-04',
    scheduledDate: '2026-04-25'
  },
  {
    id: 8,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775575724_452ea268.png',
    title: '草原禁忌：这些事在草原上绝对不能做',
    coverPrompt: 'Sacred Mongolian Oboo (shamanistic stone cairn) on hilltop with white scarves and offerings, dramatic clouds, wide grassland vista, spiritual atmosphere, respectful documentary style, 9:16 vertical',
    bodyText: `⚠️ 草原禁忌：这些事，草原上绝对不能做

草原是有规矩的地方
你不了解，不是不守的借口

---
【关于火】

❌ 不能往火里扔脏东西
❌ 不能用刀子拨火
❌ 不能在火旁吵架

蒙古族认为火是神圣的
火是家庭的守护神
污染火＝污染家的根基

---
【关于敖包】

❌ 不能在敖包附近大小便
❌ 不能带走敖包上的石头
❌ 必须顺时针绕敖包

敖包是草原人心中的"神山"
绕敖包，是和天地说话

---
【关于水】

❌ 不能在河流里洗脏衣服
❌ 不能浪费水
❌ 不能在泉边大小便

草原的水源稀缺
每一条河、每一口泉
都是牧民的生命线

---
草原规矩的本质：
不是繁文缛节
是对这个家、这片土地的敬畏

#草原禁忌 #蒙古族文化 #草原礼仪 #旅行必读 #文化尊重`,
    tags: ['文化禁忌', '知识科普', '必火选题'],
    status: 'generated',
    month: '2026-05',
    scheduledDate: '2026-05-01'
  },
  {
    id: 9,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775577125_87a3da0b.png',
    title: '草原日出：牧民凌晨四点起床做什么？',
    coverPrompt: 'Spectacular sunrise over vast Mongolian grassland, first light breaking over the horizon, traditional yurt silhouettes, horses grazing in foreground, morning mist, epic landscape photography, 9:16 vertical',
    bodyText: `🌅 草原日出：凌晨4点，牧民已经在忙了

很多城市人觉得草原生活很慢
其实草原的早晨，比城市还早

---
【凌晨4:00 挤牛奶】

天刚蒙蒙亮
草原妈妈已经提着桶出门了

奶牛一晚上的奶
必须在太阳升高前挤完
温度一高，奶就不好保存了

---
【5:00 放马】

马是草原上最自由的动物
但"自由"也需要管理

牧马人要在太阳出来前
把马群赶到草场上
让它们吃带着露水的第一口草

露水的草——最甜

---
【6:00 奶茶煮好】

人回家时
锅里的咸奶茶已经咕嘟了

早餐很简单：
奶茶、炒米、几块羊肉

但这顿饭
是一家人一天里唯一能坐在一起的时间

---
草原的早晨教会我们：
被责任和光叫醒
是比闹钟更自然的事

#草原生活 #牧民日常 #日出 #真实记录 #内蒙古`,
    tags: ['日常记录', '真实故事', '生活美学'],
    status: 'generated',
    month: '2026-05',
    scheduledDate: '2026-05-05'
  },
  {
    id: 10,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775577221_90b1ef34.png',
    title: '蒙古族孩子的童年：骑马、摔跤、射箭',
    coverPrompt: 'Mongolian children in traditional clothing practicing archery on grassland, young boy drawing a traditional Mongolian bow, intense concentration, dramatic sky, documentary photography, 9:16 vertical',
    bodyText: `🏇 蒙古族孩子的童年：骑马、摔跤、射箭

内蒙古有句老话：
"草原男儿三艺：骑马、摔跤、射箭"

这三样
是蒙古族男孩成年的"考试"

---
【骑马】

蒙古族孩子3岁上马
5岁会骑
10岁已经能在马背上射箭了

马不是工具
是草原孩子第一个"朋友"

---
【摔跤】

蒙古式摔跤叫"搏克"
没有重量级之分
上场就是一对一的较量

草原孩子的摔跤场是草地
真正的裁判是太阳

---
【射箭】

蒙古式射箭
射程远、力道大
需要整个身体一起发力

孩子拉弓的那一刻
腰背挺直，目光如炬
像极了成年礼

---
文化会变
但根里的东西不会消失

#草原孩子 #蒙古族 #骑马 #摔跤 #非遗 #童年`,
    tags: ['儿童成长', '民族文化', '情感选题'],
    status: 'generated',
    month: '2026-05',
    scheduledDate: '2026-05-10'
  },
  {
    id: 11,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775577256_9e76f416.png',
    title: '草原深夜电台：蒙古长调的千年叹息',
    coverPrompt: 'Silhouette of Mongolian singer on hilltop under starlit sky, mouth open in traditional long song style, vast grassland at night, moonlight illumination, melancholic atmospheric photography, 9:16 vertical',
    bodyText: `🎶 草原深夜电台：蒙古长调的千年叹息

有一种声音
你听了之后
会想起家

即使你从来没有家

---
【什么是蒙古长调】

蒙古长调，蒙古语叫"乌日汀道"
2006年被列入中国非物质文化遗产

它的特点是：
旋律悠长、自由、辽阔
一个人在草原上唱
声音能传到十里之外

---
【长调里有什么】

长调唱的是：
草原、母亲、马、羊
离别、思念、孤独、自由

歌词简单，旋律不简单
一个蒙古长调歌手
要练10年才能开口

---
【为什么在深夜听最好】

草原的夜
没有光污染
抬头是整条银河

这时候
长调响起
人和草原
就融为一体了

#蒙古长调 #草原音乐 #非遗 #深夜电台 #内蒙古 #民谣`,
    tags: ['音乐文化', '非遗', '情感深度选题', '必火'],
    status: 'generated',
    month: '2026-05',
    scheduledDate: '2026-05-15'
  },
  {
    id: 12,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775577368_c8f3481e.png',
    title: '敖包：草原上最浪漫的许愿石堆',
    coverPrompt: 'Sacred Mongolian Oboo (cairn) on hilltop draped with white silk scarves (hadags), offerings of coins and vodka bottles around base, dramatic cloudy sky, vast panorama of grassland below, spiritual landscape photography, 9:16 vertical',
    bodyText: `⛰️ 敖包：草原上最浪漫的许愿石堆

在草原上
最神秘的地方
不是寺庙
是石头堆

它叫敖包
是草原人祭天、祭地、祭祖先的地方

---
【敖包是怎么来的】

很久以前
草原上没有路标
牧民在交通要道上堆石头
作为方向的标记

后来，这些石头堆
有了神灵的意义
牧民路过会投一块石头
表示敬畏

就这样
路标变成了神堆

---
【敖包祭：每年农历五月】

每年五月十三
草原人会举行盛大的"祭敖包"

仪式包括：
✅ 绕敖包顺时针走三圈
✅ 往敖包上添石头
✅ 献哈达、献奶酒、献食物
✅ 在敖包前许愿

---
我外婆年年祭敖包
她许的愿望从来没有"说出口"

但她每次祭完
都会多挤一桶牛奶
给路过的人倒一碗

#敖包 #蒙古族 #草原信仰 #非遗 #祭祀文化 #内蒙古`,
    tags: ['信仰文化', '非遗', '神秘选题'],
    status: 'generated',
    month: '2026-05',
    scheduledDate: '2026-05-20'
  },
  {
    id: 13,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775577438_324169a3.png',
    title: '草原限定皮肤：那些只有蒙古族才有的节日',
    coverPrompt: 'Grand Naadam festival scene in Mongolian grassland, traditional wrestling matches, spectators in colorful traditional clothing, festive atmosphere, dramatic sky, cultural celebration documentary, 9:16 vertical',
    bodyText: `🎉 草原限定皮肤：那些只有蒙古族才有的节日

草原的日历
不是1月到12月
是牧民节日串起来的

---
【那达慕大会】 ⭐最强必火选题

那达慕，蒙古语意思是"游戏"或"运动会"
是内蒙古最盛大的节日

每年7-8月举行
"男儿三艺"：骑马、摔跤、射箭
全部上演

万人云集，帐篷连城
这是草原上最热闹的时刻

---
【白月节（春节）】

蒙古族的春节叫"查干萨尔"
意思是"白月"

🈷️ 正月初一
🈷️ 穿新袍、祭火神
🈷️ 给长辈敬酒、磕头拜年

---
【马奶节】

每年农历6月
草原开始挤马奶

牧民们举行仪式
感谢天、地、马的赐予

马奶酒，是草原最珍贵的礼物

#那达慕 #蒙古族节日 #草原生活 #非遗 #内蒙古 #节日文化`,
    tags: ['节日文化', '必火选题', '节庆'],
    status: 'generated',
    month: '2026-06',
    scheduledDate: '2026-06-01'
  },
  {
    id: 14,
    coverImageUrl: 'https://cdn.hailuoai.com/mcp/image_tool/output/497206279961952259/385081437774345/1775577474_9a093ecd.png',
    title: '我在呼伦贝尔草原生活的30天',
    coverPrompt: 'Young woman on horseback at sunset on vast Hulunbuir grassland, yellow wheat fields meeting blue sky, flowing river in background, epic landscape portrait, nomadic romance aesthetic, cinematic photography, 9:16 vertical',
    bodyText: `🌿 我在呼伦贝尔草原生活的30天

这是我的亲身故事
如果你对草原有向往
这个故事是写给你的

---
【第1天：到达】

从海拉尔机场出来
第一口空气是凉的、干的、有草的味道

我以为草原是一片荒
结果是一片绿到天边的海

---
【第7天：第一次骑马】

我骑的马叫"小灰"
性子慢，但有脾气

马跑起来的时候
我差点哭出来
原来人的身体可以这么轻

---
【第15天：第一次住蒙古包】

没有空调、没有wifi
晚上冷到把被子裹在身上

但早晨醒来
看到阳光从蒙古包的天窗照下来
照在被子上
照在我脸上

那一刻，我突然理解了
为什么草原人那么爱这片土地

---
【第30天：离开】

离开那天
我回头看了一眼蒙古包

它还在那里
风吹过，草原起了波浪

我说：明年还来

#呼伦贝尔 #草原生活 #真实故事 #旅行 #生活方式 #内蒙古`,
    tags: ['旅行故事', '个人经历', '爆款选题'],
    status: 'generated',
    month: '2026-06',
    scheduledDate: '2026-06-10'
  }
];
