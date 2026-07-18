// pages/coc7-gen/coc7-gen.js — COC7 调查员创建工具
// ============================================================
// 数据来源：COC7空白卡CY2lusFinal (1).xlsx 分析结果
// 注意：所有角色数据仅保存到手机本地（wx.setStorageSync）
// ============================================================

// ---------- 分类标签 ----------
const CAT_LABELS = {
  investigate: { label: '🔍 调查', idx: 0 },
  social:      { label: '💬 交涉', idx: 1 },
  combat:      { label: '⚔️ 战斗', idx: 2 },
  special:     { label: '🎪 特技', idx: 3 },
  support:     { label: '🩹 支援', idx: 4 },
  knowledge:   { label: '📚 学问', idx: 5 },
};
const CAT_ORDER = ['investigate','social','combat','special','support','knowledge'];

// ---------- 全部技能数据（含分类、基础值、说明） ----------
// 说明文本来源于 COC7空白卡CY2lusFinal 附表
const ALL_SKILLS = [
  { name: '会计', base: 5, cat: 'investigate' , desc: '· 使你理解会计工作的流程以及一个企业或者个人的金融职务。\n\n· 通过检查账簿，你可以发现做假账的员工，对资金的偷偷挪用，对行贿或者敲诈的款项支付，以及经济状况是否比表面陈述的更好或者更差。\n\n· 通过仔细检查旧账户，你可以了解过去的资金的得与失（谷物，奴隶贸易，威士忌酒的运营等）以及这些资金是付给了谁以及为了什么款项而支付。'  },
  { name: '人类学', base: 1, cat: 'investigate' , desc: '· 使使用者能够通过观察来辨认和理解一个人的生活方式。\n\n· 如果技能使用者持续观察一个其他的文化一段时间，或者在有着关于某种已消失文化的正确资料环境下工作，那么他可以对文化方式以及道德习惯进行简单的预测，即使证据可能并不完整。\n\n· 通过学习文化一个月或者更久，人类学家开始理解这种文化是如何运作的以及，如果结合心理学，可以预测那些研究文化的行为和信仰。'  },
  { name: '估价', base: 5, cat: 'investigate' , desc: '· 用来估计某种物品的价值，包括质量，使用的材料以及工艺。\n\n· 相关的，技能使用者可以准确地辨认出物品的年龄，评估它的历史关联性以及发现赝品。'  },
  { name: '考古学', base: 1, cat: 'investigate' , desc: '· 允许从过去的文化中鉴定一件古董的年代以及辨别它，以及可以用来发现赝品。\n\n· 使获得建立以及开掘一个挖掘遗址的专业知识。\n\n· 通过对遗址的勘察，使用者可以推断留下这遗址的生物的目的和生活方式。\n\n· 人类学可能对此会有所帮助。\n\n· 考古学还有助于辨认已消失的人类语言的书面形式。'  },
  { name: '侦查', base: 25, cat: 'investigate' , desc: '· 这项技能允许使用者发现密门或者秘密隔间，注意到隐藏的闯入者，发现并不明显的线索，发现重新涂过漆的汽车，意识到埋伏，注意到鼓出的口袋，或者任何类似的事情\n\n· 对于调查员来说，这是一个很重要的技能。\n\n· 如果一名角色仅有很短的时间来进行侦查，例如飞奔经过对方时，KP可能会提升难度等级\n\n· 如果一名角色正在进行一场完整的调查，那么KP也许会允许一个自动成功\n\n· 这项技能的难度等级同样也会环境的情况来调整，在一个杂乱的房间中进行侦查将会更加困难'  },
  { name: '聆听', base: 20, cat: 'investigate' , desc: '· 此技能是衡量一名调查员理解声音的能力，包括偶然听到的对话，一扇关着的门后的轻声嘀咕，以及咖啡厅里的私语\n\n· KP可以用这来决定一场即将发生的遭遇的形式：比如你注意到了被踩碎的树枝的声音而警觉到可能遇到什么人\n\n· 此外，一个较高的聆听技能可以理解为一名角色有着较高的警觉能力\n\n· 当某人正在悄悄接近你时，聆听的对抗技能为潜行'  },
  { name: '追踪', base: 10, cat: 'investigate' , desc: '· 调查员可以使用追踪技能来辨认土壤上的脚印、穿过植被时留下的痕迹之类的来追踪人、动物、或交通工具\n\n· 时间的经过、雨水的冲刷、以及土地的质感都可能会影响追踪的难度等级'  },
  { name: '图书馆使用', base: 20, cat: 'investigate' , desc: '· 图书馆使用使一名调查员能在图书馆找到一些信息，例如特定的一本书，新闻或者参考书，搜集文件或者资料库，假设需要的东西确实在那里的话。\n\n· 使用这个技能需要数小时的连续的调查\n\n· 这项技能可以定位寻找一件隐藏的案例或者一本特殊收藏的稀有书籍，但是可能会需要说服，话术，取悦，恐吓，信用评级，或者特殊的证明书来获得阅读这书或者信息的许可'  },
  { name: '计算机使用', base: 5, cat: 'investigate' , desc: '· 这项技能允许调查员用各种不同的电脑语言进行编程、恢复或者分析隐藏的数据、解除被加了保护的系统、探索一个复杂的网络、或者发现别人的骇入、后门程序、病毒。\n\n· 对电脑系统的特殊操作可能会需要这个检定。\n\n· 互联网将大量的信息放置在了调查员的指尖上。使用互联网来找到高度详细以及/或模糊不清的咨询可能会需要一个计算机使用和图书馆使用的组合检定。\n\n· 这项技能在用电脑上网，检查电子邮件，或者运行一般的商品化软件时不需要使用。'  },
  { name: '信用评级', base: 0, cat: 'investigate' , desc: '· 衡量了调查员表现出来的富裕程度以及经济上的自信度\n\n· 信用评级可以被用来取代APP来评估第一印象\n\n※ 信用评级并不是一个被用于评估经济富裕度的技能，也不应该与其他技能挂钩\n\n· 每个职业有着起始的信用评级范围，并且应当花费技能点来达到这个评级范围内\n\n· 一名调查员的信用评级可以随着时间而改变。\n\n· 调查员的克苏鲁神话技能有着易于疯狂的倾向，而这个技能可能导致失业并因此变成一个更低的信用评级'  },
  { name: '克苏鲁神话', base: 0, cat: 'investigate' , desc: '· 这项技能反应了对非人类（洛夫克拉夫特的）克苏鲁神话的了解\n\n· 这个技能并不像学术技能一样建立在知识的积累之上，它像是“哪些是人类不该知道的”，克苏鲁神话是与人类的理解相对立的，并且接触它将会侵蚀人类的理智\n\n· 没有调查员能在初始技能设定时给克苏鲁神话加点（除非被KP同意）\n\n· 成功的使用克苏鲁神话技能并不会提供给调查员在这个技能百分比上的提升\n\n· 当克苏鲁神话点数上升，它将减少理智上限，并且使得调查员变得脆弱\n\n· 每当神话生物的足迹或者其他证据被发现，一个成功的克苏鲁神话检定可以允许调查员辨认出这个神话生物，推测出有关它行为的一些资讯，或者猜测出它所拥有的某些特性。\n\n· 一个成功的克苏鲁神话检定也可能允许调查员回想起一些关于神话的真实，通过看见咒语的施展来辨认出它，回想起克苏鲁书卷中详细的咒语或者部分的信息，或者完成一些其他的任务。\n\n· 克苏鲁神话技能也可以被用来展现出魔法的“咒语一样的”效果。'  },
  { name: '锁匠', base: 1, cat: 'investigate' , desc: '· 锁匠技能可以打开车门，短路电线来发动汽车，用铁撬撬开图书馆的窗子，解决中国机关箱，以及穿过常规的商用警报系统\n\n· 使用者可能学会过修锁、配钥匙，或者使用万能钥匙、特殊工具打开锁\n\n· 打开一个特别困难的锁可能会需要一个更高的难度等级'  },
  { name: '妙手', base: 10, cat: 'investigate' , desc: '· 允许对物体进行视觉上的遮住，藏匿，或者掩盖，也许通过残害，衣服或者其他的干涉或促成错觉的材料，也许通过使用一个秘密的嵌板或者隔间\n\n· 任何种类的巨大物件应当增加藏匿的难度\n\n· 妙手包括偷窃，卡牌魔术，以及秘密使用手机'  },
  { name: '导航', base: 10, cat: 'investigate' , desc: '· 允许使用者在任何时间与任何天气中辨认行进的方向\n\n· 拥有高导航技能的人会非常熟练的使用天文图标工具、定位工具、GPS设备\n\n· 这项技能可以用来测绘某个区域的地图（制图学），判断一个区域或一个岛屿的面积，如果拥有现代工具可以降低难度等级或取消检定\n\n· KP可以暗骰这个技能的检定\n\n· 如果他非常熟悉这个地区，那么可以在检定中增加一个奖励骰'  },
  { name: '话术', base: 5, cat: 'social' , desc: '· 话术特别限定于言语上的哄骗，欺骗以及误导，例如迷惑一名门卫来让你进入一间俱乐部，让某人在一张他还没有读的文件上签字，误导警察看向另一边，以及诸如此类的\n\n· 这项技能的对立技能为心理学或者话术。经过一段时间的相信期后（通常在使用话术的人离开场景之后），对方会意识到自己被欺骗了\n\n· 话术的效果总是暂时性的，尽管如果达成了更高的难度等级可能会使这个效果更加长一点\n\n· 可以被用来对一件物品或者服务的价格进行砍价\n如果成功，卖家会暂时性地觉得这是一场不错得交易。然而，如果买家打算归还或者试图购买别的物品，卖家可能会拒绝继续提供降价，并且甚至可能会提高价格为了补回他们在上一次交易中所造成的损失。'  },
  { name: '说服', base: 10, cat: 'social' , desc: '· 使用说服来通过一场有理有据的论述、争辩以及讨论让目标相信一个确切的想法，概念，或者信仰\n\n· 说服并不一定需要涉及真实的内容\n\n· 成功的说服技能的运用将花费不少的时间：至少半小时。如果你想快速地说服某人，你应该使用话术技能\n\n· 取决于玩家表述的目标，如果调查员花费了足够的时间，说服造成的影响可能一直持续下去，并且无意识地影响着别人\n\n· 可能会持续好几年，直到某件事件或者另一次得说服改变了目标的想法\n\n· 说服可以被用于讨价还价，以此来削低某样物品或者服务的价格\n\n· 如果成功，卖家将会完全地相信自己做了一场好买卖'  },
  { name: '恐吓', base: 15, cat: 'social' , desc: '· 恐吓可以以许多形式使用，包括武力威慑，心理操控，以及威胁\n\n· 这通常被用来使某人害怕，并迫使其进行某种特定的行为\n\n· 恐吓的对抗技能为恐吓或者心理学\n\n· 携带武器或者其他的有力的威胁或诱因来协助恐吓可能可以降低难度等级\n\n· 恐吓可以被用于降低一件物品或者服务的价格\n如果成功，卖家可能会降低价格，或者免费交出，但是根据情况，对方可能会将这事情举报给警察或者当地犯罪组织的成员\n\n一个非常需要注意的事情是对恐吓进行孤注一掷意味着将事物推到极限。\n这可能包括数日的审讯，或者将一把枪指着对方的脑袋来下达最后通牒。无论是哪一种，孤注一掷的结果为要么为得到了你想要的情报，要么对该场合下造成的结果予以偿还'  },
  { name: '取悦', base: 15, cat: 'social' , desc: '· 取悦允许通过许多形式来使用，包括肉体魅力、诱惑、奉承或是单纯令人感到温暖的人格魅力。\n\n· 取悦可能可以被用于迫使某人进行特定的行动，但是不会是与个人日常举止完全相反的行为。\n\n· 取悦或是心理学技能可以用于对抗取悦技能。\n\n· 取悦技能可以被用于讨价还价来使一件物品或者服务的价格降低。如果成功，使用者得到了卖家的赞同，并且他们可能乐意降低一点价格。'  },
  { name: '乔装', base: 5, cat: 'social' , desc: '· 使用在当你想要演出除你自己外的别人时。\n\n· 使用者改变了态度，习惯，以及/或声音来进行一个乔装，以另一个人或者另一类人的形象出现。\n\n· 戏剧化妆品可能会有所帮助，还有伪造的身份证。\n\n· 这项技能有着明显的两个方向：要么你试图隐瞒你的真实身份（例如当警察正在寻找你）或者你在模仿他人。\n\n· 如果在一场面对面的见面中装作一个特定的人士，并且有某位认识你模仿的这个人的人，那么要通过这个场合就超出了这个技能的范围，并且可能意味着需要一个更高难度的组合技能检定（与说服，取悦，或者话术结合）。'  },
  { name: '心理学', base: 10, cat: 'social' , desc: '· 对所有人来说都很通用的察觉方面的技能，允许使用者研究个人并且形成对于其他某人动机和人格的了解\n\n· KP可以选择替代玩家暗骰心理学技能，根据检定结果，向玩家声明真或假的信息（不告知玩家检定成功与否以及信息的真伪）'  },
  { name: '投掷', base: 20, cat: 'combat' , desc: '· 当需要用物体击中目标或者用物件的正确部分击中目标（例如小刀或者短柄小斧的刃）时，使用投掷技能\n\n· 一件有着合理平衡构架的可以藏于手中大小的物品可以被投掷至多等同于STR码距离\n\n· 如果投掷技能检定失败，投掷物将会掉落在距离目标随机距离的地方\n\n· KP应当将骰子检定数与最高的能够达成成功的数值相比较，然后判断投掷物落在目标和投资者之间合适的距离的地方\n\n· 投掷技能被用于在战斗中投掷小刀，石头，投矛 或者回力标时'  },
  { name: '闪避', base: 0, cat: 'combat' , desc: '· 允许调查员本能地闪避攻击，投掷过来的投射物以及诸如此类的\n\n· 一名角色可以尝试在一场战斗轮中使用任何次数的闪避（但是对抗一次特定的攻击只能一次）\n\n· 闪避可以通过经验来提升，就像其他的技能一样\n\n· 如果一次攻击可以被看见，一名角色可以尝试闪避开它\n\n· 想要闪避子弹是不可能的，因为运动中的它们是不可能被看见的，一名角色所能做到的最好的是做逃避的行动来造成自己更难被命中'  },
  { name: '攀爬', base: 20, cat: 'special' , desc: '· 这项技能允许一名角色借助或者不借助绳索或者登山工具进行爬树、墙以及其他垂直表面。\n\n· 这项技能也同样包括用绳索下降。\n\n· 第一次在这个技能上失败可能意味着这攀爬超出了调查员的能力范围。\n\n· 一个成功的攀爬检定应当允许调查员在任何场合下完成攀爬（而不是进行反复检定）。\n\n· 一次富有挑战性或者长距离的攀爬则应当增加难度等级。'  },
  { name: '跳跃', base: 20, cat: 'special' , desc: '· 如果成功，调查员可以在垂直方向上跳起或跳下，或者从一个站立点或起步点水平向外跳\n\n· 当坠落时，跳跃可以被用来降低可能造成的坠落伤害\n\n· 为了分辨哪些算在正常跳跃，困难跳跃以及极难跳跃，必须对判断进行训练\n\n· 作为一个指导：\n\n· 当调查员想要安全地从垂直等同于其自身高度的地方跳下来时，需要一个常规难度的成功，或者水平地从其站立点跳过长度等同于他自身高度的坑，或者助跑后跳过两倍于其自身高度的距离\n\n· 如果要达成两倍距离的跳跃，则需要一个极难难度的成功，尽管应当牢记，最长跳跃的世界纪录为大约29英尺\n\n· 如果从高处摔落下来，一个成功的跳跃检定可以使对坠落有所准备，降低一半的坠落伤害'  },
  { name: '游泳', base: 20, cat: 'special' , desc: '· 有能力在水或者其他液体中漂浮以及移动\n\n· 只有在遭遇危险的时候需要进行游泳技能检定，或者当KP认为合适的时候\n\n· 当进行游泳的孤注一掷失败时，可能会导致生命值的损失\n\n· 也可能会导致人物被顺着水流向下冲走，被水流半淹或者完全淹没'  },
  { name: '潜行', base: 20, cat: 'special' , desc: '· 安静地移动以及/或者躲藏的技巧，不惊扰到那些可能在听或者看的人们\n\n· 当尝试躲避探查，玩家应当进行一个潜行的技能检定\n\n· 与这项技能相关的能力意味着要么角色能够安静地移动（轻声轻足）以及/或者在伪装技巧上有所训练\n\n· 这项技能也同样意味着角色可以在长时间维持一定程度的谨慎心态以及冷静的头脑来使自己保持静止和隐秘'  },
  { name: '骑术', base: 5, cat: 'special' , desc: '· 这项技能被用于给坐在鞍上驾驭马，驴子或者骡子，以及获得对这些骑乘动物、骑乘工具的基础照料知识，以及如何在疾驰中或困难地形上操纵坐骑\n\n· 当坐骑出乎意外地抬起身子或失足时，骑手保持自己在坐骑上不摔落的几率等同于他的骑术技能\n\n· 偏坐在马鞍上进行骑乘将会提高一个等级的难度等级\n\n· 对于不熟悉的坐骑（例如骆驼）也可以成功地骑乘，但是可能会需要更高的难度等级\n\n· 如果一名调查员从坐骑上摔落下来，可能是因为坐骑垮了，摔落了或者是死了（或者因为骑术的孤注一掷检定失败），这次意外将造成至少1D6生命值的损失—尽管跳跃检定可以抵消这个损失'  },
  { name: '急救', base: 30, cat: 'support' , desc: '· 使用者有能力可以提供紧急的医疗处理\n· 这可能包括：对摔断了的腿用夹板进行处理，止血，处理烧伤，对一名溺水的受害者进行复苏处理，包扎以及清理伤口等等\n· 急救不能用于治疗疾病（这需要医学技能）\n· 急救必须在一小时内进行处理，在这情况下，能回复1生命值的损伤\n· 这项技能可以尝试一次，并且后续的尝试将为进行孤注一掷\n· 两个人可以合作进行急救，只要其中一人成功便可以得到生命值的回复\n· 成功的急救的使用可以将一名昏迷的角色唤醒过来\n· 一名角色被限制只能进行一次成功的急救或者医学，直到受到其他伤害\n· 当处理一名濒死的角色，成功的急救可以稳定他的状态一小时，并且得到一点临时生命\n在一小时结束后，在那之后每经过一小时，那名角色必须进行一次成功的体质（CON）检定来维持伤势的稳定，否则那名角色陷入濒死并且失去临时生命，之后每轮必须进行一次体质检定来避免死亡\n如果那名角色存活到下一轮，可以再次尝试对其使用急救（最多可以两人使用）。这个可以不断持续下去（不算是使用孤注一掷）直到伤势被稳定或者其死亡\n· 只有急救可以拯救一名濒死角色的生命，在之后他必须接受一个成功的医学检定或者被送往医院'  },
  { name: '医学', base: 1, cat: 'support' , desc: '· 使用者可以诊断并治疗事故，创伤，疾病，毒药等，并且可以提供公共健康建议\n· 医学技能可以理解大部分药物的功效、副作用、制造工艺、用药禁忌等\n\n· 用医学技能来进行治疗最少要花费1小时时间，并且可以在受到了伤害后的任何时间进行处理，但是如果没有在受伤的同一天内进行治疗，难度等级将会上升（需要一个困难难度的成功）\n\n· 一名角色如果被成功地用医学技能进行治疗，他将恢复1D3的生命值（此效果和急救不冲突），除非是在一名角色濒死的情况，他必须先接受一个成功的急救技能检定来稳定伤势，然后才能接受一个医学检定\n· 一名角色只能接受一次成功的急救和医学的治疗，直到遭受了进一步的伤害（除了在角色濒死的情况可能需要多次的急救检定来稳定伤势）\n\n· 成功的医学技能的使用可以将一名昏迷的角色从昏迷中唤醒\n· 当处理重伤时，成功的医学技能可以让病人在每周的恢复检定上增加一个奖励骰\n\n· 如果一个时代还没有对某种疾病的有效疗法，那么这项技能的效果是有限的，不确定的，或者无效的\n· 如果是在一个当代设备完善的医院中，KP可能准许医学治疗自动成功'  },
  { name: '精神分析', base: 1, cat: 'support' , desc: '· 这项技能指的是广泛的情感上的治疗，不单是弗洛伊德的疗法。在1890年代，正规的心理治疗仍处于发展的初期阶段，尽管一些疗法有着人类存在般悠久的历史\n· 一些时候，这看上去像是一门欺诈性的研究，即使是在1920年代\n· 在之后用来称呼那些精神病医师或者对情绪障碍进行研究的学者的通用术语为精神病学家\n\n· 在现代，心理治疗的各种方面都有了很大的发展，并且这项技能已经不能仅仅用精神病治疗来命名了\n· 短期强化的精神分析可以恢复一名调查员患者的理智值\n· 进行心理治疗时，游戏时间每月一次，精神病医师或医生进行一次精神分析技能检定。如果成功了，病人恢复1D3的理智值。如果检定失败了，没任何恢复\n· 如果检定为大失败，那么病人失去1d6的理智值，并且由心理医师进行的治疗到此结束\n可能在心理治疗中发生了一些严重的事变或者戏剧性的阻碍，并且在病人与治疗专家之间的关系破损到了难以修复的地步\n\n· 在游戏中，单独的精神分析并不能加速不定时疯狂的恢复，恢复需要1D6个月的系统全面（或者相似的）的照顾，而精神疗法只是构成了其中的一部分 \n· 成功使用这项技能将允许角色在短期内克服恐惧症状，或者看穿幻觉。在游戏中，这允许一名疯狂的调查员在短期内免受恐惧症或者躁狂症的影响，例如允许一名幽闭恐惧症患者躲藏在扫把柜中十分钟\n· 同样的，一名角色可以进行一个精神分析检定来帮助一名处于妄想中的调查员在短期内看破幻觉不受影响\n· 由一名心理治疗专家进行的治疗可以在不定性疯狂期间内回复理智值'  },
  { name: '电气维修', base: 10, cat: 'knowledge' , desc: '· 使调查员能够修理或者改装电气设备，例如自动点火装置，电动机，保险丝盒，以及防盗自动警铃\n\n· 在现代，这项技能对现代电子器件几乎做不到什么。\n\n· 为了维修电气设备，可能需要特殊的部件或者工具。\n\n· 在1920年代的职业可能会需要这个技能，并且需要机械维修技能作为组合\n\n· 电气维修也可能在现代的爆破上被使用，例如雷管，C-4塑料炸弹，以及地雷。\n\n· 这些武器被设计得简单易用\n\n· 只有一个大失败的结果才会造成不启动（记住这检定可以使用孤注一掷）\n\n· 拆除爆炸物是远远更为复杂的，因为它们可能被安装了反拆改装置\n\n· 当用于解除爆炸物时应当提高难度等级——见爆破技能'  },
  { name: '电子学', base: 1, cat: 'knowledge' , desc: '· 用来发现并对电子设备的故障进行维修\n\n· 允许制作简单的电子设备\n\n· 这是个现代技能—在1920年代则是使用物理学以及电气维修来应对电子设备\n\n· 不像电气维修技能，电子学工作的部件通常是不能临时配备的：它们通过精密的工作被设计出来\n\n· 通常如果没有正确的微晶片或者电路板，技能的使用者就无法进行工作，除非他们可以策划出一些形式的应急方案\n\n· 如果一名调查员有着正确的部件和指导建议，将一台标准的电脑组装起来甚至不应被需要一个技能检定'  },
  { name: '法律', base: 5, cat: 'knowledge' , desc: '· 代表你对相关法律、早期事件、法庭辩术或者法院程序了解的可能性\n\n· 一个在法律实务上的专家可能会获得巨大的奖励以及政治事务所，但是这可能需要长达几年的认真申请—— 一个较高的信用评级在这关系上也十分重要。\n\n· 在美国，一个州的州法庭（StateBar）必须批准某人的法律实务。\n\n· 当到一个外国国家时，使用这项技能的难度等级可能会上升，除非这名角色花费数月的时间来学习这个国家的法律系统'  },
  { name: '历史', base: 5, cat: 'knowledge' , desc: '· 让一名调查员能够记住一个国家，城市，区域或者个人及其相关的重要情报\n\n· 一个成功的检定可以用来帮助辨认先祖所熟悉的工具，科技，或者想法，但是对当下的所知甚少'  },
  { name: '母语', base: 0, cat: 'knowledge' , desc: '· 当选择这项技能时，必须明确一门具体的语言并且写在技能的后面\n\n· 在婴儿期或者童年早期，大多数人使用单一一门语言\n\n· 玩家所选择作为母语的语言自动地以等同于调查员教育（EDU）属性为起始\n\n· 此后，调查员以那个百分比或者更高的来进行理解，说，读以及写（如果更多的技能点数在调查员创作时加了上去）\n\n· 对于母语来说，通常并不需要技能检定。\n\n· 即使当学术性的、古式的或者深奥的术语被使用，如果同类里的人对其他人都很友好并且有足够的时间来进行交流，那么大多数的事情将不需要一个骰子检定\n\n· 如果一份文件是极其难以阅读或者以一种古式的方言来写，那么KP可能会要求一个检定'  },
  { name: '机械维修', base: 10, cat: 'knowledge' , desc: '· 这项技能允许调查员修理或制造一个机器\n\n· 这项技能可以完成木工和管道工的大部分工作内容，比如滑轮组或者蒸汽泵之类的\n\n· 在使用技能中可能会需要特殊的工具或者零件\n\n· 这项技能可以打开普通的锁，但是专业的锁则需要使用锁匠技能\n\n· 机械维修和电气维修是一个经常同时使用的技能，他们共同用于维修某种复杂的机械，例如汽车或者某些飞行器'  },
  { name: '博物学', base: 10, cat: 'knowledge' , desc: '· 这项技能最开始是指对在自然环境中的植物以及动物生命的研究\n\n· 直到19世纪，这门学科被分开到一系列的专业学术学科（生物学、植物学等）\n\n· 博物学其实是一种非科学的知识，可能包括渔民、农夫、业余者的经验、或者只是因为个人爱好而观察到的知识\n\n· 它可以对一般的物种、栖息地进行辨认，并且可以辨认踪迹、足迹以及叫声，也可以用某种线索或迹象对特定物种进行重要的推测\n\n· 如果想对事物进行科学的理解分析，则应该使用生物学，植物学以及动物学的技能\n\n· 博物学可能准确也可能不准确：这只是对某种事物的猜测、评估、民间知识，或者是对这种食物非常感兴趣而获得的知识\n\n· 使用博物学可以判断市场的肉是否新鲜，或者查看蝴蝶标本是本身就很棒还是只是很棒的排列了起来'  },
  { name: '神秘学', base: 5, cat: 'knowledge' , desc: '· 使用者可以识别出神秘学道具，用语和概念，以及民间传统，并且可以辨认魔法书以及神秘学记号\n\n· 神秘学家对于代代相传的各类神秘知识十分熟悉，包 括从埃及和苏美尔，从中世纪和文艺复兴时期的西方，以及也许从亚洲或者非洲\n\n· 理解特定的书籍可能可以增加神秘学技能的百分比。这项技能不能运用于与克苏鲁神话相关的咒术， 书本，以及魔法，尽管旧日支配者的崇拜者对于神秘学有着很高的接受能力\n\n· 由KP决定在这场游戏中非神话魔法是真实存在的 或者是虚构的'  },
  { name: '科学', base: 1, cat: 'knowledge' , desc: '· 科学专业上的理论和实践的能力，拥有这个技能的人接受过一定程度的正式的教育或者训练，尽管一名博览群书的业余科学家也是可能存在的\n\n· 对于知识的理解和认识受到游戏时代的限制\n\n· 你可以花费点数来获得任何你想要的专业化技能\n\n· 作为属类的“科学” 技能不能被获得\n\n· 每个专业化技能包括了一门专门的学科，并且列表所给出的并不是全部\n\n· 许多专业跨越了不同的知识领域，并且有所重叠，例如数学和密码学，植物学和生物学，化学和药学\n\n· 当一名角色没有完全对应的专业学科技能，他可以用一个相似的技能进行检定，但是由KP来判断是否要增加难度等级（或者一个惩罚骰）' , spec: {"type":"options","defaultBase":1,"options":[{"name":"数学","base":10},{"name":"地质学","base":1},{"name":"化学","base":1},{"name":"生物学","base":1},{"name":"物理学","base":1},{"name":"天文学","base":1},{"name":"气象学","base":1},{"name":"药学","base":1},{"name":"工程学","base":1},{"name":"密码学","base":1},{"name":"制图学","base":1},{"name":"人类学","base":1},{"name":"心理学","base":1}]}  },
  { name: '操作重型机械', base: 1, cat: 'knowledge' , desc: '· 当驾驶以及操纵一辆坦克，反铲挖土机，蒸汽挖土机或者其他巨型建造机械时需要这个技能\n\n· 对于种 类非常不同的机械，KP可以决定提高难度等级，如果遇到的问题是极大程度上不熟悉的\n\n· 例如，过去常常开推土机的某人，不会立刻能够掌握对船的引擎舱中的蒸汽涡轮机的使用'  },
  { name: '药学', base: 1, cat: 'knowledge' , desc: '· 关于化学复合物以及它们的在有机生命体上的效果的研究\n\n· 传统上来说，这包括药物的配方、创造以及施用（不管是一名巫医进行药草组合或者是现代的药剂师在实验室里进行操作）\n\n· 这个技能的应用在与确认药物被安全以及有效地使用，包括人工合成原料，毒素的检定，以及有可能产生的副作用的相关知识。'  },
  { name: '催眠', base: 1, cat: 'knowledge' , desc: '· 使用者可以在一名自愿并经历过高度暗示、放松的目标身上引出出神似的状态，并且可能回忆起忘却的记忆\n\n· 对于催眠的限制应当由KP根据适应自己游戏的情况来制定\n\n· 这可能是只有自愿的目标可以被催眠，或者KP可能会允许这项技能以一种更加富有侵略性的方式被用在非自愿的目标身上\n\n· 对那些遭受了精神创伤的人，这项技能可以当做催眠疗法来使用，减轻一名病人的恐惧或者躁狂\n（成功的使用这个技能意味着这名病人在该场合克服了恐惧或者躁狂）\n\n· 为了完全治愈某人的恐惧，可能会需要一系列成功的催眠疗法疗程\n（最少1D6疗程，由KP决定）'  },
  { name: '读唇', base: 1, cat: 'knowledge' , desc: '· 这项技能允许好奇的调查员听懂一段交谈对话， 而不需要听见对方说了什么\n\n· 能看到对方的视线是必须的，并且如果只能看到其中一名说话者的唇（另一名可能只能看到背），那么只能辨认出一半的对话\n\n· 读唇也可以用于与另一个人进行无声的交流（如 果双方都是专家），允许相对更加复杂的短语以及含义'  },
  { name: '爆破', base: 1, cat: 'knowledge' , desc: '· 在这项技能的帮助下，使用者将熟练于安全使用爆破，包括设置以及拆除炸药、地雷以及相似的设备被设计得容易设置（不需要检定）但是相对较为困难地进行除去或拆除。\n\n· 这项技能也包含军用等级的爆炸物（反人类地雷，塑料炸弹，等）。\n\n· 给予足够的时间和资源，这些专家可以装设炸药来摧毁一幢建筑，清除一个被堵住的隧道，以及赋予炸药不同用处（例如构造微量炸药，诡雷，以及其他）。'  },
  { name: '潜水', base: 1, cat: 'knowledge' , desc: '· 使用者接受过在深海游泳的使用以及维持潜水设备的训练，水下导航，合适的下潜配重，以及应对紧急情况的方法。\n\n· 在1942年的水肺[潜水氧气筒]发明前，严格的潜水套装是装备着能从水面输送空气的连接管道。\n\n· 在现代，一名水肺潜水员将会熟悉当呼吸增压氧气时发生的潜水时的物理现象，气压，以及生理学的过程。'  },
  { name: '动物驯养', base: 5, cat: 'knowledge' , desc: '· 命令以及训练已驯化动物去完成一些简单任务的技能。\n· 这个技能最常用于狗上，但也包括鸟、猫、猴子以及其他（取决于 KP 的判断）。\n· 至于对动物的骑乘，例如马或者骆驼，则要用骑术技能来进行行动以及操控这些坐骑。'  },
  { name: '格斗①', base: 25, cat: 'combat' , spec: {"type":"options","defaultBase":25,"options":[{"name":"斗殴","base":25},{"name":"鞭子","base":5},{"name":"电锯","base":10},{"name":"链枷","base":10},{"name":"绞具","base":15},{"name":"斧","base":15},{"name":"剑","base":20},{"name":"矛","base":20}]}  },
  { name: '格斗②', base: 25, cat: 'combat' , spec: {"type":"options","defaultBase":25,"options":[{"name":"斗殴","base":25},{"name":"鞭子","base":5},{"name":"电锯","base":10},{"name":"链枷","base":10},{"name":"绞具","base":15},{"name":"斧","base":15},{"name":"剑","base":20},{"name":"矛","base":20}]}  },
  { name: '格斗③', base: 25, cat: 'combat' , spec: {"type":"text","defaultBase":25}  },
  { name: '射击①', base: 20, cat: 'combat' , spec: {"type":"options","defaultBase":20,"options":[{"name":"手枪","base":20},{"name":"步枪/霰弹枪","base":25},{"name":"冲锋枪","base":15},{"name":"机枪","base":10},{"name":"弓术","base":15},{"name":"喷射器","base":10},{"name":"重武器","base":10}]}  },
  { name: '射击②', base: 20, cat: 'combat' , spec: {"type":"options","defaultBase":20,"options":[{"name":"手枪","base":20},{"name":"步枪/霰弹枪","base":25},{"name":"冲锋枪","base":15},{"name":"机枪","base":10},{"name":"弓术","base":15},{"name":"喷射器","base":10},{"name":"重武器","base":10}]}  },
  { name: '射击③', base: 15, cat: 'combat' , spec: {"type":"text","defaultBase":15}  },
  { name: '技艺①', base: 5, cat: 'knowledge' , spec: {"type":"options","defaultBase":5,"options":[{"name":"表演","base":5},{"name":"美术","base":5},{"name":"摄影","base":5},{"name":"伪造","base":5},{"name":"写作","base":5},{"name":"书法","base":5},{"name":"乐理","base":5},{"name":"厨艺","base":5},{"name":"裁缝","base":5},{"name":"理发","base":5},{"name":"建筑","base":5},{"name":"舞蹈","base":5},{"name":"酿酒","base":5},{"name":"捕鱼","base":5},{"name":"歌唱","base":5},{"name":"制陶","base":5},{"name":"雕塑","base":5},{"name":"杂技","base":5},{"name":"风水","base":5},{"name":"技术制图","base":5},{"name":"耕作","base":5},{"name":"打字","base":5},{"name":"速记","base":5},{"name":"木匠","base":5},{"name":"莫里斯舞蹈","base":5},{"name":"歌剧歌唱","base":5},{"name":"粉刷匠与油漆工","base":5},{"name":"吹真空管","base":5}]}  },
  { name: '技艺②', base: 5, cat: 'knowledge' , spec: {"type":"options","defaultBase":5,"options":[{"name":"表演","base":5},{"name":"美术","base":5},{"name":"摄影","base":5},{"name":"伪造","base":5},{"name":"写作","base":5},{"name":"书法","base":5},{"name":"乐理","base":5},{"name":"厨艺","base":5},{"name":"裁缝","base":5},{"name":"理发","base":5},{"name":"建筑","base":5},{"name":"舞蹈","base":5},{"name":"酿酒","base":5},{"name":"捕鱼","base":5},{"name":"歌唱","base":5},{"name":"制陶","base":5},{"name":"雕塑","base":5},{"name":"杂技","base":5},{"name":"风水","base":5},{"name":"技术制图","base":5},{"name":"耕作","base":5},{"name":"打字","base":5},{"name":"速记","base":5},{"name":"木匠","base":5},{"name":"莫里斯舞蹈","base":5},{"name":"歌剧歌唱","base":5},{"name":"粉刷匠与油漆工","base":5},{"name":"吹真空管","base":5}]}  },
  { name: '技艺③', base: 5, cat: 'knowledge' , spec: {"type":"text","defaultBase":5}  },
  { name: '外语①', base: 1, cat: 'knowledge' , spec: {"type":"text","defaultBase":1}  },
  { name: '外语②', base: 1, cat: 'knowledge' , spec: {"type":"text","defaultBase":1}  },
  { name: '外语③', base: 1, cat: 'knowledge' , spec: {"type":"text","defaultBase":1}  },
  { name: '驾驶①', base: 20, cat: 'special' , spec: {"type":"text","defaultBase":20}  },
];
const OCCUPATIONS = [
    { seq:2, name:'会计师', cr_range:'30-70', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'聆听'},{mark:'★',name:'说服'},{mark:'★',name:'侦查'},{mark:'★',name:'两项其他技能'}] },
  { seq:3, name:'杂技演员', cr_range:'9-20', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'闪避'},{mark:'★',name:'跳跃'},{mark:'★',name:'投掷'},{mark:'★',name:'侦查'},{mark:'★',name:'游泳'},{mark:'★',name:'两项其他技能'}] },
  { seq:4, name:'演员-戏剧演员', cr_range:'9-40', skill_formula:'教育×2＋外貌×2', skills:[{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'乔装'},{mark:'★',name:'格斗①'},{mark:'★',name:'历史'},{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'心理学'},{mark:'★',name:'一项其他个人'}] },
  { seq:5, name:'演员-电影演员', cr_range:'20-90', skill_formula:'教育×2＋外貌×2', skills:[{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'乔装'},{mark:'★',name:'驾驶①'},{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'心理学'},{mark:'★',name:'两项其他技能'}] },
  { seq:6, name:'事务所侦探、保安', cr_range:'20-45', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'射击①'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'},{mark:'★',name:'追踪'}] },
  { seq:7, name:'精神病医生（古典）', cr_range:'10-60', skill_formula:'教育×4', skills:[{mark:'★',name:'法律'},{mark:'★',name:'聆听'},{mark:'★',name:'医学'},{mark:'★',name:'外语①'},{mark:'★',name:'精神分析'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'生物学'}] },
  { seq:8, name:'动物训练师', cr_range:'10-40', skill_formula:'教育×2＋外貌或意志×2', skills:[{mark:'★',name:'跳跃'},{mark:'★',name:'聆听'},{mark:'★',name:'博物学'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'动物学'},{mark:'★',name:'潜行'},{mark:'★',name:'追踪'}] },
  { seq:9, name:'文物学家（原作向）', cr_range:'30-70', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'估价'},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'外语①'},{mark:'★',name:'侦查'}] },
  { seq:10, name:'古董商', cr_range:'30-50', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'估价'},{mark:'★',name:'驾驶①'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'导航'}] },
  { seq:11, name:'考古学家（原作向）', cr_range:'10-40', skill_formula:'教育×4', skills:[{mark:'★',name:'估价'},{mark:'★',name:'考古学'},{mark:'★',name:'历史'},{mark:'★',name:'外语①'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'侦查'},{mark:'★',name:'机械维修'},{mark:'★',name:'导航'},{mark:'★',name:'科学',spec:'任一：如化学'}] },
  { seq:12, name:'建筑师', cr_range:'30-70', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'技艺①',spec:'技术制图'},{mark:'★',name:'法律'},{mark:'★',name:'母语'},{mark:'★',name:'计算机使用'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'说服'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'数学'}] },
  { seq:13, name:'艺术家', cr_range:'9-50', skill_formula:'教育×2＋敏捷或意志×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'历史'},{mark:'★',name:'博物学'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:14, name:'精神病院看护', cr_range:'8-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'闪避'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'急救'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'}] },
  { seq:15, name:'运动员', cr_range:'9-70', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'攀爬'},{mark:'★',name:'跳跃'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'骑术'},{mark:'★',name:'游泳'},{mark:'★',name:'投掷'}] },
  { seq:16, name:'作家（原作向）', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'★',name:'技艺①',spec:'文学'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'博物学'},{mark:'★',name:'神秘学'},{mark:'★',name:'外语①'},{mark:'★',name:'母语'},{mark:'★',name:'心理学'}] },
  { seq:17, name:'酒保', cr_range:'8-25', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:18, name:'猎人', cr_range:'20-50', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'射击①'},{mark:'★',name:'聆听'},{mark:'★',name:'侦查'},{mark:'★',name:'博物学'},{mark:'★',name:'导航'},{mark:'★',name:'外语①'},{mark:'★',name:'生存（任一）'},{mark:'★',name:'科学（生物学'},{mark:'★',name:'植物学）'},{mark:'★',name:'潜行'},{mark:'★',name:'追踪'}] },
  { seq:19, name:'书商', cr_range:'20-40', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'估价'},{mark:'★',name:'驾驶①'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'母语'},{mark:'★',name:'外语①'}] },
  { seq:20, name:'赏金猎人', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'驾驶①'},{mark:'★',name:'电子学'},{mark:'★',name:'电气维修'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'法律'},{mark:'★',name:'心理学'},{mark:'★',name:'追踪'},{mark:'★',name:'潜行'}] },
  { seq:21, name:'拳击手、摔跤手', cr_range:'9-60', skill_formula:'教育×2＋力量×2', skills:[{mark:'★',name:'闪避'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'恐吓'},{mark:'★',name:'跳跃'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:22, name:'管家、男仆、女仆', cr_range:'9-40', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'估价'},{mark:'★',name:'技艺①',spec:'任一：如烹饪'},{mark:'★',name:'急救'},{mark:'★',name:'聆听'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:23, name:'神职人员', cr_range:'9-60', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'聆听'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'}] },
  { seq:24, name:'程序员、电子工程师（现代）', cr_range:'10-70', skill_formula:'教育×4', skills:[{mark:'★',name:'计算机使用'},{mark:'★',name:'电气维修'},{mark:'★',name:'电子学、图书馆'},{mark:'★',name:'科学',spec:'数学'},{mark:'★',name:'侦查'}] },
  { seq:25, name:'黑客/骇客（现代）', cr_range:'10-70', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'计算机使用'},{mark:'★',name:'电气维修'},{mark:'★',name:'电子学'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'侦查'}] },
  { seq:26, name:'牛仔', cr_range:'9-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'闪避'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'急救'},{mark:'★',name:'博物学'},{mark:'★',name:'跳跃'},{mark:'★',name:'骑术'},{mark:'★',name:'生存（任一）'},{mark:'★',name:'投掷'},{mark:'★',name:'追踪'}] },
  { seq:27, name:'工匠', cr_range:'10-40', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'★',name:'会计'},{mark:'★',name:'技艺①',spec:'任二'},{mark:'★',name:'机械维修'},{mark:'★',name:'博物学'},{mark:'★',name:'侦查'}] },
  { seq:28, name:'罪犯-刺客', cr_range:'30-60', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'乔装'},{mark:'★',name:'电气维修'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'锁匠'},{mark:'★',name:'机械维修'},{mark:'★',name:'潜行'},{mark:'★',name:'心理学'}] },
  { seq:29, name:'罪犯-银行劫匪', cr_range:'5-75', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'驾驶①'},{mark:'★',name:'电气维修'},{mark:'★',name:'机械维修'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'恐吓'},{mark:'★',name:'锁匠'},{mark:'★',name:'操作重型机械'}] },
  { seq:30, name:'罪犯-打手、暴徒', cr_range:'5-30', skill_formula:'教育×2＋力量×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'驾驶①'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'},{mark:'★',name:'侦查'}] },
  { seq:31, name:'罪犯-窃贼', cr_range:'5-40', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'★',name:'估价'},{mark:'★',name:'攀爬'},{mark:'★',name:'电气维修'},{mark:'★',name:'机械维修'},{mark:'★',name:'聆听'},{mark:'★',name:'锁匠'},{mark:'★',name:'妙手'},{mark:'★',name:'潜行'},{mark:'★',name:'侦查'}] },
  { seq:32, name:'罪犯-欺诈师', cr_range:'10-65', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'估价'},{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'法律'},{mark:'★',name:'外语①'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'妙手'}] },
  { seq:33, name:'罪犯-独行罪犯', cr_range:'5-65', skill_formula:'教育×2＋敏捷或外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'乔装'},{mark:'★',name:'估价'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'锁匠'},{mark:'★',name:'机械维修'},{mark:'★',name:'潜行'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:34, name:'罪犯-女飞贼（古典）', cr_range:'10-80', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'技艺①',spec:'任意'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'射击①',spec:'手枪'},{mark:'★',name:'驾驶①'},{mark:'★',name:'聆听'},{mark:'★',name:'潜行'}] },
  { seq:35, name:'罪犯-赃物贩子', cr_range:'20-40', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'估价'},{mark:'★',name:'技艺①',spec:'伪造'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'侦查'}] },
  { seq:36, name:'罪犯-赝造者', cr_range:'20-60', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'估价'},{mark:'★',name:'技艺①',spec:'伪造'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'侦查'},{mark:'★',name:'妙手'}] },
  { seq:37, name:'罪犯-走私者', cr_range:'20-60', skill_formula:'教育×2＋外貌或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'射击①'},{mark:'★',name:'聆听'},{mark:'★',name:'导航'},{mark:'★',name:'驾驶①'},{mark:'★',name:'驾驶（飞行器'},{mark:'★',name:'船）'},{mark:'★',name:'心理学'},{mark:'★',name:'妙手'},{mark:'★',name:'侦查'}] },
  { seq:38, name:'罪犯-混混', cr_range:'3-10', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'攀爬'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'跳跃'},{mark:'★',name:'妙手'},{mark:'★',name:'潜行'},{mark:'★',name:'投掷'}] },
  { seq:39, name:'教团首领', cr_range:'30-60', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'神秘学'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'},{mark:'★',name:'任意其他两项其他个人特长'}] },
  { seq:40, name:'除魅师（现代）', cr_range:'20-50', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'驾驶①'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'射击①'},{mark:'★',name:'历史'},{mark:'★',name:'神秘学'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行。※经KP允许 可用催眠替换其中一项'}] },
  { seq:41, name:'设计师', cr_range:'20-60', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'技艺①',spec:'摄影'},{mark:'★',name:'计算机使用'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'机械维修'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'},{mark:'★',name:'任意一项其他个人特长'}] },
  { seq:42, name:'业余艺术爱好者（原作向）', cr_range:'50-99', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'射击①'},{mark:'★',name:'外语①'},{mark:'★',name:'骑术'}] },
  { seq:43, name:'潜水员', cr_range:'9-30', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'★',name:'潜水'},{mark:'★',name:'急救'},{mark:'★',name:'机械维修'},{mark:'★',name:'驾驶①',spec:'船'},{mark:'★',name:'科学',spec:'生物'},{mark:'★',name:'侦查'},{mark:'★',name:'游泳'}] },
  { seq:44, name:'医生（原作向）', cr_range:'30-80', skill_formula:'教育×4', skills:[{mark:'★',name:'急救、医学、外语（拉丁文）、心理学、科学（生物学；制药）'},{mark:'★',name:'任两种其他学术'},{mark:'★',name:'个人特长'}] },
  { seq:45, name:'流浪者', cr_range:'0-5', skill_formula:'教育×2＋外貌或敏捷或力量×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'攀爬'},{mark:'★',name:'跳跃'},{mark:'★',name:'聆听'},{mark:'★',name:'导航'},{mark:'★',name:'潜行'}] },
  { seq:46, name:'司机-私人司机', cr_range:'10-40', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'驾驶①'},{mark:'★',name:'聆听'},{mark:'★',name:'机械维修'},{mark:'★',name:'导航'},{mark:'★',name:'侦查'}] },
  { seq:47, name:'司机-司机', cr_range:'9-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'驾驶①'},{mark:'★',name:'聆听'},{mark:'★',name:'机械维修'},{mark:'★',name:'导航'},{mark:'★',name:'心理学'}] },
  { seq:48, name:'司机-出租车司机', cr_range:'9-30', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'★',name:'会计'},{mark:'★',name:'驾驶①'},{mark:'★',name:'电气维修'},{mark:'★',name:'话术'},{mark:'★',name:'机械维修'},{mark:'★',name:'导航'},{mark:'★',name:'侦查'}] },
  { seq:49, name:'编辑', cr_range:'10-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'历史'},{mark:'★',name:'母语'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:50, name:'政府官员', cr_range:'50-90', skill_formula:'教育×2＋外貌×2', skills:[{mark:'★',name:'取悦'},{mark:'★',name:'历史'},{mark:'★',name:'恐吓'},{mark:'★',name:'话术'},{mark:'★',name:'聆听'},{mark:'★',name:'母语'},{mark:'★',name:'说服'},{mark:'★',name:'心理学'}] },
  { seq:51, name:'工程师', cr_range:'30-60', skill_formula:'教育×4', skills:[{mark:'★',name:'技艺①',spec:'技术制图'},{mark:'★',name:'电气维修'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'机械维修'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'科学',spec:'工程学'}] },
  { seq:52, name:'艺人', cr_range:'9-70', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'技艺①',spec:'表演类'},{mark:'★',name:'乔装'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'}] },
  { seq:53, name:'探险家（古典）', cr_range:'55-80', skill_formula:'教育×2＋外貌或敏捷或力量×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'游泳'},{mark:'★',name:'射击①'},{mark:'★',name:'历史'},{mark:'★',name:'跳跃'},{mark:'★',name:'博物学'},{mark:'★',name:'导航'},{mark:'★',name:'外语①'},{mark:'★',name:'生存'}] },
  { seq:54, name:'农民', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'耕作'},{mark:'★',name:'汽车驾驶（'},{mark:'★',name:'运货马车）'},{mark:'★',name:'机械维修'},{mark:'★',name:'博物学'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'追踪'}] },
  { seq:55, name:'联邦探员', cr_range:'20-40', skill_formula:'教育×4', skills:[{mark:'★',name:'驾驶①'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'射击①'},{mark:'★',name:'法律'},{mark:'★',name:'说服'},{mark:'★',name:'潜行'},{mark:'★',name:'侦查'}] },
  { seq:56, name:'消防员', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'闪避'},{mark:'★',name:'驾驶①'},{mark:'★',name:'急救'},{mark:'★',name:'跳跃'},{mark:'★',name:'机械维修'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'投掷'}] },
  { seq:57, name:'驻外记者', cr_range:'10-40', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'历史'},{mark:'★',name:'外语①'},{mark:'★',name:'母语'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'}] },
  { seq:58, name:'法医', cr_range:'40-60', skill_formula:'教育×4', skills:[{mark:'★',name:'外语（拉丁文）'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'医学'},{mark:'★',name:'说服'},{mark:'★',name:'科学',spec:'生物学'},{mark:'★',name:'侦查'}] },
  { seq:59, name:'赌徒', cr_range:'8-50', skill_formula:'教育×2＋外貌或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'妙手'},{mark:'★',name:'侦查'}] },
  { seq:60, name:'黑帮-黑帮老大', cr_range:'60-95', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'法律'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:61, name:'黑帮-马仔', cr_range:'9-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'驾驶①'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'心理学'}] },
  { seq:62, name:'绅士、淑女', cr_range:'40-90', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'射击①',spec:'步枪/霰弹枪'},{mark:'★',name:'历史'},{mark:'★',name:'外语（任一）'},{mark:'★',name:'导航'},{mark:'★',name:'骑术'}] },
  { seq:63, name:'游民', cr_range:'0-5', skill_formula:'教育×2＋外貌或敏捷×2', skills:[{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'攀爬'},{mark:'★',name:'跳跃'},{mark:'★',name:'聆听'},{mark:'★',name:'锁匠'},{mark:'★',name:'妙手'},{mark:'★',name:'导航'},{mark:'★',name:'潜行'}] },
  { seq:64, name:'勤杂护工', cr_range:'6-15', skill_formula:'教育×2＋力量×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'电气维修'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'急救'},{mark:'★',name:'聆听'},{mark:'★',name:'机械维修'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'}] },
  { seq:65, name:'记者(原作向)-调查记者', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺（艺术'},{mark:'★',name:'摄影）'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'母语'},{mark:'★',name:'心理学'}] },
  { seq:66, name:'记者(原作向)-通讯记者', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'历史'},{mark:'★',name:'聆听'},{mark:'★',name:'母语'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'},{mark:'★',name:'侦查'}] },
  { seq:67, name:'法官', cr_range:'50-80', skill_formula:'教育×4', skills:[{mark:'★',name:'历史'},{mark:'★',name:'恐吓'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'聆听'},{mark:'★',name:'母语'},{mark:'★',name:'说服'},{mark:'★',name:'心理学'}] },
  { seq:68, name:'实验室助理', cr_range:'10-30', skill_formula:'教育×4', skills:[{mark:'★',name:'计算机使用'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'电气维修'},{mark:'★',name:'外语①'},{mark:'★',name:'科学',spec:'化学和任意两项'},{mark:'★',name:'侦查'},{mark:'★',name:'任意一项其他个人特长'}] },
  { seq:69, name:'工人-非熟练工人', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'驾驶①'},{mark:'★',name:'电气维修'},{mark:'★',name:'格斗①'},{mark:'★',name:'急救'},{mark:'★',name:'机械维修'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'投掷'}] },
  { seq:70, name:'工人-伐木工', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'闪避'},{mark:'★',name:'格斗①',spec:'链锯'},{mark:'★',name:'急救'},{mark:'★',name:'跳跃'},{mark:'★',name:'机械维修'},{mark:'★',name:'博物学'},{mark:'★',name:'科学（生物学'},{mark:'★',name:'植物学）'},{mark:'★',name:'投掷'}] },
  { seq:71, name:'工人-矿工', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'科学',spec:'地质'},{mark:'★',name:'跳跃'},{mark:'★',name:'机械维修'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'潜行'},{mark:'★',name:'侦查'}] },
  { seq:72, name:'律师', cr_range:'30-80', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'心理学'},{mark:'★',name:'两项其他技能'}] },
  { seq:73, name:'图书馆管理员（原作向）', cr_range:'9-35', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'外语①'},{mark:'★',name:'母语'},{mark:'★',name:'任意四项其他个人特长'},{mark:'★',name:'专业书籍主题'}] },
  { seq:74, name:'技师', cr_range:'9-40', skill_formula:'教育×4', skills:[{mark:'★',name:'技艺①',spec:'木工'},{mark:'★',name:'攀爬'},{mark:'★',name:'驾驶①'},{mark:'★',name:'电气维修'},{mark:'★',name:'机械维修'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'任意两项其他个人'},{mark:'★',name:'时代'},{mark:'★',name:'技术特长'}] },
  { seq:75, name:'军官', cr_range:'20-70', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'射击①'},{mark:'★',name:'导航'},{mark:'★',name:'急救'},{mark:'★',name:'心理学'}] },
  { seq:76, name:'传教士', cr_range:'0-30', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'急救'},{mark:'★',name:'机械维修'},{mark:'★',name:'医学'},{mark:'★',name:'博物学'}] },
  { seq:77, name:'登山家', cr_range:'30-60', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'急救'},{mark:'★',name:'跳跃'},{mark:'★',name:'聆听'},{mark:'★',name:'导航'},{mark:'★',name:'外语①'},{mark:'★',name:'生存（阿尔卑斯'},{mark:'★',name:'类似）'},{mark:'★',name:'追踪'}] },
  { seq:78, name:'博物馆管理员', cr_range:'10-30', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'估价'},{mark:'★',name:'考古学'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'神秘学'},{mark:'★',name:'外语①'},{mark:'★',name:'侦查'}] },
  { seq:79, name:'音乐家', cr_range:'9-30', skill_formula:'教育×2＋意志或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'乐器'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'四项其他技能'}] },
  { seq:80, name:'护士', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'急救'},{mark:'★',name:'聆听'},{mark:'★',name:'医学'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'生物学'},{mark:'★',name:'侦查'}] },
  { seq:81, name:'神秘学家', cr_range:'9-65', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'人类学'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'神秘学'},{mark:'★',name:'外语①'},{mark:'★',name:'科学',spec:'天文'},{mark:'★',name:'※经KP允许 可以包含克苏鲁神话'}] },
  { seq:82, name:'旅行家', cr_range:'5-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'射击①'},{mark:'★',name:'急救'},{mark:'★',name:'聆听'},{mark:'★',name:'博物学'},{mark:'★',name:'导航'},{mark:'★',name:'侦查'},{mark:'★',name:'生存（任一）'},{mark:'★',name:'追踪'}] },
  { seq:83, name:'超心理学家', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'★',name:'人类学'},{mark:'★',name:'技艺①',spec:'摄影'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'神秘学'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'}] },
  { seq:84, name:'药剂师', cr_range:'35-75', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'急救'},{mark:'★',name:'外语（拉丁文）'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'制药'}] },
  { seq:85, name:'摄影师-摄影师', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'摄影'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'化学'},{mark:'★',name:'潜行'},{mark:'★',name:'侦查'}] },
  { seq:86, name:'摄影师-摄影记者', cr_range:'10-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'摄影'},{mark:'★',name:'攀爬'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'化学'}] },
  { seq:87, name:'飞行员-飞行员', cr_range:'20-70', skill_formula:'教育×2＋敏捷×2', skills:[{mark:'★',name:'电气维修'},{mark:'★',name:'机械维修'},{mark:'★',name:'导航'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'驾驶①',spec:'飞行器'},{mark:'★',name:'科学',spec:'天文'}] },
  { seq:88, name:'飞行员-特技飞行员（古典）', cr_range:'30-60', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'电气维修'},{mark:'★',name:'聆听'},{mark:'★',name:'机械维修'},{mark:'★',name:'导航'},{mark:'★',name:'驾驶①',spec:'飞行器'},{mark:'★',name:'侦查'}] },
  { seq:89, name:'警方(原作向)-警探', cr_range:'20-50', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'乔装'},{mark:'★',name:'射击①'},{mark:'★',name:'法律'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'},{mark:'★',name:'一项其他技能'}] },
  { seq:90, name:'警方(原作向)-巡警', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'射击①'},{mark:'★',name:'急救'},{mark:'★',name:'法律'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查和下面的一种个人特长：汽车驾驶'},{mark:'★',name:'骑术'}] },
  { seq:91, name:'私家侦探', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'摄影'},{mark:'★',name:'乔装'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'},{mark:'★',name:'一项其他个人'},{mark:'★',name:'时代特长（如计算机、锁匠、格斗、射击）'}] },
  { seq:92, name:'教授（原作向）', cr_range:'20-70', skill_formula:'教育×4', skills:[{mark:'★',name:'图书馆使用'},{mark:'★',name:'外语①'},{mark:'★',name:'母语'},{mark:'★',name:'心理学'},{mark:'★',name:'任意四项其他学术、时代'},{mark:'★',name:'个人特长'}] },
  { seq:93, name:'淘金客', cr_range:'0-10', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬、急救、历史、机械维修、导航、科学（地质）'},{mark:'★',name:'侦查'}] },
  { seq:94, name:'性工作者', cr_range:'5-50', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'闪避'},{mark:'★',name:'心理学'},{mark:'★',name:'妙手'},{mark:'★',name:'潜行'}] },
  { seq:95, name:'精神病学家', cr_range:'30-80', skill_formula:'教育×4', skills:[{mark:'★',name:'外语①'},{mark:'★',name:'聆听'},{mark:'★',name:'医学'},{mark:'★',name:'说服'},{mark:'★',name:'精神分析'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'生物学'}] },
  { seq:96, name:'心理学家、精神分析学家', cr_range:'10-40', skill_formula:'教育×4', skills:[{mark:'★',name:'会计'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'聆听'},{mark:'★',name:'说服'},{mark:'★',name:'精神分析'},{mark:'★',name:'心理学'},{mark:'★',name:'任意两项其他学术、个人'},{mark:'★',name:'时代特长'}] },
  { seq:97, name:'研究员', cr_range:'9-30', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'外语①'},{mark:'★',name:'侦查'},{mark:'★',name:'任意三项其他学术领域'}] },
  { seq:98, name:'海员-军舰海员', cr_range:'9-30', skill_formula:'教育×2＋敏捷或力量×2', skills:[{mark:'★',name:'电工'},{mark:'★',name:'机械维修'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'急救'},{mark:'★',name:'导航'},{mark:'★',name:'驾驶①',spec:'船'},{mark:'★',name:'生存（海上）'},{mark:'★',name:'游泳'}] },
  { seq:99, name:'海员-民船海员', cr_range:'20-40', skill_formula:'教育×2＋敏捷或力量×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'急救'},{mark:'★',name:'机械维修'},{mark:'★',name:'博物学'},{mark:'★',name:'导航'},{mark:'★',name:'驾驶①',spec:'船'},{mark:'★',name:'侦查'},{mark:'★',name:'游泳'}] },
  { seq:100, name:'推销员', cr_range:'9-40', skill_formula:'教育×2＋外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'驾驶①'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'},{mark:'★',name:'妙手'},{mark:'★',name:'一项其他技能'}] },
  { seq:101, name:'科学家', cr_range:'9-50', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'任意三项科学专业领域'},{mark:'★',name:'计算机使用'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'外语①'},{mark:'★',name:'母语'},{mark:'★',name:'侦查'}] },
  { seq:102, name:'秘书', cr_range:'9-30', skill_formula:'教育×2＋敏捷或外貌×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'技艺（打字'},{mark:'★',name:'速记）'},{mark:'★',name:'母语'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'计算机使用'},{mark:'★',name:'心理学'}] },
  { seq:103, name:'店老板', cr_range:'20-40', skill_formula:'教育×2＋外貌或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'电气维修'},{mark:'★',name:'聆听'},{mark:'★',name:'机械维修'},{mark:'★',name:'心理学'},{mark:'★',name:'侦查'}] },
  { seq:104, name:'士兵、海军陆战队士兵', cr_range:'9-30', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'游泳'},{mark:'★',name:'闪避'},{mark:'★',name:'格斗①'},{mark:'★',name:'射击①'},{mark:'★',name:'潜行'},{mark:'★',name:'生存'},{mark:'★',name:'下面任选两项：急救、机械维修、外语'}] },
  { seq:105, name:'间谍', cr_range:'20-60', skill_formula:'教育×2＋外貌或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'技艺①',spec:'表演'},{mark:'★',name:'乔装'},{mark:'★',name:'射击①'},{mark:'★',name:'聆听'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'},{mark:'★',name:'妙手'},{mark:'★',name:'潜行'}] },
  { seq:106, name:'学生、实习生', cr_range:'5-10', skill_formula:'教育×4', skills:[{mark:'★',name:'语言（母语'},{mark:'★',name:'外语）'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'聆听'},{mark:'★',name:'三个学习的专业'}] },
  { seq:107, name:'替身演员', cr_range:'10-50', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'闪避'},{mark:'★',name:'电气维修'},{mark:'★',name:'机械维修'},{mark:'★',name:'格斗①'},{mark:'★',name:'急救'},{mark:'★',name:'跳跃'},{mark:'★',name:'游泳'},{mark:'★',name:'下面任选一项：潜水、汽车驾驶、驾驶（任一）'},{mark:'★',name:'骑术'}] },
  { seq:108, name:'部落成员', cr_range:'0-15', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'★',name:'攀爬'},{mark:'★',name:'格斗①'},{mark:'★',name:'投掷'},{mark:'★',name:'聆听'},{mark:'★',name:'博物学'},{mark:'★',name:'神秘学'},{mark:'★',name:'侦查'},{mark:'★',name:'游泳'},{mark:'★',name:'生存（任一）'}] },
  { seq:109, name:'殡葬师', cr_range:'20-40', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'驾驶①'},{mark:'★',name:'历史'},{mark:'★',name:'神秘学'},{mark:'★',name:'心理学'},{mark:'★',name:'科学',spec:'生物学'}] },
  { seq:110, name:'工会活动家', cr_range:'5-50', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'法律'},{mark:'★',name:'聆听'},{mark:'★',name:'操作重型机械'},{mark:'★',name:'心理学'}] },
  { seq:111, name:'服务生', cr_range:'9-20', skill_formula:'教育×2＋外貌或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'技艺①',spec:'任一'},{mark:'★',name:'闪避'},{mark:'★',name:'聆听'},{mark:'★',name:'心理学'}] },
  { seq:112, name:'白领工人-职员、主管', cr_range:'9-20', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'语言'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'计算机使用'},{mark:'★',name:'聆听'}] },
  { seq:113, name:'白领工人-中高层管理人员', cr_range:'20-80', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'外语①'},{mark:'★',name:'法律'},{mark:'★',name:'心理学'}] },
  { seq:114, name:'狂热者', cr_range:'0-30', skill_formula:'教育×2＋外貌或意志×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'历史'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'}] },
  { seq:115, name:'饲养员', cr_range:'9-40', skill_formula:'教育×4', skills:[{mark:'★',name:'驯兽'},{mark:'★',name:'会计'},{mark:'★',name:'闪避'},{mark:'★',name:'急救'},{mark:'★',name:'博物学'},{mark:'★',name:'医学'},{mark:'★',name:'科学',spec:'制药'}] },
  { seq:116, name:'大使', cr_range:'50-90', skill_formula:'教育×2＋外貌×2', skills:[{mark:'★',name:'取悦'},{mark:'★',name:'历史'},{mark:'★',name:'恐吓'},{mark:'★',name:'话术'},{mark:'★',name:'聆听'},{mark:'★',name:'母语'},{mark:'★',name:'说服'},{mark:'★',name:'心理学。(用一到两种外语取代前面两种技能)'}] },
  { seq:117, name:'运动员（游泳/潜水）', cr_range:'9-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'攀爬'},{mark:'★',name:'跳跃'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'外语①'},{mark:'★',name:'游泳'},{mark:'★',name:'投掷'}] },
  { seq:118, name:'运动员（高尔夫）', cr_range:'50-70', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'攀爬'},{mark:'★',name:'跳跃'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'骑术'},{mark:'★',name:'游泳'},{mark:'★',name:'投掷'}] },
  { seq:119, name:'运动员（网球）', cr_range:'30-70', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'跳跃'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'闪避'},{mark:'★',name:'心理学'},{mark:'★',name:'侦察'},{mark:'★',name:'投掷'}] },
  { seq:120, name:'运动员（田径）', cr_range:'9-20', skill_formula:'教育×2＋力量或敏捷×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'攀爬'},{mark:'★',name:'跳跃'},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'外语①'},{mark:'★',name:'闪避'},{mark:'★',name:'投掷'}] },
  { seq:121, name:'发言人', cr_range:'50-80', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:3},{mark:'☆',name:'话术',group:'g0',count:3},{mark:'☆',name:'恐吓',group:'g0',count:3},{mark:'☆',name:'说服',group:'g0',count:3},{mark:'★',name:'乔装'},{mark:'★',name:'闪避'},{mark:'★',name:'心理学'},{mark:'★',name:'外语①'}] },
  { seq:122, name:'保释担保人', cr_range:'50-80', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'会计'},{mark:'★',name:'法律'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'心理学'}] },
  { seq:123, name:'神职人员(天主教牧师)', cr_range:'20-70', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'母语'},{mark:'★',name:'外语(拉丁文)'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'神秘学'},{mark:'★',name:'心理学'}] },
  { seq:124, name:'神职人员(新教牧师)', cr_range:'9-60', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'会计'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'聆听'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'}] },
  { seq:125, name:'神职人员(犹太教拉比)', cr_range:'9-60', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'母语'},{mark:'★',name:'外语（希伯来语）'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'神秘学'},{mark:'★',name:'心理学'}] },
  { seq:126, name:'专栏作家', cr_range:'30-70', skill_formula:'教育×4', skills:[{mark:'☆',name:'取悦',group:'g0',count:1},{mark:'☆',name:'话术',group:'g0',count:1},{mark:'☆',name:'恐吓',group:'g0',count:1},{mark:'☆',name:'说服',group:'g0',count:1},{mark:'★',name:'乔装'},{mark:'★',name:'历史'},{mark:'★',name:'图书馆使用'},{mark:'★',name:'母语'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'},{mark:'★',name:'潜行'}] },
  { seq:127, name:'社会主义者/激进主义者', cr_range:'0-30', skill_formula:'教育×2＋外貌或意志×2', skills:[{mark:'☆',name:'取悦',group:'g0',count:2},{mark:'☆',name:'话术',group:'g0',count:2},{mark:'☆',name:'恐吓',group:'g0',count:2},{mark:'☆',name:'说服',group:'g0',count:2},{mark:'★',name:'格斗①',spec:'斗殴'},{mark:'★',name:'射击①',spec:'手枪'},{mark:'★',name:'外语①'},{mark:'★',name:'心理学'}] },
];

const WEAPONS_1920S = [
  { name: '弓箭', skill: '弓', skillId: '射击①', damage: '1D6+半DB', range: '30码', impale: '×', attacks: '1', ammo: '1', malfunction: '97', rare: false },
  { name: '黄铜指虎', skill: '斗殴', skillId: '格斗①', damage: '1D3+1+DB', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '长鞭', skill: '鞭子', skillId: '格斗①', damage: '1D3+半DB', range: '10英尺', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '燃烧的火把', skill: '斗殴', skillId: '格斗①', damage: '1D6+燃烧', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '包皮铁棍(甩棍、大头棍、护身棒)', skill: '斗殴', skillId: '格斗①', damage: '1D8+DB', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '大型棍状物(棒球棍、板球棒、拨火棍等)', skill: '斗殴', skillId: '格斗①', damage: '1D8+DB', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '小型棍状物(警棍等)', skill: '斗殴', skillId: '格斗①', damage: '1D6+DB', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '弩', skill: '弓', skillId: '射击①', damage: '1D8+2', range: '50码', impale: '√', attacks: '1/2', ammo: '1', malfunction: '96', rare: false },
  { name: '绞具', skill: '绞具', skillId: '格斗①', damage: '1D6+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '手斧/镰刀', skill: '斧', skillId: '格斗①', damage: '1D6+1+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '大型刀具(甘蔗刀等)', skill: '斗殴', skillId: '格斗①', damage: '1D8+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '中型刀具(切肉菜刀等)', skill: '斗殴', skillId: '格斗①', damage: '1D4+2+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '小型刀具(弹簧折叠刀等)', skill: '斗殴', skillId: '格斗①', damage: '1D4+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '催泪瓦斯', skill: '斗殴', skillId: '格斗①', damage: '眩晕', range: '6英尺', impale: '×', attacks: '1', ammo: '25次', malfunction: '——', rare: false },
  { name: '双节棍', skill: '链枷', skillId: '格斗①', damage: '1D8+DB', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '投石', skill: '投掷', skillId: '投掷', damage: '1D4+半DB', range: 'STR英尺', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '手里剑', skill: '投掷', skillId: '投掷', damage: '1D3+半DB', range: '20码', impale: '√', attacks: '2', ammo: '一次性', malfunction: '100', rare: false },
  { name: '矛、骑士长枪', skill: '矛', skillId: '格斗①', damage: '1D8+1', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '大型剑（马刀）', skill: '剑', skillId: '格斗①', damage: '1D8+1+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '中型剑（佩剑、重剑）', skill: '剑', skillId: '格斗①', damage: '1D6+1+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '轻型剑（花剑、剑杖）', skill: '剑', skillId: '格斗①', damage: '1D6+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '伐木斧', skill: '斧', skillId: '格斗①', damage: '1D8+2+DB', range: '接触', impale: '√', attacks: '1', ammo: '——', malfunction: '——', rare: false },
  { name: '.22(5.6mm)小型自动手枪', skill: '手枪', skillId: '射击①', damage: '1D6', range: '10', impale: '√', attacks: '1(3)', ammo: '6', malfunction: '100', rare: false },
  { name: '.25(6.35mm)短口手枪(单管)', skill: '手枪', skillId: '射击①', damage: '1D6', range: '3', impale: '√', attacks: '1', ammo: '1', malfunction: '100', rare: false },
  { name: '.32(7.65mm)左轮手枪', skill: '手枪', skillId: '射击①', damage: '1D8', range: '15', impale: '√', attacks: '1(3)', ammo: '6', malfunction: '100', rare: false },
  { name: '.32(7.65mm)自动手枪', skill: '手枪', skillId: '射击①', damage: '1D8', range: '15', impale: '√', attacks: '1(3)', ammo: '8', malfunction: '99', rare: false },
  { name: '.38(9mm)左轮手枪', skill: '手枪', skillId: '射击①', damage: '1D10', range: '15', impale: '√', attacks: '1(3)', ammo: '6', malfunction: '100', rare: false },
  { name: '.38(9mm)自动手枪', skill: '手枪', skillId: '射击①', damage: '1D10', range: '15', impale: '√', attacks: '1(3)', ammo: '8', malfunction: '99', rare: false },
  { name: '9mm 鲁格 P08', skill: '手枪', skillId: '射击①', damage: '1D10', range: '15', impale: '√', attacks: '1(3)', ammo: '8', malfunction: '99', rare: false },
  { name: '.45(11.43mm) 左轮手枪', skill: '手枪', skillId: '射击①', damage: '1D10+2', range: '15', impale: '√', attacks: '1(3)', ammo: '6', malfunction: '100', rare: false },
  { name: '.45(11.43mm) 自动手枪', skill: '手枪', skillId: '射击①', damage: '1D10+2', range: '15', impale: '√', attacks: '1(3)', ammo: '7', malfunction: '100', rare: false },
  { name: '.22 (5.6mm)栓式枪机步枪', skill: '步枪/霰弹枪', skillId: '射击①', damage: '1D6+1', range: '30', impale: '√', attacks: '1', ammo: '6', malfunction: '99', rare: false },
  { name: '.30 (7.62mm)杠杆式枪机步枪', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6', range: '50', impale: '√', attacks: '1', ammo: '6', malfunction: '98', rare: false },
  { name: '.45 马提尼·亨利步枪', skill: '步枪/霰弹枪', skillId: '射击①', damage: '1D8+1D6+3', range: '80', impale: '√', attacks: '1/3', ammo: '1', malfunction: '100', rare: false },
  { name: '莫兰上校的气动步枪', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6+1', range: '20', impale: '√', attacks: '1/3', ammo: '1', malfunction: '88', rare: false },
  { name: '加兰德M1、M2步枪', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6+4', range: '110', impale: '√', attacks: '1', ammo: '8', malfunction: '100', rare: false },
  { name: '.303 (7.7mm) 李·恩菲尔德', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6+4', range: '110', impale: '√', attacks: '1', ammo: '10', malfunction: '100', rare: false },
  { name: '.30——06 (7.62mm) 栓式枪机步枪', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6+4', range: '110', impale: '√', attacks: '1', ammo: '5', malfunction: '100', rare: false },
  { name: '猎象枪(双管)', skill: '步枪/霰弹枪', skillId: '射击①', damage: '3D6+4', range: '100', impale: '√', attacks: '1 or 2', ammo: '2', malfunction: '100', rare: false },
  { name: '20 号霰弹枪(双管)', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6/1D6/1D3', range: '10/20/50', impale: '×', attacks: '1 or 2', ammo: '2', malfunction: '100', rare: false },
  { name: '16 号霰弹枪(双管)', skill: '步枪/霰弹枪', skillId: '射击①', damage: '2D6+2/1D6+1/1D4', range: '10/20/50', impale: '×', attacks: '1 or 2', ammo: '2', malfunction: '100', rare: false },
  { name: '12 号霰弹枪(双管)', skill: '步枪/霰弹枪', skillId: '射击①', damage: '4D6/2D6/1D6', range: '10/20/50', impale: '×', attacks: '1 or 2', ammo: '2', malfunction: '100', rare: false },
  { name: '12 号霰弹枪(泵动)', skill: '步枪/霰弹枪', skillId: '射击①', damage: '4D6/2D6/1D6', range: '10/20/50', impale: '×', attacks: '1', ammo: '5', malfunction: '100', rare: false },
  { name: '12 号霰弹枪(双管,锯短)', skill: '步枪/霰弹枪', skillId: '射击①', damage: '4D6/1D6', range: '5/10', impale: '×', attacks: '1 or 2', ammo: '2', malfunction: '100', rare: false },
  { name: 'MP18I/MP28II', skill: '冲锋枪', skillId: '射击①', damage: '1D10', range: '20', impale: '√', attacks: '1(2)or全自动', ammo: '20/30/32', malfunction: '96', rare: false },
  { name: '汤普森冲锋枪', skill: '冲锋枪', skillId: '射击①', damage: '1D10+2', range: '20', impale: '√', attacks: '1or全自动', ammo: '20/30/50', malfunction: '96', rare: false },
  { name: 'M1918 式勃朗宁自动步枪', skill: '机枪', skillId: '射击①', damage: '2D6+4', range: '90', impale: '√', attacks: '1(2)or全自动', ammo: '20', malfunction: '100', rare: false },
  { name: '勃朗宁 M1917A1(7.62mm)', skill: '机枪', skillId: '射击①', damage: '2D6+4', range: '150', impale: '√', attacks: '全自动', ammo: '250', malfunction: '96', rare: false },
  { name: '布伦轻机枪', skill: '机枪', skillId: '射击①', damage: '2D6+4', range: '110', impale: '√', attacks: '1or全自动', ammo: '30/100', malfunction: '96', rare: false },
  { name: '路易斯Ⅰ型机枪', skill: '机枪', skillId: '射击①', damage: '2D6+4', range: '110', impale: '√', attacks: '全自动', ammo: '27/97', malfunction: '96', rare: false },
  { name: '维克斯.303 机枪', skill: '机枪', skillId: '射击①', damage: '2D6+4', range: '110', impale: '√', attacks: '全自动', ammo: '250', malfunction: '99', rare: false },
  { name: '莫洛托夫燃烧瓶', skill: '投掷', skillId: '投掷', damage: '2D6+燃烧', range: 'STR码', impale: '√', attacks: '1/2', ammo: '一次性', malfunction: '95', rare: false },
  { name: '信号枪(信号弹枪)', skill: '手枪', skillId: '射击①', damage: '1D10+1D3+燃烧', range: '10', impale: '√', attacks: '1/2', ammo: '1', malfunction: '100', rare: false },
  { name: '炸药棒', skill: '投掷', skillId: '投掷', damage: '4D10/3码', range: 'STR英尺', impale: '√', attacks: '1/2', ammo: '一次性', malfunction: '99', rare: false },
  { name: '雷管', skill: '电气维修', skillId: '格斗①', damage: '2D10/1码', range: 'N/A', impale: '√', attacks: 'N/A', ammo: '一次性', malfunction: '100', rare: false },
  { name: '爆破筒', skill: '爆破', skillId: '格斗①', damage: '1D10/3码', range: '就地', impale: '√', attacks: '一次使用', ammo: '一次性', malfunction: '95', rare: false },
  { name: '手榴弹', skill: '投掷', skillId: '投掷', damage: '4D10/3码', range: 'STR英尺', impale: '√', attacks: '1/2', ammo: '一次性', malfunction: '99', rare: false },
  { name: '75mm野战火炮', skill: '炮术', skillId: '格斗①', damage: '10D10/2码', range: '500码', impale: '√', attacks: '1/4', ammo: '独立装弹', malfunction: '99', rare: false },
  { name: '反步兵地雷', skill: '爆破', skillId: '格斗①', damage: '4D10/5码', range: '就地', impale: '√', attacks: '布置', ammo: '一次性', malfunction: '99', rare: false },
  { name: '火焰喷射器', skill: '喷射器', skillId: '格斗①', damage: '2D6+燃烧', range: '25码', impale: '√', attacks: '1', ammo: '至少10', malfunction: '93', rare: false },
];

// ---------- 武器分类 ----------
function getWeaponCategory(w) {
  const meleeSkills = ['斗殴', '剑', '斧', '矛', '鞭子', '绞具', '链枷', '电锯'];
  if (meleeSkills.includes(w.skill)) return '🗡️ 近战';
  if (w.skill === '手枪') return '🔫 手枪';
  if (w.skill === '步枪/霰弹枪') return '🎯 步枪';
  if (w.skill === '冲锋枪') return '💥 冲锋枪';
  if (w.skill === '机枪') return '🎪 机枪';
  if (w.skill === '弓') return '🏹 弓弩';
  if (['投掷', '爆破', '炮术'].includes(w.skill)) return '💣 爆炸';
  return '🔥 特殊';
}
function groupWeapons(list) {
  const map = {};
  for (const w of list) {
    const cat = getWeaponCategory(w);
    if (!map[cat]) map[cat] = [];
    map[cat].push(w);
  }
  const order = ['🗡️ 近战', '🔫 手枪', '🎯 步枪', '💥 冲锋枪', '🎪 机枪', '🏹 弓弩', '💣 爆炸', '🔥 特殊'];
  return order.filter(c => map[c]).map(c => ({ cat: c, weapons: map[c] }));
}

// ---------- 工具函数 ----------
function calcOccPoints(formula, edu, app, dex, str) {
  if (!formula) return edu * 4;
  // 教育×4
  if (formula.includes('教育×4')) return edu * 4;
  // 教育×2＋敏捷×2
  if (formula.includes('教育×2') && formula.includes('敏捷×2')) return edu * 2 + dex * 2;
  // 教育×2＋外貌×2
  if (formula.includes('教育×2') && formula.includes('外貌×2')) return edu * 2 + app * 2;
  // 教育×2＋力量×2
  if (formula.includes('教育×2') && formula.includes('力量×2')) return edu * 2 + str * 2;
  // 教育×2＋力量或敏捷×2
  if (formula.includes('或敏捷') || formula.includes('或力量')) return edu * 2 + Math.max(str * 2, dex * 2);
  // 教育×2＋外貌或意志×2
  if (formula.includes('或意志') || formula.includes('外貌或')) return edu * 2 + Math.max(app * 2, (app * 2)); // 意志=POW, not available here, use APP
  // 教育×2＋敏捷或外貌×2
  if (formula.includes('敏捷或外貌')) return edu * 2 + Math.max(dex * 2, app * 2);
  // Default
  return edu * 4;
}

function getSkillBase(name, edu, dex, specs) {
  if (name === '母语') return edu;
  if (name === '闪避') return Math.floor(dex / 2);
  const sk = ALL_SKILLS.find(s => s.name === name);
  if (!sk) return 0;
  // If spec skill with selected option, use option-specific base
  if (specs && sk.spec && sk.spec.options) {
    const chosen = specs[name];
    if (chosen) {
      const opt = sk.spec.options.find(o => o.name === chosen);
      if (opt) return opt.base;
    }
  }
  return sk.base;
}

function roll3D6x5() {
  const rolls = [];
  for (let i = 0; i < 3; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  const sum = rolls.reduce((a, b) => a + b, 0);
  return { value: sum * 5, rolls };
}

function roll2D6plus6x5() {
  const rolls = [];
  for (let i = 0; i < 2; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  const sum = rolls.reduce((a, b) => a + b, 0) + 6;
  return { value: sum * 5, rolls };
}

function makeAttrDisplay(values) {
  const labels = { str:'力量 STR', con:'体质 CON', dex:'敏捷 DEX', app:'外貌 APP', pow:'意志 POW', siz:'体型 SIZ', int:'智力 INT', edu:'教育 EDU', luck:'幸运 LUCK' };
  return Object.keys(labels).map(k => {
    const v = values[k] || 0;
    return { label: labels[k], value: v, hard: Math.floor(v / 2), extreme: Math.floor(v / 5) };
  });
}

// 属性描述文案字典
const traits_dictionary = {
  SIZ: [
    '身材极其矮小瘦弱，如同未发育的孩童',   // 1-19
    '身形相对娇小单薄',                      // 20-39
    '有着一副并不惹眼的普通中等身材',        // 40-59
    '体格高大魁梧',                          // 60-79
    '宛如一尊极具压迫感的铁塔，体型庞大'     // 80+
  ],
  APP: [
    '，容貌令人不敢直视，甚至带有某种可憎的缺陷。', // 1-19
    '，样貌平庸且不修边幅。',                       // 20-39
    '，长相大众化，很容易隐入人群中。',             // 40-59
    '，容貌出众，举手投足间散发着迷人的魅力。',     // 60-79
    '，拥有着惊为天人的完美容颜，让人无法移开视线。' // 80+
  ],
  CON: [
    '你的身体羸弱不堪，常年被病痛折磨，',     // 1-19
    '你的健康状况欠佳，很容易感到疲惫，',     // 20-39
    '你有着普通人的健康体魄，',               // 40-59
    '你的精力十分充沛，身体结实耐造，',       // 60-79
    '你简直拥有钢铁般的强韧之躯，几乎百病不侵，' // 80+
  ],
  STR: [
    '连提起稍微重一点的物品都显得极其吃力。', // 1-19
    '力气略逊于常人，无法胜任重体力活。',     // 20-39
    '力量表现中规中矩，和常人无异。',         // 40-59
    '肌肉线条分明，蕴含着远超常人的爆发力。', // 60-79
    '天生神力，举手投足间具备着可怕的破坏力。' // 80+
  ],
  DEX: [
    '平时行动时，你极其笨拙，步履蹒跚，甚至容易平地摔跤。',   // 1-19
    '你的肢体显得有些僵硬，反应总是慢人半拍。',              // 20-39
    '你的灵活性普通，能够应付大多数日常的行动需求。',         // 40-59
    '你身手敏捷，反应迅速，动作如行云流水般利落。',          // 60-79
    '你的身体柔韧如猫，具备着几乎能够媲美杂技演员的惊人协调性。' // 80+
  ],
  INT: [
    '在心智方面，你对复杂事物的理解极其迟缓',           // 1-19
    '虽然你的反应不够灵敏，学习新事物颇为吃力',         // 20-39
    '你拥有着正常水平的逻辑能力',                      // 40-59
    '你极其聪明机警，思维敏捷得像一台精密的仪器',       // 60-79
    '你无疑是个绝顶天才，能够轻易洞察隐秘事物的本质'    // 80+
  ],
  EDU: [
    '，并且几乎毫无常识，宛如一张未受过教育的白纸。',           // 1-19
    '，脑海中仅有最基础的生活常识，早早就告别了校园。',         // 20-39
    '，接受过标准的教育，具备成年人应有的常识体系。',           // 40-59
    '，而且受过良好的高等教育，学识渊博，谈吐不凡。',           // 60-79
    '，庞大的知识储备让你如同行走的百科全书，在学术界也堪称泰斗。' // 80+
  ],
  POW: [
    '然而，你的内心极其脆弱，面对未知极易陷入恐慌或被他人暗示操控。',       // 1-19
    '在遭遇变故时，你时常优柔寡断，意志力略显薄弱。',                      // 20-39
    '你的精神状态相对稳定，能够在大多数危机中保持理智。',                  // 40-59
    '你意志坚定，即使面对不可名状的恐惧，也不易被动摇本心。',              // 60-79
    '更可怕的是你那钢铁般的意志，或者说近乎狂热的信仰，足以让你直面深渊而不退缩。' // 80+
  ]
};

function getTraitIndex(value) {
  if (value < 20) return 0;
  if (value < 40) return 1;
  if (value < 60) return 2;
  if (value < 80) return 3;
  return 4;
}

function generateAttrDesc(values) {
  const v = (k) => values[k] || 0;
  const idx = (k) => getTraitIndex(v(k));
  const siz = traits_dictionary.SIZ[idx('siz')];
  const app = traits_dictionary.APP[idx('app')];
  const con = traits_dictionary.CON[idx('con')];
  const str = traits_dictionary.STR[idx('str')];
  const dex = traits_dictionary.DEX[idx('dex')];
  const int = traits_dictionary.INT[idx('int')];
  const edu = traits_dictionary.EDU[idx('edu')];
  const pow = traits_dictionary.POW[idx('pow')];
  return `一眼望去，你${siz}${app} ${con}${str} ${dex} ${int}${edu} ${pow}`;
}

function calcDB(strSiz) {
  // COC7 规则：STR + SIZ 总和查表
  if (strSiz <= 64)  return { db: '-2', build: -2 };
  if (strSiz <= 84)  return { db: '-1', build: -1 };
  if (strSiz <= 124) return { db: '0', build: 0 };
  if (strSiz <= 164) return { db: '+1D4', build: 1 };
  if (strSiz <= 204) return { db: '+1D6', build: 2 };
  return { db: '+2D6', build: 3 };
}

function makeDerivedItems(d) {
  return [
    { l: '生命 HP', v: d.hp },
    { l: '理智 SAN', v: d.san },
    { l: '魔法 MP', v: d.mp },
    { l: '伤害加值', v: d.db },
    { l: '体格', v: d.build },
    { l: '移动力', v: d.mov },
  ];
}

function detectAgeModType(age) {
  if (age >= 15 && age <= 19) return 'teen';
  if (age >= 40) return 'decay';
  return 'none';
}

function getAgeDecay(age) {
  if (age >= 80) return 80;
  if (age >= 70) return 40;
  if (age >= 60) return 20;
  if (age >= 50) return 10;
  if (age >= 40) return 5;
  return 0;
}

function getAppDecay(age) {
  if (age >= 80) return 25;
  if (age >= 70) return 20;
  if (age >= 60) return 15;
  if (age >= 50) return 10;
  if (age >= 40) return 5;
  return 0;
}

function getAgeMov(age) {
  if (age >= 80) return 3;
  if (age >= 70) return 4;
  if (age >= 60) return 5;
  if (age >= 50) return 6;
  if (age >= 40) return 7;
  return 8;
}

function applyAgeModifiers(age, attrVals, choice, alloc) {
  var v = {};
  for (var k in attrVals) v[k] = attrVals[k];
  var summary = [];

  var eduGrowth = function(edu) {
    var result = edu;
    for (var i = 0; i < 10; i++) {
      var roll = Math.floor(Math.random() * 100) + 1;
      if (roll > result || roll === 100) {
        var gain = Math.floor(Math.random() * 10) + 1;
        result = Math.min(99, result + gain);
        summary.push('教育成长 +' + gain + ' (' + edu + '→' + result + ')');
      } else { break; }
    }
    return result;
  };

  if (age >= 15 && age <= 19) {
    if (choice === 'str') { v.str = Math.max(0, v.str - 5); summary.push('力量 -5'); }
    else if (choice === 'siz') { v.siz = Math.max(0, v.siz - 5); summary.push('体型 -5'); }
    if (v.edu > 0) v.edu = Math.max(0, v.edu - 5);
    summary.push('教育 -5');
    var r1 = roll3D6x5().value;
    var r2 = roll3D6x5().value;
    v.luck = Math.max(r1, r2);
    summary.push('幸运重投 ' + r1 + ' vs ' + r2 + ' → ' + v.luck);
  } else if (age >= 20 && age <= 39) {
    v.edu = eduGrowth(v.edu);
  } else if (age >= 40) {
    var eduTimes = (age >= 60) ? 4 : (age >= 50) ? 3 : (age >= 40) ? 2 : 0;
    for (var i = 0; i < eduTimes; i++) v.edu = eduGrowth(v.edu);
    if (alloc) {
      v.str = Math.max(0, v.str - (alloc.str || 0));
      v.con = Math.max(0, v.con - (alloc.con || 0));
      v.dex = Math.max(0, v.dex - (alloc.dex || 0));
    }
    var appD = getAppDecay(age);
    if (v.app > 0) v.app = Math.max(0, v.app - appD);
    summary.push('外貌 -' + appD);
  }

  var mov = getAgeMov(age);
  return { attrValues: v, summary: summary.join('；'), mov: mov };
}

function getAgeMods(age) {
  if (age < 20) return { mov: 0 };
  if (age < 40) return { mov: 0 };
  if (age < 50) return { mov: -1 };
  if (age < 60) return { mov: -2 };
  if (age < 70) return { mov: -3 };
  if (age < 80) return { mov: -4 };
  return { mov: -5 };
}

// ========== Page ==========
Page({
  data: {
    // 步骤
    step: 0,
    // 已保存角色列表
    savedCharacters: [],
    isCompleted: false,
    savedAt: 0,
    playLuck: 50,
    // 游玩模式
    playMode: false,
    playHP: 0,
    playSAN: 0,
    playMP: 0,
    maxSAN: 0,
    maxMP: 0,
    majorWound: false,
    rollSkill: null,
    rollResult: null,
    rollBonus: 0,
    showRollDialog: false,
    tickedSkills: {},
    showGrowth: false,
    growthPhase: 0,
    growthSkills: [],
    growthResults: [],
    growthReached90: false,
    growthSANBonus: 0,
    growthSANOld: 0,
    growthSANMax: 99,
    growthLuckOld: 0,
    growthLuckGain: 0,
    growthSANInput: 0,
    growthLuckRoll: 0,
    growthLuckSuccess: false,
    growthLuckNew: 0,
    growthCredInput: 0,
    growthLocked: false,
    // 困难和极难数值显示开关
    showThresholds: false,
    // 导出弹窗开关
    showExportDialog: false,
    // 编辑模式（从完成页返回修改时启用，移除点数限制）
    overrideLimits: false,
    // 属性掷骰
    attrLabels: { str:'力量 STR', con:'体质 CON', dex:'敏捷 DEX', app:'外貌 APP', pow:'意志 POW', siz:'体型 SIZ', int:'智力 INT', edu:'教育 EDU', luck:'幸运 LUCK' },
    attrValues: { str: 0, con: 0, dex: 0, app: 0, pow: 0, siz: 0, int: 0, edu: 0, luck: 0 },
    attrDisplay: [],
    attrRolls: { str: '', con: '', dex: '', app: '', pow: '', siz: '', int: '', edu: '', luck: '' },
    attrDiceRolling: '',
    rolled: { str: false, con: false, dex: false, app: false, pow: false, siz: false, int: false, edu: false, luck: false },
    allRolled: false,
    attrDesc: '',
    // 基础信息
    charInfo: { name: '', player: '', age: '25', gender: '男', era: '1920s' },
    ageModSummary: '',
    needAgeMod: false,
    ageModDone: false,
    showAgeModDialog: false,
    ageModType: '',
    ageModDecay: 0,
    ageModChoice: '',
    ageModBase: {},
    ageModAlloc: { str: 0, con: 0, dex: 0 },
    ageModRemaining: 0,
    ageRange: [], ageIndex: 10, genderIndex: 0,
    eras: ['1920s', '现代', '维多利亚', '1990s'], eraIndex: 0,
    // 职业选择
    occSearch: '',
    selectedOcc: null,           // 当前选中的职业
    selectedOptSkills: {},       // 已选可选技能: { skillName: true }
    filteredOccs: [],
    occSkillsText: '',
    occFixedSkills: [],         // 职业固定技能列表
    occSpecRequired: [],        // 必须选择专攻的技能名列表
    occSpecMissing: [],         // 尚未选择专攻的技能名列表
    // 技能分配（双池：职业技能点 + 兴趣技能点）
    occPts: {},           // 各技能分配的职业技能点
    intPts: {},           // 各技能分配的兴趣技能点
    skillSpecs: {},       // 专攻选择: { '技艺①': '美术', '母语': '英语' }
    usedOccPoints: 0, totalOccPoints: 0,
    usedIntPoints: 0, totalIntPoints: 0,
    skillGroups: [],        // 按分类分组的技能列表
    // 技能 dialog (slider)
    dialogSkill: null,      // 当前编辑的技能信息
    dialogOccVal: 0,        // 职业技能 slider 值
    dialogIntVal: 0,        // 兴趣技能 slider 值
    dialogOccMax: 0,
    dialogIntMax: 0,
    dialogBase: 0,
    dialogSpecIndex: 0,
    dialogReadonly: false,
    showDialog: false,
    // 导航
    canNext: false,
    showSaveSuccess: false,
    // 武器
    charWeapons: [],           // 角色已装备武器 [{name, skill, damage, range, ammo, ...}]
    showWeaponPicker: false,   // 武器选择 dialog
    weaponSearch: '',          // 武器搜索
    filteredWeapons: [],       // 武器搜索结果
    weaponGroups: [],          // 分组武器列表
    showCustomWeapon: false,   // 自定义武器表单
    customWName: '', customWSkill: '', customWDamage: '', customWRange: '',
    customWAttacks: '1', customWAmmo: '', customWMalfunction: '100', customWImpale: '√',
    // 角色卡文本字段
    charBackstory: '',         // 背景故事
    charGear: '',              // 随身物品
    charMythos: '',            // 神话相关
    charSpells: '',            // 法术
    charCompanions: '',        // 调查员伙伴
    // 角色卡预览
    derived: { hp: 0, san: 0, mp: 0, db: '+0', build: 0, mov: 8 },
    sortedSkillsByCat: [],
    derivedItems: [],
    catLabels: CAT_LABELS,
    catOrder: CAT_ORDER,

    // 掷骰模块（游玩模式）
    diceSelected: {},
    diceRolling: false,
    diceResult: null,
    diceHistory: [],
  },

  // ==================== 生命周期 ====================
  onLoad() {
    const ages = [];
    for (let i = 15; i <= 90; i++) ages.push(i + '岁');
    this.setData({ ageRange: ages, ageIndex: 10 });
    this.loadSavedList();
  },
  onShow() { this.loadSavedList(); },

  // ==================== 本地存储 ====================
  loadSavedList() {
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      this.setData({ savedCharacters: list });
    } catch (e) { this.setData({ savedCharacters: [] }); }
  },

  // ==================== STEP 0 ====================
  startNewCharacter() {
    // 计算所有职业的技能点显示
    const edu = this.data.attrValues.edu || 50;
    const app = this.data.attrValues.app || 50;
    const dex = this.data.attrValues.dex || 50;
    const str = this.data.attrValues.str || 50;
    const int = this.data.attrValues.int || 50;

    const occsWithPoints = OCCUPATIONS.map(o => ({
      ...o,
      occPointValue: calcOccPoints(o.skill_formula, edu, app, dex, str),
      intPointValue: int * 2,
    }));

    this.setData({
      step: 1,
      attrValues: { str: 0, con: 0, dex: 0, app: 0, pow: 0, siz: 0, int: 0, edu: 0, luck: 0 },
      attrDisplay: [],
      attrRolls: { str: '', con: '', dex: '', app: '', pow: '', siz: '', int: '', edu: '', luck: '' },
      rolled: { str: false, con: false, dex: false, app: false, pow: false, siz: false, int: false, edu: false, luck: false },
      allRolled: false,
      charInfo: { name: '', player: '', age: '25', gender: '男', era: '1920s' },
      ageIndex: 10, genderIndex: 0, eraIndex: 0,
      selectedOcc: null, occSearch: '', occSkillsText: '',
      occFixedSkills: [], occSpecRequired: [], occSpecMissing: [],
      occPts: {}, intPts: {}, skillSpecs: {}, usedOccPoints: 0, totalOccPoints: 0, usedIntPoints: 0, totalIntPoints: 0,
      skillGroups: [], dialogSkill: null, showDialog: false, canNext: false, overrideLimits: false,
    });
  },

  loadCharacter(e) {
    const idx = e.currentTarget.dataset.index;
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      if (idx < 0 || idx >= list.length) return;
      const char = list[idx];
      // 恢复并构建预览技能
      const pSkills = this.buildPreviewSkills(char.occPts || {}, char.intPts || {}, char.attrValues);
      const d = char.derived || { hp: 0, san: 0, mp: 0, db: '+0', build: 0, mov: 8 };
      const derivedItems = makeDerivedItems(d);
      const attrVals = char.attrValues || { str: 0, con: 0, dex: 0, app: 0, pow: 0, siz: 0, int: 0, edu: 0, luck: 0 };
      this.setData({
        step: 5,
        attrValues: attrVals,
        attrDisplay: makeAttrDisplay(attrVals),
        attrDesc: char.attrDesc || generateAttrDesc(attrVals),
        attrRolls: char.attrRolls || {},
        rolled: { str: true, con: true, dex: true, app: true, pow: true, siz: true, int: true, edu: true },
        allRolled: true,
        charInfo: char.charInfo || { name: '', player: '', age: '25', gender: '男', era: '1920s' },
        selectedOcc: char.selectedOcc || null,
        occPts: char.occPts || {}, intPts: char.intPts || {}, skillSpecs: char.skillSpecs || {},
        usedOccPoints: char.usedOccPoints || 0, totalOccPoints: char.totalOccPoints || 0,
        usedIntPoints: char.usedIntPoints || 0, totalIntPoints: char.totalIntPoints || 0,
        derived: d,
        derivedItems: derivedItems,
        sortedSkillsByCat: pSkills,
        _loadIndex: idx,
        isCompleted: char.completed || false,
        tickedSkills: char.tickedSkills || {},
        charWeapons: char.charWeapons || [],
        charBackstory: char.charBackstory || '', charGear: char.charGear || '',
        charMythos: char.charMythos || '', charSpells: char.charSpells || '', charCompanions: char.charCompanions || '',
        playHP: char.playHP || d.hp,
        playSAN: char.playSAN || d.san,
        playMP: char.playMP || d.mp,
        playLuck: char.playLuck || attrVals.luck || 50,
        majorWound: char.majorWound || false,
        savedAt: char.timestamp || 0,
      });
    } catch (e) { wx.showToast({ title: '读取失败', icon: 'none' }); }
  },

  deleteCharacter(e) {
    const idx = e.currentTarget.dataset.index;
    const list = wx.getStorageSync('coc7_characters') || [];
    if (idx < 0 || idx >= list.length) return;
    wx.showModal({
      title: '确认删除', content: '确定要删除这个角色吗？',
      success: (res) => { if (res.confirm) { list.splice(idx, 1); wx.setStorageSync('coc7_characters', list); this.setData({ savedCharacters: list }); } }
    });
  },

  // ==================== 导入调查员 ====================
  importCharacter() {
    wx.getClipboardData({
      success: (res) => {
        try {
          const charData = JSON.parse(res.data);
          if (!charData.attrValues || !charData.charInfo) {
            wx.showToast({ title: '剪贴板内容不是有效的调查员数据', icon: 'none' });
            return;
          }
          charData.completed = true;
          charData.timestamp = Date.now();
          const list = wx.getStorageSync('coc7_characters') || [];
          list.push(charData);
          wx.setStorageSync('coc7_characters', list);
          this.setData({ savedCharacters: list });
          wx.showToast({ title: '✅ 导入成功', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '数据解析失败，请检查剪贴板内容', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '读取剪贴板失败，请先复制调查员数据', icon: 'none' });
      }
    });
  },

  // ==================== STEP 1：属性掷骰 ====================
  rollAllAttrs() {
    const attrs = ['str','con','dex','app','pow','siz','int','edu','luck'];
    attrs.forEach((a, i) => {
      setTimeout(() => {
        this.setData({ attrDiceRolling: a });
        const result = (a === 'siz' || a === 'int' || a === 'edu') ? roll2D6plus6x5() : roll3D6x5(); // luck also 3D6
        this.setData({
          attrValues: { ...this.data.attrValues, [a]: result.value },
          attrRolls: { ...this.data.attrRolls, [a]: result.rolls.join(',') },
          rolled: { ...this.data.rolled, [a]: true },
          attrDiceRolling: (i < attrs.length - 1) ? '' : '',
        });
        if (i === attrs.length - 1) this.setData({ allRolled: true, attrDiceRolling: '', canNext: true, attrDisplay: makeAttrDisplay(this.data.attrValues), attrDesc: generateAttrDesc(this.data.attrValues) });
      }, i * 300);
    });
  },
  rerollAttr(e) {
    const attr = e.currentTarget.dataset.attr;
    const result = (attr === 'siz' || attr === 'int' || attr === 'edu') ? roll2D6plus6x5() : roll3D6x5();
    this.setData({ attrDiceRolling: attr });
    setTimeout(() => {
      const newVal = { ...this.data.attrValues, [attr]: result.value };
      this.setData({ attrValues: newVal, attrRolls: { ...this.data.attrRolls, [attr]: result.rolls.join(',') }, attrDiceRolling: '', attrDisplay: makeAttrDisplay(newVal), attrDesc: generateAttrDesc(newVal) });
    }, 200);
  },

  // ==================== STEP 2：基础信息 ====================
  onCharInfoChange(e) { this.setData({ [`charInfo.${e.currentTarget.dataset.field}`]: e.detail.value }); this.checkStep2CanNext(); },
  onAgeChange(e) {
    const idx = parseInt(e.detail.value);
    const age = 15 + idx;
    const type = detectAgeModType(age);
    this.setData({
      ageIndex: idx, 'charInfo.age': age.toString(),
      needAgeMod: type !== 'none',
      ageModDone: false,
      ageModSummary: '',
      ageModType: type,
      ageModDecay: getAgeDecay(age),
      ageModChoice: '',
      ageModBase: { ...this.data.attrValues },
      ageModAlloc: { str: 0, con: 0, dex: 0 },
      ageModRemaining: getAgeDecay(age),
    });
    this.checkStep2CanNext();
  },
  onGenderChange(e) { this.setData({ genderIndex: parseInt(e.detail.value), 'charInfo.gender': ['男','女','其他'][parseInt(e.detail.value)] }); },
  onEraChange(e) { this.setData({ eraIndex: parseInt(e.detail.value), 'charInfo.era': ['1920s','现代','维多利亚','1990s'][parseInt(e.detail.value)] }); this.checkStep2CanNext(); },
  checkStep2CanNext() { this.setData({ canNext: this.data.charInfo.name.trim().length > 0 }); },

  // ==================== STEP 3：职业选择（合并职业 + 技能点数） ====================
  onOccSearch(e) {
    const val = e.detail.value;
    this.setData({ occSearch: val });
    this.filterOccs(val);
  },
  filterOccs(search) {
    const edu = this.data.attrValues.edu || 50;
    const app = this.data.attrValues.app || 50;
    const dex = this.data.attrValues.dex || 50;
    const str = this.data.attrValues.str || 50;
    const int = this.data.attrValues.int || 50;
    let list = OCCUPATIONS.map(o => ({
      ...o,
      occPointValue: calcOccPoints(o.skill_formula, edu, app, dex, str),
      intPointValue: int * 2,
    }));
    if (search) list = list.filter(o => o.name.includes(search));
    this.setData({ filteredOccs: list });
  },
  selectOccupation(e) {
    const idx = e.currentTarget.dataset.index;
    const occ = this.data.filteredOccs[idx];
    if (!occ) return;
    
    // Build display: separate fixed (★) and optional (☆)
    const fixedSkills = (occ.skills || []).filter(s => s.mark === '★');
    const optSkills = (occ.skills || []).filter(s => s.mark === '☆');
    
    // Group optional skills
    const optGroups = [];
    const seenGroups = {};
    optSkills.forEach(s => {
      const g = s.group || 'default';
      if (!seenGroups[g]) {
        seenGroups[g] = { group: g, count: s.count || 1, skills: [] };
        optGroups.push(seenGroups[g]);
      }
      seenGroups[g].skills.push({ name: s.name, selected: false, group: g });
    });
    
    const fixedText = fixedSkills.map(s => s.spec ? `${s.name}(${s.spec})` : s.name).join('、');
    const optText = optGroups.map(g =>
      `[选${g.count}项] ` + g.skills.map(s => s.name).join('、')
    ).join(' ； ');
    const skillsText = fixedText + (optText ? '\n▸ ' + optText : '');
    
    this.setData({
      selectedOcc: occ, canNext: true,
      occSkillsText: skillsText,
      occFixedSkills: fixedSkills,
      occOptGroups: optGroups,
      selectedOptSkills: {},
      // Auto-populate specs from occupation data and track required ones
      skillSpecs: this.buildInitialSpecs(fixedSkills),
      occSpecRequired: this.buildOccSpecRequired(fixedSkills),
    });
    // Compute initially missing specs (after auto-fill, should be empty)
    this.updateOccSpecMissing();
    this.calcSkillPoints(occ);
  },

  calcSkillPoints(occ) {
    const edu = this.data.attrValues.edu || 50;
    const int = this.data.attrValues.int || 50;
    const dex = this.data.attrValues.dex || 50;
    const str = this.data.attrValues.str || 50;
    const app = this.data.attrValues.app || 50;

    const occPoints = calcOccPoints(occ.skill_formula, edu, app, dex, str);
    const intPoints = int * 2;

    // 信用评级：根据职业CR范围自动用兴趣点加到最低值
    let crAutoPts = 0;
    if (occ.cr_range) {
      const m = occ.cr_range.match(/(\d+)-(\d+)/);
      if (m) {
        const crLo = parseInt(m[1]), crHi = parseInt(m[2]);
        const crMid = Math.round((crLo + crHi) / 2);
        const crBase = getSkillBase('信用评级', edu, dex); // 0
        crAutoPts = Math.max(0, crMid - crBase);
        crAutoPts = Math.min(crAutoPts, intPoints);
      }
    }

    const intPts = crAutoPts > 0 ? { '信用评级': crAutoPts } : {};

    this.setData({
      totalOccPoints: occPoints, totalIntPoints: intPoints,
      usedOccPoints: 0, usedIntPoints: crAutoPts, occPts: {}, intPts,
    });
    this.buildSkillList(occ);
  },

  buildSkillList(occ) {
    const occSkillNames = occ.skills.map(s => s.name);
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;

    // 按分类分组
    const groups = {};
    CAT_ORDER.forEach(c => { groups[c] = []; });

    ALL_SKILLS.forEach(sk => {
      const base = getSkillBase(sk.name, edu, dex, this.data.skillSpecs);
      const spec = this.data.skillSpecs[sk.name];
      const displayName = spec ? sk.name + '（' + spec + '）' : sk.name;
      const pts = (this.data.occPts[sk.name] || 0) + (this.data.intPts[sk.name] || 0);
      groups[sk.cat].push({
        name: sk.name,
        displayName: displayName,
        base: base,
        cat: sk.cat,
        isOcc: this.isOccSkill(sk.name),
        total: base + pts,
      });
    });

    // 转成数组
    const groupArray = CAT_ORDER.filter(c => groups[c].length > 0).map(c => ({
      catName: CAT_LABELS[c].label,
      cat: c,
      skills: groups[c],
    }));

    this.setData({ skillGroups: groupArray });
  },

  // Build initial skillSpecs from occupation's fixed skills
  buildInitialSpecs(fixedSkills) {
    const specs = { '母语': '英语' };
    fixedSkills.forEach(s => {
      if (s.spec) {
        specs[s.name] = s.spec;
      } else {
        // For options-type specs without occupation default, use first option name
        const skInfo = ALL_SKILLS.find(sk => sk.name === s.name);
        if (skInfo && skInfo.spec && skInfo.spec.options) {
          specs[s.name] = typeof skInfo.spec.options[0] === 'object' ? skInfo.spec.options[0].name : skInfo.spec.options[0];
        }
      }
    });
    return specs;
  },

  // Get list of fixed skills that have options-type spec (must be selected)
  buildOccSpecRequired(fixedSkills) {
    const required = [];
    fixedSkills.forEach(s => {
      const skInfo = ALL_SKILLS.find(sk => sk.name === s.name);
      if (skInfo && skInfo.spec && skInfo.spec.options) {
        required.push(s.name);
      }
    });
    return required;
  },

  // Get list of required specs that are not yet filled
  getMissingRequiredSpecs() {
    const specs = this.data.skillSpecs || {};
    const required = this.data.occSpecRequired || [];
    return required.filter(name => !specs[name]);
  },

  // Update occSpecMissing data for visual hint
  updateOccSpecMissing() {
    this.setData({ occSpecMissing: this.getMissingRequiredSpecs() });
  },

  isOccSkill(name) {
    if (!this.data.selectedOcc) return false;
    // ★ fixed occ skills
    if (this.data.selectedOcc.skills.some(s => s.name === name && s.mark === '★')) return true;
    // ☆ optional skills that have been selected
    if (this.data.selectedOcc.skills.some(s => s.name === name && s.mark === '☆')) {
      return !!this.data.selectedOptSkills[name];
    }
    return false;
  },

  toggleOptSkill(e) {
    const name = e.currentTarget.dataset.name;
    const opt = { ...this.data.selectedOptSkills };
    
    // Update occOptGroups display state
    const groups = this.data.occOptGroups.map(g => ({
      ...g,
      skills: g.skills.map(s => ({
        ...s,
        selected: s.name === name ? !s.selected : s.selected,
      })),
    }));
    
    if (opt[name]) {
      delete opt[name];
      const occPts = { ...this.data.occPts };
      delete occPts[name];
      this.setData({ selectedOptSkills: opt, occPts, occOptGroups: groups });
      this.recalcTotals();
    } else {
      opt[name] = true;
      this.setData({ selectedOptSkills: opt, occOptGroups: groups });
    }
    this.buildSkillList(this.data.selectedOcc);
  },

  recalcTotals() {
    const occPts = this.data.occPts || {};
    const intPts = this.data.intPts || {};
    let newUsedOcc = 0, newUsedInt = 0;
    for (const sk of ALL_SKILLS) {
      newUsedOcc += occPts[sk.name] || 0;
      newUsedInt += intPts[sk.name] || 0;
    }
    this.setData({ usedOccPoints: newUsedOcc, usedIntPoints: newUsedInt });
  },

  // ==================== STEP 4：技能分配（双池 slider） ====================
  openSkillDialog(e) {
    const name = e.currentTarget.dataset.name;
    const isOcc = this.isOccSkill(name);
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex);
    const curOcc = this.data.occPts[name] || 0;
    const curInt = this.data.intPts[name] || 0;
    const { usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;

    // 计算各 slider 最大可加值
    const safeOccPad = totalOccPoints - usedOccPoints + curOcc;  // 最多还能从职业池加的
    const safeIntPad = totalIntPoints - usedIntPoints + curInt;   // 最多还能从兴趣池加的
    const spaceTo100 = 100 - base - curOcc - curInt;              // 到 100% 还剩多少空间

    const maxOcc = isOcc ? Math.min(safeOccPad, spaceTo100 + curOcc) : 0;
    const maxInt = isOcc ? Math.min(safeIntPad, spaceTo100 + curInt) : Math.min(safeIntPad, spaceTo100 + curInt);

    const skInfo = ALL_SKILLS.find(s => s.name === name);
    const catName = CAT_LABELS[skInfo ? skInfo.cat : 'knowledge'].label;
    const spec = skInfo ? skInfo.spec : null;
    const currentSpec = spec ? (this.data.skillSpecs[name] || (spec.options ? spec.options[0].name : '')) : null;
    const dialogSpecIndex = spec && spec.options ? spec.options.findIndex(o => (o.name || o) === currentSpec) : 0;

    this.setData({
      dialogSkill: { name, isOcc, base, desc: skInfo ? skInfo.desc : '', catName, spec, currentSpec },
      dialogSpecIndex: Math.max(0, dialogSpecIndex),
      dialogOccVal: curOcc,
      dialogIntVal: curInt,
      dialogOccMax: overrideLimits ? 99 : Math.max(curOcc, maxOcc),
      dialogIntMax: overrideLimits ? 99 : Math.max(curInt, maxInt),
      dialogBase: base,
      showDialog: true,
      dialogReadonly: false,
    });
  },

  openSkillInfo(e) {
    const name = e.currentTarget.dataset.name;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex, this.data.skillSpecs);
    const total = base + (this.data.occPts[name] || 0) + (this.data.intPts[name] || 0);
    const skInfo = ALL_SKILLS.find(s => s.name === name);
    const catName = CAT_LABELS[skInfo ? skInfo.cat : 'knowledge'].label;
    this.setData({
      dialogSkill: { name, isOcc: false, base, desc: skInfo ? skInfo.desc : '', catName, currentVal: total },
      showDialog: true,
      dialogReadonly: true,
    });
  },

  closeSkillDialog() {
    this.setData({ showDialog: false, dialogSkill: null, dialogReadonly: false });
  },

  onOccSliderChange(e) {
    this.setData({ dialogOccVal: parseInt(e.detail.value) });
  },
  onIntSliderChange(e) {
    this.setData({ dialogIntVal: parseInt(e.detail.value) });
  },
  onSpecChange(e) {
    const idx = parseInt(e.detail.value);
    const name = this.data.dialogSkill.name;
    const spec = this.data.dialogSkill.spec;
    const chosen = spec && spec.options ? (typeof spec.options[idx] === 'object' ? spec.options[idx].name : spec.options[idx]) : '';
    // Recalculate base with new spec
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const newSkillSpecs = { ...this.data.skillSpecs, [name]: chosen };
    const newBase = getSkillBase(name, edu, dex, newSkillSpecs);
    const curOcc = this.data.occPts[name] || 0;
    const curInt = this.data.intPts[name] || 0;
    const { usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;
    const safeOccPad = totalOccPoints - usedOccPoints + curOcc;
    const safeIntPad = totalIntPoints - usedIntPoints + curInt;
    const isOcc = this.isOccSkill(name);
    const spaceTo100 = 100 - newBase - curOcc - curInt;
    const maxOcc = isOcc ? Math.min(safeOccPad, spaceTo100 + curOcc) : 0;
    const maxInt = isOcc ? Math.min(safeIntPad, spaceTo100 + curInt) : Math.min(safeIntPad, spaceTo100 + curInt);

    this.setData({
      'dialogSkill.currentSpec': chosen,
      'dialogSkill.base': newBase,
      dialogSpecIndex: idx,
      dialogBase: newBase,
      dialogOccMax: overrideLimits ? 99 : Math.max(curOcc, maxOcc),
      dialogIntMax: overrideLimits ? 99 : Math.max(curInt, maxInt),
      skillSpecs: newSkillSpecs,
    });
    this.updateOccSpecMissing();
    if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
  },
  onSpecTextInput(e) {
    const val = e.detail.value;
    const name = this.data.dialogSkill.name;
    this.setData({
      'dialogSkill.currentSpec': val,
      skillSpecs: { ...this.data.skillSpecs, [name]: val },
    });
    this.updateOccSpecMissing();
    if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
  },

  confirmSkillDialog() {
    const { dialogSkill, dialogOccVal, dialogIntVal } = this.data;
    if (!dialogSkill) return;
    const name = dialogSkill.name;
    const isOcc = dialogSkill.isOcc;
    const prevOcc = this.data.occPts[name] || 0;
    const prevInt = this.data.intPts[name] || 0;
    const newOcc = isOcc ? dialogOccVal : 0;
    const newInt = dialogIntVal;
    const diffOcc = newOcc - prevOcc;
    const diffInt = newInt - prevInt;
    if (diffOcc === 0 && diffInt === 0) { this.closeSkillDialog(); return; }

    const { usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;
    // 检查点数（编辑模式不限制）
    if (!overrideLimits && diffOcc > 0 && usedOccPoints + diffOcc > totalOccPoints) {
      wx.showToast({ title: '职业技能点不足', icon: 'none' }); return;
    }
    if (!overrideLimits && diffInt > 0 && usedIntPoints + diffInt > totalIntPoints) {
      wx.showToast({ title: '兴趣技能点不足', icon: 'none' }); return;
    }

    const occPts = { ...this.data.occPts, [name]: newOcc };
    const intPts = { ...this.data.intPts, [name]: newInt };

    // 重算总使用点数
    let newUsedOcc = 0, newUsedInt = 0;
    for (const sk of ALL_SKILLS) {
      newUsedOcc += occPts[sk.name] || 0;
      newUsedInt += intPts[sk.name] || 0;
    }

    // 更新分组显示
    const groups = this.data.skillGroups.map(g => ({
      ...g,
      skills: g.skills.map(s => ({
        ...s,
        total: s.base + (occPts[s.name] || 0) + (intPts[s.name] || 0),
      })),
    }));

    this.setData({
      occPts, intPts,
      usedOccPoints: newUsedOcc,
      usedIntPoints: newUsedInt,
      skillGroups: groups,
      showDialog: false,
      dialogSkill: null,
      canNext: newUsedOcc > 0 || newUsedInt > 0,
    });
  },

  // ==================== STEP 5：角色卡预览 ====================
  calcDerived() {
    const v = this.data.attrValues;
    const age = parseInt(this.data.charInfo.age) || 25;
    const ageMods = getAgeMods(age);
    const hp = Math.floor((v.con + v.siz) / 10);
    const san = v.pow || 50;
    const mp = Math.floor((v.pow || 50) / 5);
    const strSiz = (v.str || 50) + (v.siz || 50);
    const dbInfo = calcDB(strSiz);
    const mov2 = getAgeMov(age);
    const mov = Math.max(1, mov2);
    return { hp, san, mp, db: dbInfo.db, build: dbInfo.build, mov };
  },

  buildPreviewSkills(occPts, intPts, attrVals) {
    const edu = attrVals.edu || 50;
    const dex = attrVals.dex || 50;
    const specs = this.data.skillSpecs || {};
    const groups = {};
    CAT_ORDER.forEach(c => { groups[c] = []; });
    ALL_SKILLS.forEach(sk => {
      const base = getSkillBase(sk.name, edu, dex, this.data.skillSpecs);
      const pt = (occPts[sk.name] || 0) + (intPts[sk.name] || 0);
      if (base + pt > 0) {
        const spec = specs[sk.name];
        const displayName = spec ? sk.name + '（' + spec + '）' : sk.name;
        const total = base + pt;
        groups[sk.cat].push({ name: sk.name, displayName, base, total, hard: Math.floor(total / 2), extreme: Math.floor(total / 5) });
      }
    });
    return CAT_ORDER.filter(c => groups[c].length > 0).map(c => ({
      catName: CAT_LABELS[c].label, cat: c, skills: groups[c],
    }));
  },

  // ==================== 导航 ====================
  nextStep() {
    if (!this.data.canNext) return;
    const next = this.data.step + 1;
    
    // 从 Step 3 进入 Step 4 时，校验可选技能选择数量
    // Step 2→3: 检查年龄修正
    if (this.data.step === 2) {
      if (this.data.needAgeMod && !this.data.ageModDone) {
        wx.showToast({ title: '请先完成年龄修正', icon: 'none' });
        return;
      }
    }

    if (this.data.step === 3 && this.data.occOptGroups && this.data.occOptGroups.length > 0) {
      const msgs = [];
      for (const g of this.data.occOptGroups) {
        const selected = g.skills.filter(s => s.selected).length;
        const need = g.count;
        const names = g.skills.map(s => s.name).join('、');
        if (selected < need) {
          msgs.push(`「${names}」需选${need}项，少选了${need - selected}项`);
        } else if (selected > need) {
          msgs.push(`「${names}」限选${need}项，多选了${selected - need}项`);
        }
      }
      if (msgs.length > 0) {
        wx.showToast({ title: msgs[0], icon: 'none', duration: 2500 });
        return;
      }
    }

    // 校验必填专攻技能（options 型 spec 必须选择）
    if (this.data.step === 3 || this.data.step === 4) {
      const missingSpecs = this.getMissingRequiredSpecs();
      if (missingSpecs.length > 0) {
        const label = missingSpecs[0];
        wx.showToast({ title: `「${label}」请选择专攻方向`, icon: 'none', duration: 2000 });
        return;
      }
    }
    
    if (next === 5) {
      const derived = this.calcDerived();
      const derivedItems = makeDerivedItems(derived);
      const sortedSkillsByCat = this.buildPreviewSkills(this.data.occPts, this.data.intPts, this.data.attrValues);
      const cm = (this.data.occPts['克苏鲁神话'] || 0) + (this.data.intPts['克苏鲁神话'] || 0);
      const cmBase = getSkillBase('克苏鲁神话', this.data.attrValues.edu || 50, this.data.attrValues.dex || 50);
      const maxSAN = 99 - (cmBase + cm);
      this.setData({ step: next, derived, derivedItems, sortedSkillsByCat, attrDisplay: makeAttrDisplay(this.data.attrValues), playHP: derived.hp, playSAN: derived.san, playMP: derived.mp, playLuck: this.data.attrValues.luck || 50, maxSAN: maxSAN, maxMP: derived.mp });
    } else {
      this.setData({ step: next, canNext: false });
      if (next === 3) this.filterOccs(this.data.occSearch || '');
    }
  },
  prevStep() { const prev = this.data.step - 1; if (prev >= 0) { const opts = { step: prev, canNext: prev === 0 ? false : true }; if (prev === 0) { opts.playMode = false; opts.isCompleted = false; } this.setData(opts); if (prev === 3) this.filterOccs(this.data.occSearch || ''); } },
  goToStep(e) { const s = parseInt(e.currentTarget.dataset.step); if (s >= 1 && s <= 5) { if (this.data.step === 5 && s === 4 && this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc); this.setData({ step: s, canNext: true }); if (s === 3) this.filterOccs(this.data.occSearch || ''); } },

  // ==================== 保存角色 ====================
  saveCharacter() {
    // 进入预览页时已计算 derived 和 sortedSkillsByCat
    const charData = {
      attrValues: this.data.attrValues, attrRolls: this.data.attrRolls,
      charInfo: this.data.charInfo, selectedOcc: this.data.selectedOcc,
      occPts: this.data.occPts, intPts: this.data.intPts, skillSpecs: this.data.skillSpecs,
      usedOccPoints: this.data.usedOccPoints, totalOccPoints: this.data.totalOccPoints,
      usedIntPoints: this.data.usedIntPoints, totalIntPoints: this.data.totalIntPoints,
      derived: this.data.derived, timestamp: Date.now(),
      tickedSkills: this.data.tickedSkills,
      playHP: this.data.playHP, playSAN: this.data.playSAN, playMP: this.data.playMP, playLuck: this.data.playLuck,
      majorWound: this.data.majorWound,
      charWeapons: this.data.charWeapons,
      charBackstory: this.data.charBackstory, charGear: this.data.charGear,
      charMythos: this.data.charMythos, charSpells: this.data.charSpells, charCompanions: this.data.charCompanions,
      completed: true,
    };
    try {
      let list = wx.getStorageSync('coc7_characters') || [];
      const loadIdx = this.data._loadIndex;
      if (loadIdx !== undefined && loadIdx >= 0 && loadIdx < list.length) list[loadIdx] = charData;
      else { list.push(charData); this.setData({ _loadIndex: list.length - 1 }); }
      wx.setStorageSync('coc7_characters', list);
      this.setData({ isCompleted: true, savedAt: Date.now(), showSaveSuccess: true });
      setTimeout(() => { this.setData({ showSaveSuccess: false }); }, 2000);
    } catch (e) { wx.showToast({ title: '保存失败，存储空间不足', icon: 'none' }); }
  },

  // ==================== 导出角色 ====================
  toggleExportDialog() {
    this.setData({ showExportDialog: !this.data.showExportDialog });
  },

  doExportClipboard() {
    const charData = {
      attrValues: this.data.attrValues, attrRolls: this.data.attrRolls,
      attrDesc: this.data.attrDesc, attrDisplay: this.data.attrDisplay,
      charInfo: this.data.charInfo, selectedOcc: this.data.selectedOcc,
      occPts: this.data.occPts, intPts: this.data.intPts, skillSpecs: this.data.skillSpecs,
      usedOccPoints: this.data.usedOccPoints, totalOccPoints: this.data.totalOccPoints,
      usedIntPoints: this.data.usedIntPoints, totalIntPoints: this.data.totalIntPoints,
      derived: this.data.derived, derivedItems: this.data.derivedItems,
      sortedSkillsByCat: this.data.sortedSkillsByCat,
      timestamp: Date.now(),
      tickedSkills: this.data.tickedSkills,
      playHP: this.data.playHP, playSAN: this.data.playSAN, playMP: this.data.playMP, playLuck: this.data.playLuck,
      majorWound: this.data.majorWound,
      charWeapons: this.data.charWeapons,
      charBackstory: this.data.charBackstory, charGear: this.data.charGear,
      charMythos: this.data.charMythos, charSpells: this.data.charSpells, charCompanions: this.data.charCompanions,
      completed: true,
    };
    wx.setClipboardData({
      data: JSON.stringify(charData, null, 2),
      success: () => { wx.showToast({ title: '已复制到剪贴板', icon: 'success' }); this.setData({ showExportDialog: false }); },
      fail: () => { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  doExportDice() {
    const text = this.generateDiceImport();
    wx.setClipboardData({
      data: text,
      success: () => { wx.showToast({ title: '已复制，可粘贴到骰娘', icon: 'success' }); this.setData({ showExportDialog: false }); }
    });
  },

  // ==================== 骰娘导入 ====================
  generateDiceImport() {
    const v = this.data.attrValues;
    const occPts = this.data.occPts || {};
    const intPts = this.data.intPts || {};
    const specs = this.data.skillSpecs || {};
    const name = this.data.charInfo.name || '调查员';
    const edu = v.edu || 50;
    const dex = v.dex || 50;

    const total = (skName) => {
      const sk = ALL_SKILLS.find(s => s.name === skName);
      const base = sk ? getSkillBase(sk.name, edu, dex, specs) : 0;
      return base + (occPts[skName] || 0) + (intPts[skName] || 0);
    };

    let result = '.st ' + name + '\n';
    result += '敏捷' + v.dex + 'dex' + v.dex;
    result += '意志' + v.pow + 'pow' + v.pow;
    result += '体质' + v.con + 'con' + v.con;
    result += '外貌' + v.app + 'app' + v.app;
    result += '教育' + v.edu + 'edu' + v.edu;
    result += '体型' + v.siz + 'siz' + v.siz;
    result += '智力' + v.int + '智力' + v.int + 'int' + v.int;
    const san = v.pow || 50;
    const luck = v.luck || 50;
    result += 'san' + san + 'san值' + san + '理智' + san + '理智值' + san;
    result += '幸运' + luck + '幸运' + luck;
    const mp = Math.floor(san / 5);
    result += 'mp' + mp + '魔法' + mp;
    const hp = Math.floor(((v.con || 50) + (v.siz || 50)) / 10);
    result += 'hp' + hp + '生命' + hp + '\n';
    const skillOrder = [
      '会计','人类学','估价','考古学','技艺①','技艺②','取悦','攀爬','计算机使用',
      '信用评级','克苏鲁神话','乔装','闪避','驾驶①','电气维修','电子学','话术',
      '格斗①','射击①','射击②','射击③','急救','历史','恐吓','跳跃','母语',
      '法律','图书馆使用','聆听','锁匠','机械维修','医学','博物学','导航','神秘学',
      '操作重型机械','说服','精神分析','心理学','骑术','妙手','科学','侦查',
      '潜行','生存','游泳','投掷','追踪','催眠','爆破','潜水','读唇','动物驯养','药学'
    ];

    for (const skName of skillOrder) {
      const t = total(skName);
      if (t <= 0) continue;
      
      // 专攻技能：必须有专攻名才导出，否则跳过
      const needsSpec = ['格斗①','格斗②','射击①','射击②','射击③','技艺①','技艺②','技艺③','驾驶①','科学','外语①','外语②','外语③'].includes(skName);
      const spec = specs[skName];
      if (needsSpec && !spec) continue;
      
      // 母语始终用技能名，专攻技能有专攻时用专攻名
      if (skName === '母语') {
        result += '母语' + t;
      } else if (needsSpec && spec) {
        result += spec + t;
      } else {
        result += skName + t;
      }
    }

    return result;
  },

  // ==================== 游玩模式 ====================
  togglePlayMode() {
    if (this.data.playMode) {
      // 退出游玩：自动保存
      const charData = {
        attrValues: this.data.attrValues, attrRolls: this.data.attrRolls,
        charInfo: this.data.charInfo, selectedOcc: this.data.selectedOcc,
        occPts: this.data.occPts, intPts: this.data.intPts, skillSpecs: this.data.skillSpecs,
        usedOccPoints: this.data.usedOccPoints, totalOccPoints: this.data.totalOccPoints,
        usedIntPoints: this.data.usedIntPoints, totalIntPoints: this.data.totalIntPoints,
        derived: this.data.derived, timestamp: Date.now(),
        tickedSkills: this.data.tickedSkills,
        playHP: this.data.playHP, playSAN: this.data.playSAN, playMP: this.data.playMP, playLuck: this.data.playLuck,
      majorWound: this.data.majorWound,
        charWeapons: this.data.charWeapons,
        charBackstory: this.data.charBackstory, charGear: this.data.charGear,
        charMythos: this.data.charMythos, charSpells: this.data.charSpells, charCompanions: this.data.charCompanions,
        completed: this.data.isCompleted,
      };
      try {
        let list = wx.getStorageSync('coc7_characters') || [];
        const loadIdx = this.data._loadIndex;
        if (loadIdx !== undefined && loadIdx >= 0 && loadIdx < list.length) list[loadIdx] = charData;
        else list.push(charData);
        wx.setStorageSync('coc7_characters', list);
        this.setData({ savedAt: Date.now() });
        wx.showToast({ title: '已自动保存', icon: 'success', duration: 1500 });
      } catch (e) {}
    }
    this.setData({ playMode: !this.data.playMode });
  },

  toggleThresholds() {
    this.setData({ showThresholds: !this.data.showThresholds });
  },

  toggleOverride() {
    this.setData({ overrideLimits: !this.data.overrideLimits });
  },

  toggleSkillTick(e) {
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    const ticked = { ...this.data.tickedSkills };
    if (ticked[name]) {
      delete ticked[name];
    } else {
      ticked[name] = true;
    }
    this.setData({ tickedSkills: ticked });
  },

  onHPChange(e) { this.setData({ playHP: parseInt(e.detail.value) || 0 }); },
  onSANChange(e) { this.setData({ playSAN: parseInt(e.detail.value) || 0 }); },
  onMPChange(e) { this.setData({ playMP: parseInt(e.detail.value) || 0 }); },
  toggleMajorWound() { this.setData({ majorWound: !this.data.majorWound }); },
  onLuckChange(e) {
    const val = parseInt(e.detail.value) || 0;
    const newAttr = { ...this.data.attrValues, luck: val };
    this.setData({ playLuck: val, attrValues: newAttr, attrDisplay: makeAttrDisplay(newAttr) });
  },

  rollDice() {
    // d100: tens (0-9) + ones (0-9), 00+0 = 100
    const tens = Math.floor(Math.random() * 10);
    const ones = Math.floor(Math.random() * 10);
    return tens === 0 && ones === 0 ? 100 : tens * 10 + ones;
  },

  getSuccessLevel(roll, skill) {
    if (roll === 1) return { level: 'critical', label: '🌟 大成功', color: '#ff6600' };
    if (skill >= 50 && roll === 100) return { level: 'fumble', label: '💀 大失败', color: '#cc0000' };
    if (skill < 50 && roll >= 96) return { level: 'fumble', label: '💀 大失败', color: '#cc0000' };
    if (roll > skill) return { level: 'fail', label: '❌ 失败', color: '#999' };
    if (roll <= Math.floor(skill / 5)) return { level: 'extreme', label: '✨ 极难成功', color: '#00aa44' };
    if (roll <= Math.floor(skill / 2)) return { level: 'hard', label: '⭐ 困难成功', color: '#3388dd' };
    return { level: 'normal', label: '✅ 常规成功', color: '#66aa33' };
  },

  openRollDialog(e) {
    const name = e.currentTarget.dataset.name;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex, this.data.skillSpecs);
    const total = base + (this.data.occPts[name] || 0) + (this.data.intPts[name] || 0);
    this.setData({
      rollSkill: { name, value: total },
      rollResult: null,
      rollBonus: 0,
      showRollDialog: true,
    });
  },

  openAttrRoll(e) {
    const name = e.currentTarget.dataset.name;
    const value = parseInt(e.currentTarget.dataset.value) || 50;
    this.setData({
      rollSkill: { name, value },
      rollResult: null,
      rollBonus: 0,
      showRollDialog: true,
    });
  },

  doRoll() {
    const skill = this.data.rollSkill.value;
    const bonus = this.data.rollBonus || 0;
    
    // 1 个个位骰 (0-9)
    const ones = Math.floor(Math.random() * 10);
    
    // (1 + |bonus|) 个十位骰
    const count = 1 + Math.abs(bonus);
    const tensDice = [];
    for (let i = 0; i < count; i++) {
      tensDice.push(Math.floor(Math.random() * 10));
    }
    
    // 组合：每个十位 × 10 + 个位，00+0=100
    const results = tensDice.map(t => (t === 0 && ones === 0) ? 100 : t * 10 + ones);
    
    // 奖励骰：取最小；惩罚骰：取最大
    let roll;
    if (bonus > 0) roll = Math.min(...results);
    else if (bonus < 0) roll = Math.max(...results);
    else roll = results[0];
    
    const level = this.getSuccessLevel(roll, skill);
    const extraDice = tensDice.length > 1 ? tensDice.slice(1).map(d => d * 10).join('、') : '';
    
    // Mark skill as ticked on any success
    if (['critical','extreme','hard','normal'].includes(level.level)) {
      const ticked = { ...this.data.tickedSkills, [this.data.rollSkill.name]: true };
      this.setData({ tickedSkills: ticked });
    }
    
    this.setData({
      rollResult: {
        roll,
        tensDice,
        ones,
        results,
        level,
        extraDice,
        bonus,
      }
    });
  },

  setBonus(e) {
    this.setData({ rollBonus: parseInt(e.currentTarget.dataset.bonus) || 0 });
    this.doRoll();
  },

  preventTouchMove() {},

  closeRollDialog() {
    this.setData({ showRollDialog: false, rollSkill: null, rollResult: null, rollBonus: 0 });
  },

  // ==================== 掷骰模块 ====================
  roll(d) { return Math.floor(Math.random() * d) + 1; },

  _lastDicePress: 0,
  selectDice(e) {
    if (this.data.diceRolling) return;
    const now = Date.now();
    if (now - this._lastDicePress < 400) return;
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = { ...this.data.diceSelected };
    sel[d] = (sel[d] || 0) + 1;
    this.setData({ diceSelected: sel, diceResult: null });
  },
  deselectDice(e) {
    if (this.data.diceRolling) return;
    this._lastDicePress = Date.now();
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = { ...this.data.diceSelected };
    if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; }
    this.setData({ diceSelected: sel, diceResult: null });
  },
  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },
  clearDiceHistory() { this.setData({ diceHistory: [] }); },
  rollDiceSelected() {
    const sel = this.data.diceSelected, keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null });
    wx.vibrateShort({ type: 'medium' });
    const dice = []; let total = 0;
    keys.forEach(k => {
      const sides = parseInt(k), count = sel[k];
      for (let i = 0; i < count; i++) { const r = this.roll(sides); dice.push({ sides, result: r }); total += r; }
    });
    setTimeout(() => {
      const result = { dice, total, time: new Date().toLocaleTimeString() };
      const history = [result, ...this.data.diceHistory].slice(0, 50);
      this.setData({ diceRolling: false, diceResult: result, diceHistory: history });
    }, 700);
  },


  // ==================== 幕间成长 ====================
  openGrowth() {
    const ticked = this.data.tickedSkills || {};
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    
    // Build list of ticked skills with current values
    const specs = this.data.skillSpecs || {};
    const list = Object.keys(ticked).filter(k => ticked[k]).map(name => {
      const sk = ALL_SKILLS.find(s => s.name === name);
      const base = sk ? getSkillBase(sk.name, edu, dex, specs) : 0;
      const total = base + (this.data.occPts[name] || 0) + (this.data.intPts[name] || 0);
      return { name, value: total, removed: false };
    });
    
    this.setData({
      showGrowth: true,
      growthLocked: false,
      growthPhase: 0,
      growthSkills: list,
      growthResults: [],
      growthSANBonus: 0,
    growthSANOld: 0,
    growthSANMax: 99,
    growthLuckOld: 0,
    growthLuckGain: 0,
      growthSANInput: 0,
      growthCredInput: (this.data.occPts['信用评级'] || 0) + (this.data.intPts['信用评级'] || 0),
    });
  },
  finishGrowth() {
    this.applyCredit();
    this.setData({ growthLocked: false });
    this.closeGrowth();
  },
  closeGrowth() {
    if (this.data.growthLocked) {
      wx.showToast({ title: '请完成幕间成长', icon: 'none' });
      return;
    }
    // Save all current state
    const charData = {
      attrValues: this.data.attrValues, attrRolls: this.data.attrRolls,
      charInfo: this.data.charInfo, selectedOcc: this.data.selectedOcc,
      occPts: this.data.occPts, intPts: this.data.intPts, skillSpecs: this.data.skillSpecs,
      usedOccPoints: this.data.usedOccPoints, totalOccPoints: this.data.totalOccPoints,
      usedIntPoints: this.data.usedIntPoints, totalIntPoints: this.data.totalIntPoints,
      derived: this.data.derived, timestamp: Date.now(),
      tickedSkills: this.data.tickedSkills,
      playHP: this.data.playHP, playSAN: this.data.playSAN, playMP: this.data.playMP, playLuck: this.data.playLuck,
      majorWound: this.data.majorWound,
      charWeapons: this.data.charWeapons,
      charBackstory: this.data.charBackstory, charGear: this.data.charGear,
      charMythos: this.data.charMythos, charSpells: this.data.charSpells, charCompanions: this.data.charCompanions,
      completed: this.data.isCompleted,
    };
    try {
      let list = wx.getStorageSync('coc7_characters') || [];
      const loadIdx = this.data._loadIndex;
      if (loadIdx !== undefined && loadIdx >= 0 && loadIdx < list.length) list[loadIdx] = charData;
      else list.push(charData);
      wx.setStorageSync('coc7_characters', list);
      this.setData({ savedAt: Date.now() });
    } catch (e) {}
    
    // Rebuild skill display with updated points
    const grouped = this.buildPreviewSkills(this.data.occPts, this.data.intPts, this.data.attrValues);
    this.setData({ showGrowth: false, sortedSkillsByCat: grouped });
  },
  
  removeGrowthSkill(e) {
    const name = e.currentTarget.dataset.name;
    const skills = this.data.growthSkills.map(s => 
      s.name === name ? { ...s, removed: !s.removed } : s
    );
    this.setData({ growthSkills: skills });
  },
  
  startGrowth() {
    const skills = this.data.growthSkills.filter(s => !s.removed);
    const results = [];
    let reached90 = false;
    
    for (const sk of skills) {
      const roll = Math.floor(Math.random() * 100) + 1;
      const success = roll > sk.value || roll >= 96;
      let gain = 0, newVal = sk.value;
      if (success) {
        gain = Math.floor(Math.random() * 10) + 1;
        newVal = Math.min(99, sk.value + gain);
        if (newVal >= 90) reached90 = true;
        // Update skill points (add to intPts)
        const currentPts = (this.data.occPts[sk.name] || 0) + (this.data.intPts[sk.name] || 0);
        const diff = newVal - (getSkillBase(sk.name, this.data.attrValues.edu || 50, this.data.attrValues.dex || 50) + currentPts);
        if (diff > 0) {
          const intPts = { ...this.data.intPts, [sk.name]: (this.data.intPts[sk.name] || 0) + diff };
          this.setData({ intPts });
        }
      }
      results.push({ name: sk.name, roll, success, gain, newVal });
    }
    
    // Clear ticked and lock
    this.setData({ tickedSkills: {}, growthLocked: true, growthPhase: 1, growthResults: results, growthReached90: reached90 });
  },
  
  nextGrowthPhase() {
    // Set SAN max for display
    const cm = (this.data.occPts['克苏鲁神话'] || 0) + (this.data.intPts['克苏鲁神话'] || 0);
    const cmBase = getSkillBase('克苏鲁神话', this.data.attrValues.edu || 50, this.data.attrValues.dex || 50);
    const maxSAN = 99 - (cmBase + cm);
    this.setData({ growthPhase: 2, growthSANMax: maxSAN });
  },

  applySAN() {
    const oldSAN = this.data.playSAN;
    const cm = (this.data.occPts['克苏鲁神话'] || 0) + (this.data.intPts['克苏鲁神话'] || 0);
    const cmBase = getSkillBase('克苏鲁神话', this.data.attrValues.edu || 50, this.data.attrValues.dex || 50);
    const cmVal = cmBase + cm;
    const maxSAN = 99 - cmVal;
    let bonus = parseInt(this.data.growthSANInput) || 0;
    if (this.data.growthReached90) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      bonus += d1 + d2;
    }
    const newSAN = Math.min(maxSAN, oldSAN + bonus);
    this.setData({ playSAN: newSAN, growthPhase: 3, growthSANOld: oldSAN, growthSANBonus: bonus, growthSANMax: maxSAN });
  },
  
  doLuckGrowth() {
    const oldLuck = this.data.playLuck;
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll > oldLuck;
    let gain = 0, newLuck = oldLuck;
    if (success) {
      gain = Math.floor(Math.random() * 10) + 1;
      newLuck = Math.min(99, oldLuck + gain);
      const newAttr = { ...this.data.attrValues, luck: newLuck };
      this.setData({ playLuck: newLuck, attrValues: newAttr, attrDisplay: makeAttrDisplay(newAttr) });
    }
    this.setData({ growthPhase: 4, growthLuckOld: oldLuck, growthLuckRoll: roll, growthLuckSuccess: success, growthLuckGain: gain, growthLuckNew: newLuck });
  },
  
  applyCredit() {
    const val = parseInt(this.data.growthCredInput) || 0;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase('信用评级', edu, dex);
    const diff = val - base;
    if (diff > 0) {
      const intPts = { ...this.data.intPts, '信用评级': diff };
      const occPts = { ...this.data.occPts };
      delete occPts['信用评级'];
      this.setData({ intPts, occPts });
    }
    const grouped = this.buildPreviewSkills(this.data.occPts, this.data.intPts, this.data.attrValues);
    this.setData({ sortedSkillsByCat: grouped, growthPhase: 5 });
  },
  
  onGrowthSANInput(e) { this.setData({ growthSANInput: parseInt(e.detail.value) || 0 }); },
  onGrowthCredInput(e) { this.setData({ growthCredInput: parseInt(e.detail.value) || 0 }); },

  goHome() {
    this.setData({
      step: 0, playMode: false, isCompleted: false, overrideLimits: false,
      selectedOcc: null, occPts: {}, intPts: {}, skillSpecs: {},
      selectedOptSkills: {}, occOptGroups: [], occFixedSkills: [], occSpecRequired: [], occSpecMissing: [],
    });
    this.loadSavedList();
  },

  openAgeModDialog() {
    this.setData({ showAgeModDialog: true });
  },
  closeAgeModDialog() {
    this.setData({ showAgeModDialog: false });
  },
  setAgeModChoice(e) {
    this.setData({ ageModChoice: e.currentTarget.dataset.choice });
  },
  onAgeAllocInput(e) {
    var field = e.currentTarget.dataset.field;
    var val = parseInt(e.detail.value) || 0;
    var alloc = {};
    alloc.str = this.data.ageModAlloc.str;
    alloc.con = this.data.ageModAlloc.con;
    alloc.dex = this.data.ageModAlloc.dex;
    alloc[field] = val;
    var sum = alloc.str + alloc.con + alloc.dex;
    this.setData({ ageModAlloc: alloc, ageModRemaining: this.data.ageModDecay - sum });
  },
  confirmAgeMod() {
    var age = parseInt(this.data.charInfo.age) || 25;
    var type = this.data.ageModType;
    var ok = true;
    if (type === 'teen' && !this.data.ageModChoice) ok = false;
    if (type === 'decay' && this.data.ageModRemaining !== 0) ok = false;
    if (!ok) { wx.showToast({ title: '请完成选择', icon: 'none' }); return; }

    var result = applyAgeModifiers(age, this.data.attrValues, this.data.ageModChoice, this.data.ageModAlloc);
    this.setData({
      attrValues: result.attrValues,
      attrDisplay: makeAttrDisplay(result.attrValues),
      ageModSummary: result.summary,
      ageModDone: true,
      showAgeModDialog: false,
    });
  },

  // ==================== 武器管理 ====================
  openWeaponPicker() {
    const groups = groupWeapons(WEAPONS_1920S);
    this.setData({ showWeaponPicker: true, weaponSearch: '', weaponGroups: groups });
  },
  closeWeaponPicker() {
    this.setData({ showWeaponPicker: false, showCustomWeapon: false,
      customWName: '', customWSkill: '', customWDamage: '', customWRange: '',
      customWAttacks: '1', customWAmmo: '', customWMalfunction: '100', customWImpale: '√' });
  },
  onWeaponSearch(e) {
    const val = e.detail.value;
    const list = val ? WEAPONS_1920S.filter(w => w.name.includes(val)) : WEAPONS_1920S;
    const groups = groupWeapons(list);
    this.setData({ weaponSearch: val, weaponGroups: groups });
  },
  addWeapon(e) {
    const name = e.currentTarget.dataset.name;
    const weapon = WEAPONS_1920S.find(w => w.name === name);
    if (!weapon) return;
    const charWeapons = [...this.data.charWeapons, { ...weapon, _id: Date.now() }];
    this.setData({ charWeapons, showWeaponPicker: false });
  },
  removeWeapon(e) {
    const id = e.currentTarget.dataset.id;
    const charWeapons = this.data.charWeapons.filter(w => w._id !== id);
    this.setData({ charWeapons });
  },

  onCharFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    const map = { backstory: 'charBackstory', gear: 'charGear', mythos: 'charMythos', spells: 'charSpells', companions: 'charCompanions' };
    this.setData({ [map[field]]: e.detail.value });
  },

  openCustomWeapon() {
    this.setData({ showCustomWeapon: true });
  },
  cancelCustomWeapon() {
    this.setData({ showCustomWeapon: false });
  },
  onCustomWField(e) {
    const field = e.currentTarget.dataset.field;
    const val = e.detail.value;
    const map = {
      name: 'customWName', skill: 'customWSkill', damage: 'customWDamage',
      range: 'customWRange', attacks: 'customWAttacks',
      ammo: 'customWAmmo', malfunction: 'customWMalfunction', impale: 'customWImpale',
    };
    this.setData({ [map[field]]: val });
  },
  confirmCustomWeapon() {
    const { customWName, customWSkill, customWDamage, customWRange, customWAttacks, customWAmmo, customWMalfunction, customWImpale } = this.data;
    if (!customWName || !customWSkill || !customWDamage) {
      wx.showToast({ title: '请填写名称、技能和伤害', icon: 'none' });
      return;
    }
    const weapon = {
      name: customWName, skill: customWSkill, skillId: '格斗①',
      damage: customWDamage, range: customWRange || '接触',
      impale: customWImpale || '——', attacks: customWAttacks || '1', ammo: customWAmmo || '——',
      malfunction: customWMalfunction || '——', rare: false, _id: Date.now(),
    };
    const charWeapons = [...this.data.charWeapons, weapon];
    this.setData({
      charWeapons, showWeaponPicker: false, showCustomWeapon: false,
      customWName: '', customWSkill: '', customWDamage: '', customWRange: '',
      customWAttacks: '1', customWAmmo: '', customWMalfunction: '100', customWImpale: '√',
    });
  },

});