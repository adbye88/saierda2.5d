/* ========================================================
   QuizData.js — 人教版小学 2-4 年级题库
   按年级和科目分类，全部为 4 选项选择题
   每题包含：题目、4个选项、正确答案索引、科目、年级、解释
   专为抽动症+多动症 8 岁儿童设计：
     - 语言简短直白，避免歧义
     - 答案明确无争议
     - 解释用鼓励语气
   ======================================================== */

const QUIZ_DATA = {
  // ============ 二年级 ============
  grade2: {
    math: [
      { q: "23 + 14 = ?", options: ["37", "27", "47", "33"], answer: 0, explain: "23+14，个位3+4=7，十位2+1=3，所以是37。你真棒！" },
      { q: "56 - 23 = ?", options: ["33", "43", "23", "30"], answer: 0, explain: "56-23，个位6-3=3，十位5-2=3，所以是33。做得好！" },
      { q: "3 × 4 = ?", options: ["7", "12", "14", "16"], answer: 1, explain: "3乘4就是4个3相加，3+3+3+3=12。太聪明了！" },
      { q: "5 × 6 = ?", options: ["11", "25", "30", "35"], answer: 2, explain: "5乘6就是6个5，等于30。真厉害！" },
      { q: "下面的数哪个最大？", options: ["45", "54", "48", "50"], answer: 1, explain: "54比其他的都大，十位相同看个位。你观察得真仔细！" },
      { q: "1 米 = 多少厘米？", options: ["10", "100", "1000", "50"], answer: 1, explain: "1米等于100厘米，这是要记住的知识哦！" },
      { q: "24 ÷ 6 = ?", options: ["3", "4", "5", "6"], answer: 1, explain: "24里面有4个6，所以24÷6=4。正确！" },
      { q: "一个钟表显示3点整，时针指向几？", options: ["3", "12", "6", "9"], answer: 0, explain: "3点整，时针指向3，分针指向12。" },
      { q: "17 + 8 = ?", options: ["25", "24", "15", "26"], answer: 0, explain: "17+8，7+8=15进1，得25。" },
      { q: "40 - 15 = ?", options: ["25", "35", "15", "30"], answer: 0, explain: "40-15，借位后得25。" },
      { q: "2 × 9 = ?", options: ["18", "11", "16", "22"], answer: 0, explain: "二九十八，2×9=18。" },
      { q: "6 × 3 = ?", options: ["9", "18", "12", "15"], answer: 1, explain: "6×3=18，3个6相加。" },
      { q: "36 ÷ 4 = ?", options: ["8", "9", "6", "7"], answer: 1, explain: "四九三十六，36÷4=9。" },
      { q: "比 50 小、比 45 大的数是？", options: ["48", "44", "52", "40"], answer: 0, explain: "48在45和50之间。" },
      { q: "一支铅笔长约15（  ）？", options: ["厘米", "米", "千米", "克"], answer: 0, explain: "铅笔用厘米量，15厘米合适。" },
      { q: "10 + 10 + 10 = ?", options: ["20", "30", "40", "13"], answer: 1, explain: "三个10相加等于30。" },
      { q: "下面的数哪个最小？", options: ["28", "82", "38", "48"], answer: 0, explain: "28的十位2最小，所以最小。" },
      { q: "5 + 5 + 5 + 5 用乘法怎么写？", options: ["5×4", "5+4", "4+5", "5×5"], answer: 0, explain: "4个5相加写成5×4=20。" }
    ],
    chinese: [
      { q: "「天」字一共有几笔？", options: ["3笔", "4笔", "5笔", "2笔"], answer: 1, explain: "「天」是4笔：横、横、撇、捺。写得真认真！" },
      { q: "「大大的太阳」中，'大大'是什么词？", options: ["名词", "形容词", "动词", "数量词"], answer: 1, explain: "'大大'描述太阳的样子，是形容词。" },
      { q: "下面哪个是反义词？", options: ["大 - 小", "天 - 日", "上 - 山", "人 - 大"], answer: 0, explain: "大和小意思相反，是反义词。你真聪明！" },
      { q: "「妈妈在做饭」中，'做饭'是？", options: ["谁", "在做什么", "在哪里", "什么时候"], answer: 1, explain: "'做饭'告诉我们妈妈在做什么，是动作。" },
      { q: "「小狗」的第一个字是什么？", options: ["小", "狗", "大", "猫"], answer: 0, explain: "「小狗」第一个字是「小」。" },
      { q: "下面哪个字读 'mā'？", options: ["妈", "马", "骂", "麻"], answer: 0, explain: "妈妈的第一声读 mā。" },
      { q: "「大」的反义词是？", options: ["小", "高", "多", "长"], answer: 0, explain: "大和小意思相反。" },
      { q: "「上」的反义词是？", options: ["下", "左", "前", "高"], answer: 0, explain: "上和下是一对反义词。" },
      { q: "「去」的反义词是？", options: ["来", "走", "跑", "到"], answer: 0, explain: "去和来意思相反。" },
      { q: "「开心」的近义词是？", options: ["快乐", "伤心", "生气", "害怕"], answer: 0, explain: "开心和快乐意思相近。" },
      { q: "「跑」是什么词？", options: ["动词", "名词", "形容词", "数量词"], answer: 0, explain: "跑表示动作，是动词。" },
      { q: "「美丽的花」中，'美丽'是？", options: ["形容词", "动词", "名词", "数词"], answer: 0, explain: "美丽描写花的样子，是形容词。" },
      { q: "「水」字有几笔？", options: ["4笔", "3笔", "5笔", "2笔"], answer: 0, explain: "「水」共4笔。" },
      { q: "「山」字是几笔？", options: ["3笔", "4笔", "5笔", "2笔"], answer: 0, explain: "「山」共3笔：竖、竖折、竖。" },
      { q: "下面哪个是量词？", options: ["个", "大", "跑", "花"], answer: 0, explain: "「个」用来数东西，是量词，如一个苹果。" },
      { q: "「三本书」中的'本'是？", options: ["量词", "动词", "名词", "形容词"], answer: 0, explain: "「本」是量词，用来数书。" },
      { q: "「小鸟在天上飞」中，谁在飞？", options: ["小鸟", "天上", "飞", "在"], answer: 0, explain: "主语是「小鸟」，是它在飞。" },
      { q: "「白白的云」中，'白白'描写什么？", options: ["云的颜色", "云的大小", "云的味道", "云的重量"], answer: 0, explain: "「白白」描写云的颜色。" }
    ],
    english: [
      { q: "Hello 是什么意思？", options: ["再见", "你好", "谢谢", "对不起"], answer: 1, explain: "Hello = 你好，最常用的问候语！" },
      { q: "Apple 是什么意思？", options: ["香蕉", "苹果", "橘子", "梨"], answer: 1, explain: "Apple = 苹果，A for Apple！" },
      { q: "数字 Three 是几？", options: ["2", "3", "4", "5"], answer: 1, explain: "Three = 3。" },
      { q: "Cat 是什么动物？", options: ["狗", "猫", "鸟", "鱼"], answer: 1, explain: "Cat = 猫，C for Cat！" },
      { q: "Thank you 是什么意思？", options: ["你好", "谢谢", "对不起", "再见"], answer: 1, explain: "Thank you = 谢谢你，要常说哦！" },
      { q: "Dog 是什么动物？", options: ["猫", "狗", "鸟", "猪"], answer: 1, explain: "Dog = 狗，D for Dog！" },
      { q: "数字 One 是几？", options: ["1", "2", "0", "10"], answer: 0, explain: "One = 1。" },
      { q: "数字 Two 是几？", options: ["2", "1", "3", "12"], answer: 0, explain: "Two = 2。" },
      { q: "Banana 是什么？", options: ["苹果", "香蕉", "葡萄", "西瓜"], answer: 1, explain: "Banana = 香蕉。" },
      { q: "Goodbye 是什么意思？", options: ["你好", "再见", "谢谢", "对不起"], answer: 1, explain: "Goodbye = 再见。" },
      { q: "Fish 是什么动物？", options: ["鱼", "鸟", "猫", "狗"], answer: 0, explain: "Fish = 鱼，F for Fish！" },
      { q: "Bird 是什么动物？", options: ["鸟", "鱼", "猫", "虫"], answer: 0, explain: "Bird = 鸟，B for Bird！" },
      { q: "Mom 是什么意思？", options: ["爸爸", "妈妈", "姐姐", "奶奶"], answer: 1, explain: "Mom = 妈妈。" },
      { q: "Dad 是什么意思？", options: ["爸爸", "妈妈", "哥哥", "爷爷"], answer: 0, explain: "Dad = 爸爸。" },
      { q: "数字 Four 是几？", options: ["4", "5", "3", "14"], answer: 0, explain: "Four = 4。" },
      { q: "数字 Five 是几？", options: ["5", "4", "6", "15"], answer: 0, explain: "Five = 5。" },
      { q: "Red 是什么颜色？", options: ["红色", "蓝色", "绿色", "黄色"], answer: 0, explain: "Red = 红色。" },
      { q: "Yes 是什么意思？", options: ["是的", "不是", "谢谢", "你好"], answer: 0, explain: "Yes = 是的/好。" }
    ],
    science: [
      { q: "太阳从哪个方向升起？", options: ["东方", "西方", "南方", "北方"], answer: 0, explain: "太阳东升西落，这是自然规律！" },
      { q: "下面的动物哪个会飞？", options: ["小鱼", "小鸟", "小猫", "小狗"], answer: 1, explain: "鸟有翅膀，能在天上飞。" },
      { q: "我们的身体里最多的是什么？", options: ["骨头", "水", "血", "肉"], answer: 1, explain: "人体大部分是水，要多喝水哦！" },
      { q: "树的主要颜色是？", options: ["红色", "蓝色", "绿色", "紫色"], answer: 2, explain: "树叶有叶绿素，所以是绿色的。" },
      { q: "下面哪个是植物？", options: ["小狗", "玫瑰", "小鸟", "小鱼"], answer: 1, explain: "玫瑰是花，属于植物。" },
      { q: "一天有几个小时？", options: ["12", "24", "48", "60"], answer: 1, explain: "一天有24小时。" },
      { q: "一周有几天？", options: ["5天", "7天", "6天", "8天"], answer: 1, explain: "一周有7天：周一到周日。" },
      { q: "下面哪个动物生活在水里？", options: ["小鸟", "小鱼", "小猫", "老虎"], answer: 1, explain: "鱼用鳃呼吸，生活在水里。" },
      { q: "人一般有几只眼睛？", options: ["1只", "2只", "3只", "4只"], answer: 1, explain: "人有2只眼睛。" },
      { q: "下面哪个是水果？", options: ["苹果", "白菜", "萝卜", "土豆"], answer: 0, explain: "苹果是水果，其他是蔬菜。" },
      { q: "雪是什么颜色的？", options: ["白色", "黑色", "红色", "绿色"], answer: 0, explain: "雪是白色的。" },
      { q: "下面哪个动物有四条腿？", options: ["小鸟", "小狗", "小鱼", "蝴蝶"], answer: 1, explain: "狗有四条腿。" },
      { q: "天上的云主要是什么变的？", options: ["水蒸气", "棉花", "烟", "石头"], answer: 0, explain: "云是水蒸气凝结成的。" },
      { q: "下面哪个最热？", options: ["冰块", "开水", "凉水", "雪"], answer: 1, explain: "开水有100度，最热。" },
      { q: "种子种下去会长成什么？", options: ["植物", "动物", "石头", "水"], answer: 0, explain: "种子发芽长成植物。" },
      { q: "白天有（  ），夜晚有（  ）？", options: ["太阳；月亮", "月亮；太阳", "星星；太阳", "云；雨"], answer: 0, explain: "白天有太阳，夜晚有月亮。" },
      { q: "下面哪个是昆虫？", options: ["蝴蝶", "小狗", "小鱼", "小猫"], answer: 0, explain: "蝴蝶有六条腿，是昆虫。" },
      { q: "风是（  ）的流动？", options: ["空气", "水", "光", "沙子"], answer: 0, explain: "风是空气流动形成的。" }
    ]
  },

  // ============ 三年级 ============
  grade3: {
    math: [
      { q: "125 + 237 = ?", options: ["352", "362", "372", "262"], answer: 1, explain: "125+237，个位5+7=12进1，十位2+3+1=6，百位1+2=3，得362。" },
      { q: "500 - 178 = ?", options: ["322", "422", "378", "222"], answer: 0, explain: "500-178，连续退位，得322。" },
      { q: "7 × 8 = ?", options: ["54", "56", "64", "48"], answer: 1, explain: "七八五十六，乘法口诀要牢记！" },
      { q: "一个正方形有几条边？", options: ["3条", "4条", "5条", "6条"], answer: 1, explain: "正方形有4条相等的边。" },
      { q: "三分之一写成数字是？", options: ["1/3", "3/1", "1.3", "3.1"], answer: 0, explain: "三分之一 = 1/3，分子在上分母在下。" },
      { q: "1 千克 = 多少克？", options: ["100", "500", "1000", "10000"], answer: 2, explain: "1千克 = 1000克，1kg = 1000g。" },
      { q: "小明有 24 颗糖，平均分给 4 个朋友，每人几颗？", options: ["4颗", "6颗", "8颗", "5颗"], answer: 1, explain: "24÷4=6，每人6颗。会做除法了！" },
      { q: "下面的时间哪个最长？", options: ["1小时", "60分钟", "3600秒", "一样长"], answer: 3, explain: "1小时=60分钟=3600秒，它们一样长！" },
      { q: "9 × 9 = ?", options: ["81", "18", "99", "72"], answer: 0, explain: "九九八十一，9×9=81。" },
      { q: "63 ÷ 9 = ?", options: ["7", "8", "6", "9"], answer: 0, explain: "七九六十三，63÷9=7。" },
      { q: "一个星期有几天？", options: ["5", "7", "6", "8"], answer: 1, explain: "一星期7天。" },
      { q: "350 + 460 = ?", options: ["810", "710", "790", "800"], answer: 0, explain: "350+460=810。" },
      { q: "800 - 250 = ?", options: ["550", "650", "450", "600"], answer: 0, explain: "800-250=550。" },
      { q: "45 ÷ 5 = ?", options: ["9", "8", "7", "5"], answer: 0, explain: "五九四十五，45÷5=9。" },
      { q: "1 分米 = 多少厘米？", options: ["10", "100", "1", "1000"], answer: 0, explain: "1分米=10厘米。" },
      { q: "一节课40分钟，两节课一共多少分钟？", options: ["80", "40", "100", "60"], answer: 0, explain: "40×2=80分钟。" },
      { q: "小明有5元，买文具用了3元2角，还剩？", options: ["1元8角", "2元", "1元2角", "2元8角"], answer: 0, explain: "5元-3元2角=1元8角。" },
      { q: "一个正方形边长3厘米，周长是？", options: ["12厘米", "9厘米", "6厘米", "3厘米"], answer: 0, explain: "周长=边长×4=3×4=12厘米。" },
      { q: "下面的数哪个最接近 100？", options: ["98", "85", "110", "95"], answer: 0, explain: "98和100只差2，最接近。" }
    ],
    chinese: [
      { q: "「美丽」的近义词是？", options: ["漂亮", "丑陋", "高大", "瘦小"], answer: 0, explain: "美丽和漂亮意思相近，是近义词。" },
      { q: "「高兴」的反义词是？", options: ["快乐", "伤心", "激动", "兴奋"], answer: 1, explain: "高兴的反义词是伤心。" },
      { q: "「小明跑得很快」这句话的主语是？", options: ["小明", "跑", "很快", "得"], answer: 0, explain: "主语是「谁」，所以是「小明」。" },
      { q: "下面的字哪个是左右结构？", options: ["明", "草", "国", "山"], answer: 0, explain: "「明」是日+月，左右结构。" },
      { q: "「同学们在教室里上课」发生在哪里？", options: ["家里", "教室", "操场", "公园"], answer: 1, explain: "句子里说「在教室里」，所以是教室。" },
      { q: "「又大又红的苹果」中，描写苹果的有几个词？", options: ["1个", "2个", "3个", "4个"], answer: 1, explain: "「大」和「红」两个词描写苹果。" },
      { q: "「安静」的近义词是？", options: ["宁静", "吵闹", "热闹", "快乐"], answer: 0, explain: "安静和宁静意思相近。" },
      { q: "「简单」的反义词是？", options: ["复杂", "容易", "轻松", "明白"], answer: 0, explain: "简单和复杂意思相反。" },
      { q: "「开始」的反义词是？", options: ["结束", "起点", "出发", "继续"], answer: 0, explain: "开始和结束是一对反义词。" },
      { q: "「明亮」的近义词是？", options: ["光亮", "黑暗", "昏暗", "模糊"], answer: 0, explain: "明亮和光亮意思相近。" },
      { q: "「可爱」的近义词是？", options: ["讨喜", "讨厌", "丑陋", "凶恶"], answer: 0, explain: "可爱和讨喜意思相近。" },
      { q: "「冷」的反义词是？", options: ["热", "凉", "冰", "冻"], answer: 0, explain: "冷和热意思相反。" },
      { q: "「明」字是什么结构？", options: ["左右结构", "上下结构", "独体字", "半包围"], answer: 0, explain: "「明」左边日右边月，是左右结构。" },
      { q: "「草」字是什么结构？", options: ["上下结构", "左右结构", "独体字", "全包围"], answer: 0, explain: "「草」上面草字头，下面早，是上下结构。" },
      { q: "「红色的太阳」中，'红色'是？", options: ["形容词", "动词", "名词", "量词"], answer: 0, explain: "红色描写太阳的颜色，是形容词。" },
      { q: "「书」的量词是？", options: ["本", "个", "条", "只"], answer: 0, explain: "说「一本书」，量词是「本」。" },
      { q: "「一（  ）花」，括号里填？", options: ["朵", "本", "条", "只"], answer: 0, explain: "说「一朵花」，量词是「朵」。" },
      { q: "「妹妹在唱歌」中，谁在唱歌？", options: ["妹妹", "唱歌", "在", "歌"], answer: 0, explain: "主语是「妹妹」，是她在唱歌。" },
      { q: "「大」加一笔变成什么字？", options: ["天", "小", "人", "木"], answer: 0, explain: "「大」上面加一横变成「天」。" }
    ],
    english: [
      { q: "What's your name? 是问什么？", options: ["叫什么名字", "几岁了", "住在哪里", "你好吗"], answer: 0, explain: "What's your name? = 你叫什么名字？" },
      { q: "数字 Five 是几？", options: ["5", "4", "6", "15"], answer: 0, explain: "Five = 5。" },
      { q: "Book 是什么意思？", options: ["书", "笔", "桌子", "椅子"], answer: 0, explain: "Book = 书，B for Book！" },
      { q: "Good morning 是什么意思？", options: ["早上好", "晚安", "下午好", "再见"], answer: 0, explain: "Good morning = 早上好。" },
      { q: "Red 是什么颜色？", options: ["红色", "蓝色", "绿色", "黄色"], answer: 0, explain: "Red = 红色。" },
      { q: "Blue 是什么颜色？", options: ["蓝色", "红色", "绿色", "黑色"], answer: 0, explain: "Blue = 蓝色。" },
      { q: "Green 是什么颜色？", options: ["绿色", "红色", "黄色", "紫色"], answer: 0, explain: "Green = 绿色。" },
      { q: "Yellow 是什么颜色？", options: ["黄色", "橙色", "白色", "粉色"], answer: 0, explain: "Yellow = 黄色。" },
      { q: "School 是什么意思？", options: ["学校", "医院", "商店", "公园"], answer: 0, explain: "School = 学校。" },
      { q: "Teacher 是什么意思？", options: ["老师", "学生", "医生", "工人"], answer: 0, explain: "Teacher = 老师。" },
      { q: "Water 是什么意思？", options: ["水", "火", "土", "风"], answer: 0, explain: "Water = 水。" },
      { q: "Milk 是什么意思？", options: ["牛奶", "面包", "果汁", "茶"], answer: 0, explain: "Milk = 牛奶。" },
      { q: "Happy 是什么意思？", options: ["开心", "伤心", "生气", "害怕"], answer: 0, explain: "Happy = 开心。" },
      { q: "Sorry 是什么意思？", options: ["对不起", "谢谢", "你好", "再见"], answer: 0, explain: "Sorry = 对不起。" },
      { q: "Sun 是什么？", options: ["太阳", "月亮", "星星", "云"], answer: 0, explain: "Sun = 太阳。" },
      { q: "Moon 是什么？", options: ["月亮", "太阳", "星星", "雨"], answer: 0, explain: "Moon = 月亮。" },
      { q: "数字 Eight 是几？", options: ["8", "9", "7", "18"], answer: 0, explain: "Eight = 8。" },
      { q: "数字 Ten 是几？", options: ["10", "1", "2", "20"], answer: 0, explain: "Ten = 10。" },
      { q: "Bag 是什么意思？", options: ["书包", "桌子", "椅子", "床"], answer: 0, explain: "Bag = 书包。" }
    ],
    science: [
      { q: "下面哪种动物是哺乳动物？", options: ["猫", "鱼", "鸟", "蛇"], answer: 0, explain: "猫是哺乳动物，喝妈妈的奶长大。" },
      { q: "彩虹通常有几种颜色？", options: ["7种", "5种", "6种", "8种"], answer: 0, explain: "彩虹有7种颜色：红橙黄绿青蓝紫。" },
      { q: "我们用什么呼吸？", options: ["鼻子", "耳朵", "眼睛", "嘴巴"], answer: 0, explain: "我们用鼻子呼吸，吸入氧气。" },
      { q: "水的沸点是多少度？", options: ["100度", "50度", "0度", "200度"], answer: 0, explain: "水到100度就烧开沸腾了。" },
      { q: "月亮自己会发光吗？", options: ["不会，反射太阳光", "会", "只在晚上会", "有时会"], answer: 0, explain: "月亮不会发光，是反射太阳的光。" },
      { q: "水结冰的温度是多少？", options: ["0度", "100度", "50度", "零下10度"], answer: 0, explain: "水在0度会结成冰。" },
      { q: "下面哪种动物会冬眠？", options: ["熊", "鸡", "羊", "猴子"], answer: 0, explain: "熊冬天会冬眠，节省能量。" },
      { q: "下面哪种食物含丰富蛋白质？", options: ["鸡蛋", "糖果", "可乐", "薯片"], answer: 0, explain: "鸡蛋富含蛋白质，对身体好。" },
      { q: "声音是通过什么传播的？", options: ["空气", "光", "水", "石头"], answer: 0, explain: "声音通过空气（气体）传播到耳朵。" },
      { q: "下面哪个不是植物？", options: ["蘑菇", "小草", "大树", "花朵"], answer: 0, explain: "蘑菇是真菌，不是植物。" },
      { q: "白天太阳给我们带来什么？", options: ["光和热", "只有光", "只有热", "雨水"], answer: 0, explain: "太阳给我们带来光和热。" },
      { q: "下面哪个是自然现象？", options: ["下雨", "看电视", "玩游戏", "吃饭"], answer: 0, explain: "下雨是大自然的天气现象。" },
      { q: "植物生长需要什么？", options: ["阳光、水、土壤", "只要水", "只要阳光", "只要土壤"], answer: 0, explain: "植物需要阳光、水和土壤里的养分。" },
      { q: "下面哪种是冷血动物？", options: ["蛇", "狗", "鸟", "兔子"], answer: 0, explain: "蛇是爬行动物，属于冷血动物。" },
      { q: "氧气对我们有什么用？", options: ["呼吸", "吃饭", "睡觉", "玩耍"], answer: 0, explain: "我们呼吸需要氧气。" },
      { q: "下面哪个是固体？", options: ["石头", "水", "空气", "蒸汽"], answer: 0, explain: "石头有固定形状，是固体。" },
      { q: "下面哪个是液体？", options: ["水", "空气", "冰块", "沙子"], answer: 0, explain: "水会流动，是液体。" },
      { q: "蜜蜂对植物有什么帮助？", options: ["传播花粉", "吃叶子", "喝水", "松土"], answer: 0, explain: "蜜蜂采蜜时帮植物传播花粉。" },
      { q: "一年有几个季节？", options: ["4个", "2个", "3个", "12个"], answer: 0, explain: "一年有春、夏、秋、冬四季。" }
    ]
  },

  // ============ 四年级 ============
  grade4: {
    math: [
      { q: "36 × 25 = ?", options: ["900", "810", "720", "990"], answer: 0, explain: "36×25=900，可以用简便方法：36×25=36×(100÷4)=900。" },
      { q: "1.5 + 2.3 = ?", options: ["3.8", "3.5", "4.8", "2.8"], answer: 0, explain: "小数加法对齐小数点，1.5+2.3=3.8。" },
      { q: "一个三角形内角和是？", options: ["180度", "90度", "360度", "270度"], answer: 0, explain: "任意三角形三个内角加起来都是180度。" },
      { q: "0.25 = 几分之几？", options: ["1/4", "1/2", "1/3", "1/5"], answer: 0, explain: "0.25 = 25/100 = 1/4。" },
      { q: "下面哪个是质数？", options: ["7", "4", "6", "9"], answer: 0, explain: "7只能被1和7整除，是质数。" },
      { q: "一个长方形长5米宽3米，面积是？", options: ["15平方米", "8平方米", "16平方米", "30平方米"], answer: 0, explain: "面积=长×宽=5×3=15平方米。" },
      { q: "2 的 3 次方等于？", options: ["8", "6", "9", "5"], answer: 0, explain: "2³ = 2×2×2 = 8。" },
      { q: "1 小时 30 分 = 多少分钟？", options: ["90分", "60分", "130分", "30分"], answer: 0, explain: "1小时=60分，加30分=90分钟。" },
      { q: "0.1 + 0.2 = ?", options: ["0.3", "0.02", "0.12", "0.5"], answer: 0, explain: "0.1+0.2=0.3。" },
      { q: "125 × 8 = ?", options: ["1000", "100", "10000", "800"], answer: 0, explain: "125×8=1000，这是要记住的巧算！" },
      { q: "下面哪个是合数？", options: ["9", "2", "3", "5"], answer: 0, explain: "9=3×3，除了1和它本身还能被3整除，是合数。" },
      { q: "一个圆的半径是2厘米，直径是？", options: ["4厘米", "2厘米", "6厘米", "1厘米"], answer: 0, explain: "直径=半径×2=2×2=4厘米。" },
      { q: "3/4 + 1/4 = ?", options: ["1", "3/16", "4/4", "1/2"], answer: 0, explain: "同分母分数相加，3/4+1/4=4/4=1。" },
      { q: "10 的 2 次方 = ？", options: ["100", "20", "1000", "12"], answer: 0, explain: "10²=10×10=100。" },
      { q: "小明每小时走4千米，3小时走多少千米？", options: ["12千米", "7千米", "1千米", "4千米"], answer: 0, explain: "路程=速度×时间=4×3=12千米。" },
      { q: "下面的角哪个是直角？", options: ["90度", "45度", "180度", "120度"], answer: 0, explain: "直角等于90度。" },
      { q: "2.5 × 4 = ?", options: ["10", "8.5", "6.5", "2.9"], answer: 0, explain: "2.5×4=10。" },
      { q: "一个数百万位是1，其他位是0，这个数是？", options: ["1000000", "10000", "100000", "10000000"], answer: 0, explain: "百万位是1即一百万=1000000。" },
      { q: "24 和 36 的最大公因数是？", options: ["12", "6", "4", "9"], answer: 0, explain: "24和36都能被12整除，12最大，是最大公因数。" }
    ],
    chinese: [
      { q: "「书声琅琅」中「琅琅」形容什么？", options: ["读书的声音", "书的颜色", "书的味道", "书的重量"], answer: 0, explain: "「琅琅」形容读书声音清脆响亮。" },
      { q: "下面的句子哪个是比喻句？", options: ["他像一棵小树", "他很高", "他在跑", "他叫小明"], answer: 0, explain: "「像一棵小树」把人比作树，是比喻句。" },
      { q: "「亡羊补牢」告诉我们什么道理？", options: ["犯了错及时补救还不晚", "羊很重要", "牢房很坚固", "羊会逃跑"], answer: 0, explain: "亡羊补牢 = 出了问题及时补救，为时不晚。" },
      { q: "成语「一日千里」形容什么？", options: ["进步快", "走得慢", "距离远", "时间久"], answer: 0, explain: "一日千里形容进步或发展非常快。" },
      { q: "「春天来了，花儿都开了」用了什么修辞？", options: ["拟人", "比喻", "夸张", "排比"], answer: 0, explain: "花儿「开了」像人在笑，是拟人手法。" },
      { q: "「守株待兔」告诉我们什么道理？", options: ["不能心存侥幸靠运气", "兔子跑得快", "树很重要", "要多种树"], answer: 0, explain: "守株待兔讽刺不主动努力、想凭运气的人。" },
      { q: "「画蛇添足」是什么意思？", options: ["多此一举反而坏事", "蛇有很多脚", "画画要仔细", "脚很重要"], answer: 0, explain: "画蛇添足比喻做了多余的事反而弄巧成拙。" },
      { q: "「骄傲」的反义词是？", options: ["谦虚", "自豪", "开心", "得意"], answer: 0, explain: "骄傲和谦虚意思相反。" },
      { q: "「珍贵」的近义词是？", options: ["宝贵", "便宜", "普通", "破旧"], answer: 0, explain: "珍贵和宝贵意思相近。" },
      { q: "「宽阔」的近义词是？", options: ["广阔", "狭窄", "细小", "短小"], answer: 0, explain: "宽阔和广阔意思相近。" },
      { q: "「弯曲」的反义词是？", options: ["笔直", "扭曲", "盘旋", "拐弯"], answer: 0, explain: "弯曲和笔直意思相反。" },
      { q: "下面的句子哪个是疑问句？", options: ["你吃饭了吗？", "我吃饭了。", "去吃饭吧！", "他没吃饭。"], answer: 0, explain: "有问号、表示提问的是疑问句。" },
      { q: "「风把门吹开了」改成被字句？", options: ["门被风吹开了", "风吹开门了", "门开了风", "风吹门"], answer: 0, explain: "被字句：门被风吹开了。" },
      { q: "「骄傲的公鸡」中，'骄傲'是？", options: ["形容词", "名词", "动词", "副词"], answer: 0, explain: "骄傲描写公鸡的样子，是形容词。" },
      { q: "「落英缤纷」形容什么？", options: ["花瓣纷飞", "石头落下", "下雨", "下雪"], answer: 0, explain: "落英缤纷形容花瓣纷纷飘落的美景。" },
      { q: "「学海无涯」中「涯」是什么意思？", options: ["尽头", "水", "海", "学习"], answer: 0, explain: "涯是尽头、边际，学海无涯指学无止境。" },
      { q: "下面哪个是成语？", options: ["画龙点睛", "很大很大", "慢慢地走", "红红的太阳"], answer: 0, explain: "画龙点睛是固定成语，其他是普通短语。" },
      { q: "「千里送鹅毛」下一句是？", options: ["礼轻情意重", "一片冰心", "不进则退", "海枯石烂"], answer: 0, explain: "千里送鹅毛——礼轻情意重。" },
      { q: "「春暖花开」描写哪个季节？", options: ["春天", "夏天", "秋天", "冬天"], answer: 0, explain: "春暖花开描写春天。" }
    ],
    english: [
      { q: "What time is it? 是问什么？", options: ["几点了", "在哪里", "是谁", "为什么"], answer: 0, explain: "What time is it? = 现在几点了？" },
      { q: "I am a student. 中 student 是？", options: ["学生", "老师", "医生", "工人"], answer: 0, explain: "student = 学生。" },
      { q: "Sunday 是星期几？", options: ["星期日", "星期六", "星期一", "星期五"], answer: 0, explain: "Sunday = 星期日。" },
      { q: "Happy birthday! 是什么意思？", options: ["生日快乐", "新年快乐", "圣诞快乐", "节日快乐"], answer: 0, explain: "Happy birthday! = 生日快乐！" },
      { q: "下面的词哪个是颜色？", options: ["Blue", "Book", "Bird", "Big"], answer: 0, explain: "Blue = 蓝色。" },
      { q: "Monday 是星期几？", options: ["星期一", "星期日", "星期二", "星期三"], answer: 0, explain: "Monday = 星期一。" },
      { q: "Friday 是星期几？", options: ["星期五", "星期四", "星期六", "星期一"], answer: 0, explain: "Friday = 星期五。" },
      { q: "Friend 是什么意思？", options: ["朋友", "敌人", "老师", "家人"], answer: 0, explain: "Friend = 朋友。" },
      { q: "Family 是什么意思？", options: ["家庭", "学校", "商店", "医院"], answer: 0, explain: "Family = 家庭/家人。" },
      { q: "Help 是什么意思？", options: ["帮助", "伤害", "离开", "等待"], answer: 0, explain: "Help = 帮助。" },
      { q: "Run 是什么意思？", options: ["跑", "走", "坐", "站"], answer: 0, explain: "Run = 跑。" },
      { q: "Eat 是什么意思？", options: ["吃", "喝", "睡", "玩"], answer: 0, explain: "Eat = 吃。" },
      { q: "Drink 是什么意思？", options: ["喝", "吃", "看", "听"], answer: 0, explain: "Drink = 喝。" },
      { q: "Read 是什么意思？", options: ["读", "写", "唱", "画"], answer: 0, explain: "Read = 读。" },
      { q: "Black 是什么颜色？", options: ["黑色", "白色", "红色", "蓝色"], answer: 0, explain: "Black = 黑色。" },
      { q: "White 是什么颜色？", options: ["白色", "黑色", "红色", "绿色"], answer: 0, explain: "White = 白色。" },
      { q: "How old are you? 是问什么？", options: ["几岁了", "叫什么", "在哪里", "你好吗"], answer: 0, explain: "How old are you? = 你几岁了？" },
      { q: "Today 是什么意思？", options: ["今天", "昨天", "明天", "现在"], answer: 0, explain: "Today = 今天。" },
      { q: "Spring 是什么季节？", options: ["春天", "夏天", "秋天", "冬天"], answer: 0, explain: "Spring = 春天。" }
    ],
    science: [
      { q: "地球绕着什么转？", options: ["太阳", "月亮", "火星", "自己"], answer: 0, explain: "地球绕太阳公转，一年转一圈。" },
      { q: "下面哪种是可再生能源？", options: ["太阳能", "煤炭", "石油", "天然气"], answer: 0, explain: "太阳能取之不尽，是可再生能源。" },
      { q: "光的速度比声音快还是慢？", options: ["快", "慢", "一样", "看情况"], answer: 0, explain: "光速比声速快得多，所以先看到闪电再听到雷。" },
      { q: "人体最大的器官是？", options: ["皮肤", "心脏", "肝脏", "肺"], answer: 0, explain: "皮肤是人体最大的器官，覆盖全身。" },
      { q: "植物白天主要进行什么作用？", options: ["光合作用", "呼吸作用", "蒸腾作用", "繁殖"], answer: 0, explain: "植物白天有阳光时进行光合作用，制造养分。" },
      { q: "月亮绕着什么转？", options: ["地球", "太阳", "火星", "金星"], answer: 0, explain: "月亮是地球的卫星，绕着地球转。" },
      { q: "下面哪种动物是无脊椎动物？", options: ["蚂蚁", "狗", "猫", "鱼"], answer: 0, explain: "蚂蚁没有脊柱，是无脊椎动物。" },
      { q: "铁在潮湿空气中会变成什么？", options: ["生锈", "变亮", "变软", "融化"], answer: 0, explain: "铁在潮湿空气中会氧化生锈。" },
      { q: "下面哪个是导体？", options: ["铜", "塑料", "橡胶", "木头"], answer: 0, explain: "铜是金属，能导电，是导体。" },
      { q: "下面哪个是绝缘体？", options: ["橡胶", "铁", "铜", "铝"], answer: 0, explain: "橡胶不导电，是绝缘体。" },
      { q: "食物链中植物是什么？", options: ["生产者", "消费者", "分解者", "捕食者"], answer: 0, explain: "植物能光合作用制造养分，是生产者。" },
      { q: "我们呼吸吸入的是什么气体？", options: ["氧气", "二氧化碳", "氮气", "氢气"], answer: 0, explain: "我们吸入氧气，呼出二氧化碳。" },
      { q: "下面哪个是化学变化？", options: ["燃烧", "融化", "撕碎", "切开"], answer: 0, explain: "燃烧产生新物质，是化学变化。" },
      { q: "下面哪个是物理变化？", options: ["冰融化成水", "木头燃烧", "铁生锈", "食物腐烂"], answer: 0, explain: "冰融化只是状态变化，没产生新物质，是物理变化。" },
      { q: "地球的自转产生什么现象？", options: ["昼夜交替", "四季", "潮汐", "地震"], answer: 0, explain: "地球自转一圈一天，产生昼夜交替。" },
      { q: "地球的公转产生什么现象？", options: ["四季变化", "昼夜", "日食", "月相"], answer: 0, explain: "地球绕太阳公转一圈一年，产生四季。" },
      { q: "下面哪种能量来自太阳？", options: ["太阳能", "核能", "地热能", "潮汐能"], answer: 0, explain: "太阳能直接来自太阳。" },
      { q: "胃的主要功能是？", options: ["消化食物", "呼吸", "血液循环", "思考"], answer: 0, explain: "胃分泌胃液消化食物。" },
      { q: "雾是什么现象？", options: ["水蒸气凝结的小水滴", "烟", "灰尘", "气体"], answer: 0, explain: "雾是空气中水蒸气凝结成的小水滴。" }
    ]
  }
};

// 四年级强化题库：接近人教版四年级常见难度，覆盖多位数计算、应用题、语文基础、英语句型与科学常识。
function expandGrade4Bank() {
  const g4 = QUIZ_DATA.grade4;
  const push = (subject, q, options, answer, explain) => g4[subject].push({ q, options, answer, explain });
  const pushFirst = (subject, q, correct, wrongs, explain) => push(subject, q, [correct, ...wrongs], 0, explain);

  for (let a = 18; a <= 57; a += 3) {
    const b = a + 14;
    const ans = a * b;
    pushFirst('math', `${a} × ${b} = ?`, String(ans), [String(ans + a), String(ans - b), String((a + 2) * (b - 1))], `先算 ${a}×${b}，积是 ${ans}。`);
  }
  for (let b = 12; b <= 31; b += 2) {
    const q = b * 24 + 7;
    pushFirst('math', `${q} ÷ ${b} = ?`, `24 余 7`, [`23 余 ${b + 7}`, `25 余 ${7 - b < 0 ? 7 : 7 - b}`, `24 余 ${b}`], `${b}×24=${b * 24}，还剩 7。`);
  }
  for (let w = 8; w <= 32; w += 4) {
    const h = w + 6;
    pushFirst('math', `长方形长 ${h} 米，宽 ${w} 米，面积是多少平方米？`, String(h * w), [String((h + w) * 2), String(h + w), String(h * w + h)], `面积=长×宽=${h}×${w}=${h * w}。`);
    pushFirst('math', `长方形长 ${h} 米，宽 ${w} 米，周长是多少米？`, String((h + w) * 2), [String(h * w), String(h + w), String((h + w) * 4)], `周长=(长+宽)×2=(${h}+${w})×2=${(h + w) * 2}。`);
  }
  for (let kg = 2; kg <= 11; kg++) {
    pushFirst('math', `${kg} 千克 ${kg * 80} 克合起来是多少克？`, String(kg * 1000 + kg * 80), [String(kg * 100 + kg * 80), String(kg * 1000 - kg * 80), String((kg + 1) * 1000 + kg * 80)], `1千克=1000克，所以是 ${kg * 1000}+${kg * 80}。`);
  }
  for (let d = 3; d <= 12; d++) {
    pushFirst('math', `把一个整体平均分成 ${d} 份，取其中 1 份，用分数表示是？`, `1/${d}`, [`${d}/1`, `1/${d + 1}`, `${d - 1}/${d}`], `平均分成 ${d} 份，1份就是 1/${d}。`);
  }
  const wordMath = [
    ['图书馆有 126 本故事书，又买来 48 本，借出 57 本，还剩多少本？', '117', ['231','183','69'], '126+48-57=117。'],
    ['一辆车每小时行 68 千米，4 小时行多少千米？', '272', ['262','268','288'], '速度×时间=路程，68×4=272。'],
    ['学校买来 15 箱牛奶，每箱 24 盒，一共多少盒？', '360', ['340','390','336'], '15×24=360。'],
    ['一根绳子长 96 米，平均剪成 8 段，每段多少米？', '12', ['8','10','14'], '96÷8=12。'],
    ['一本书 168 页，小明 6 天看完，平均每天看多少页？', '28', ['26','24','30'], '168÷6=28。'],
    ['一个角比直角小 25°，这个角是多少度？', '65°', ['75°','115°','25°'], '直角是90°，90°-25°=65°。'],
    ['一个数四舍五入到万位是 8 万，这个数可能是？', '78320', ['84999','7500','89999'], '78320 四舍五入到万位是 8 万。'],
    ['甲数是 36，乙数是甲数的 4 倍，乙数是多少？', '144', ['40','108','132'], '36×4=144。'],
    ['480 里面有多少个 16？', '30', ['24','28','32'], '480÷16=30。'],
    ['一个正方形边长 17 厘米，周长是多少厘米？', '68', ['289','34','51'], '正方形周长=边长×4=68。']
  ];
  for (const [q, correct, wrongs, explain] of wordMath) pushFirst('math', q, correct, wrongs, explain);

  const chineseRows = [
    ['下面词语中没有错别字的是？', '坚持不懈', ['坚侍不懈','坚持不泄','艰持不懈'], '“坚持不懈”表示一直坚持，不松懈。'],
    ['“欣喜若狂”的意思最接近？', '高兴到了极点', ['非常害怕','十分安静','很想睡觉'], '若狂是像发狂一样，形容特别高兴。'],
    ['“他像离弦的箭一样冲出去”用了什么修辞？', '比喻', ['拟人','排比','反问'], '把人冲出去的速度比作离弦的箭，是比喻。'],
    ['下面句子标点正确的是？', '妈妈说：“明天我们去图书馆。”', ['妈妈说，“明天我们去图书馆”。','妈妈说：“明天我们去图书馆”。','妈妈说，“明天我们去图书馆。”'], '提示语后面用冒号，引语放在引号内。'],
    ['“既然……就……”表示什么关系？', '因果关系', ['转折关系','并列关系','选择关系'], '既然说明原因，就引出结果。'],
    ['下面哪个词语适合形容学习认真？', '专心致志', ['左顾右盼','漫不经心','三心二意'], '专心致志表示注意力集中。'],
    ['“桂林山水甲天下”中“甲”的意思是？', '第一', ['盔甲','天干第一位','保护'], '这里的“甲”表示第一、最好的意思。'],
    ['下面句子有语病的是？', '我估计他一定会来。', ['春天，花儿开放了。','同学们认真听讲。','这本书很有趣。'], '“估计”和“一定”语气矛盾。'],
    ['“鸟儿在枝头唱歌”用了什么修辞？', '拟人', ['夸张','对偶','反问'], '把鸟叫写成唱歌，是拟人。'],
    ['“千钧一发”形容什么情况？', '非常危急', ['非常轻松','非常热闹','非常整齐'], '千钧重量系在一根头发上，形容危险紧急。'],
    ['给“安静”选择反义词。', '喧闹', ['寂静','宁静','沉静'], '安静的反义词是喧闹。'],
    ['给“赞许”选择近义词。', '赞同', ['反对','责备','忽略'], '赞许表示认可、赞同。'],
    ['“不但……而且……”表示什么关系？', '递进关系', ['选择关系','假设关系','条件关系'], '后一句比前一句更进一层。'],
    ['下面哪个是描写人物神态的词？', '眉开眼笑', ['健步如飞','高声朗读','认真书写'], '眉开眼笑写的是脸上的神态。'],
    ['缩句正确的是：“美丽的蝴蝶在花丛中轻快地飞舞。”', '蝴蝶飞舞。', ['美丽飞舞。','花丛飞舞。','蝴蝶在花丛。'], '缩句保留主干：谁怎么样。'],
    ['“一尘不染”通常形容？', '非常干净', ['很勇敢','很聪明','很吵闹'], '一粒灰尘也没有，表示干净。'],
    ['下面哪个词语结构是 AABB？', '高高兴兴', ['绿油油','研究研究','越来越好'], '高高兴兴是 AABB 结构。'],
    ['“日积月累”的意思是？', '长时间不断积累', ['一天完成','月亮很亮','东西很多'], '日和月表示时间长期持续。'],
    ['下面适合放在句首表示转折的是？', '然而', ['因为','所以','并且'], '然而表示转折。'],
    ['“火红的太阳升起来了”中“火红的”修饰什么？', '太阳', ['升','起来','了'], '“火红的”是定语，修饰太阳。']
  ];
  for (const row of chineseRows) pushFirst('chinese', row[0], row[1], row[2], row[3]);

  const englishRows = [
    ['I ___ a student.', 'am', ['is','are','be'], 'I 后面用 am。'],
    ['She ___ reading a book now.', 'is', ['am','are','be'], 'She 是第三人称单数，现在进行时用 is。'],
    ['They ___ football after school.', 'play', ['plays','playing','played'], 'They 是复数主语，动词用原形 play。'],
    ['Yesterday I ___ to the park.', 'went', ['go','goes','going'], 'Yesterday 表示过去，用 went。'],
    ['There ___ two apples on the table.', 'are', ['is','am','be'], 'two apples 是复数，用 are。'],
    ['This is ___ umbrella.', 'an', ['a','the','/'], 'umbrella 以元音音素开头，用 an。'],
    ['Which word means “困难的”？', 'difficult', ['easy','clean','quiet'], 'difficult 表示困难的。'],
    ['What does “borrow” mean?', '借入', ['归还','购买','扔掉'], 'borrow 是借入。'],
    ['“我每天七点起床”应译为？', 'I get up at seven every day.', ['I gets up at seven every day.','I get on at seven every day.','I got up every day seven.'], '一般现在时，I 后用 get。'],
    ['Choose the plural form of “child”.', 'children', ['childs','childes','childrens'], 'child 的复数是不规则形式 children。'],
    ['He is taller ___ me.', 'than', ['then','that','to'], '比较级后常用 than。'],
    ['What time is it? 的意思是？', '几点了？', ['你好吗？','你几岁？','你在哪里？'], 'What time is it? 用来询问时间。'],
    ['May I ___ your pencil?', 'use', ['uses','using','used'], 'May I 后接动词原形。'],
    ['The opposite of “early” is?', 'late', ['fast','long','short'], 'early 的反义词是 late。'],
    ['We should keep our classroom ___.', 'clean', ['angry','heavy','sweet'], 'keep ... clean 表示保持干净。'],
    ['Which sentence is correct?', 'Does he like music?', ['Do he like music?','Does he likes music?','Is he like music?'], '第三人称单数疑问句用 Does，动词还原。']
  ];
  for (const row of englishRows) pushFirst('english', row[0], row[1], row[2], row[3]);

  const scienceRows = [
    ['简单电路中，灯泡发光必须形成什么？', '闭合回路', ['断开的电路','只有电池','只有导线'], '电流要能连续流动，必须形成闭合回路。'],
    ['水蒸气遇冷变成小水滴，这叫？', '凝结', ['蒸发','融化','燃烧'], '气体变成液体叫凝结。'],
    ['指南针的指针主要受什么影响？', '地磁场', ['太阳光','空气温度','月亮引力'], '指南针利用地磁场指示方向。'],
    ['声音能在真空中传播吗？', '不能', ['能','只在夜晚能','只在水中不能'], '声音传播需要介质，真空中不能传播。'],
    ['物体受到推或拉，运动状态可能会怎样？', '发生改变', ['永远不变','一定消失','变成光'], '力可以改变物体的运动状态。'],
    ['植物根的主要作用之一是？', '吸收水分', ['制造阳光','产生声音','反射光线'], '根能吸收水分和固定植物。'],
    ['月相变化大约经历多长时间一轮？', '一个月', ['一天','一年','一小时'], '月相变化大约一个月循环一轮。'],
    ['铁钉生锈通常需要什么条件？', '水和空气', ['只有阳光','只有沙子','只有声音'], '铁在水和空气作用下容易生锈。'],
    ['食物在人体内主要通过哪个系统被消化吸收？', '消化系统', ['呼吸系统','运动系统','神经系统'], '消化系统负责消化和吸收营养。'],
    ['影子的长短主要和什么有关？', '光照角度', ['物体颜色','声音大小','空气味道'], '太阳高度变化会影响影子长短。'],
    ['下面哪种属于混合物？', '盐水', ['纯水','氧气','铁'], '盐水由盐和水混合而成。'],
    ['弹簧被压缩后会恢复，说明它具有？', '弹性', ['磁性','导电性','腐蚀性'], '能恢复形状的性质叫弹性。'],
    ['地球表面的水不断蒸发、降水，叫？', '水循环', ['食物链','昼夜交替','地震'], '水在自然界不断循环。'],
    ['热空气通常会怎样运动？', '上升', ['下降','静止','变成固体'], '热空气密度较小，通常会上升。'],
    ['保护听力应该避免什么？', '长时间听很大的声音', ['正常说话','安静阅读','看书写字'], '长时间强噪声会伤害听力。'],
    ['下面哪种材料容易导电？', '金属铜', ['塑料尺','橡皮','干木头'], '金属通常是良好导体。']
  ];
  for (const row of scienceRows) pushFirst('science', row[0], row[1], row[2], row[3]);

  for (let n = 24; n <= 168; n += 4) {
    const a = n + 37;
    const b = n - 11;
    pushFirst('math', `${a} + ${b} - ${Math.floor(n / 2)} = ?`, String(a + b - Math.floor(n / 2)), [String(a + b), String(a - b), String(a + b - n)], '按从左到右的顺序计算加减混合运算。');
  }
  for (let n = 9; n <= 96; n += 3) {
    const price = n + 16;
    const count = (n % 7) + 4;
    pushFirst('math', `每本练习本 ${price} 角，买 ${count} 本一共多少角？`, String(price * count), [String(price + count), String(price * (count + 1)), String(price * count - price)], `总价=单价×数量=${price}×${count}。`);
  }
  for (let n = 5; n <= 64; n += 2) {
    const total = n * 12;
    pushFirst('math', `${total} 个苹果平均装进 ${n} 个篮子，每个篮子装多少个？`, '12', [String(n), String(total - n), String(24)], `${total}÷${n}=12。`);
  }
  for (let n = 2; n <= 48; n += 2) {
    pushFirst('math', `${n} 小时 ${15 + n} 分 = 多少分？`, String(n * 60 + 15 + n), [String(n * 60), String((15 + n) * 60), String(n * 100 + 15 + n)], `1小时=60分，所以是 ${n}×60+${15 + n}。`);
  }

  const idioms = [
    ['聚精会神','注意力非常集中'], ['胸有成竹','做事前已有把握'], ['井井有条','有条理不混乱'], ['异口同声','很多人说同样的话'],
    ['争先恐后','抢着向前，生怕落后'], ['风和日丽','天气晴朗暖和'], ['画龙点睛','关键处一笔使内容生动'], ['恍然大悟','一下子明白过来'],
    ['川流不息','人车来往不断'], ['奋不顾身','勇往直前不顾危险'], ['语重心长','话语诚恳有分量'], ['精疲力竭','非常疲劳'],
    ['刨根问底','追究事情根源'], ['不约而同','没有约定却一起行动'], ['津津有味','兴趣很浓的样子'], ['目不转睛','眼睛盯着不动'],
    ['鸦雀无声','非常安静'], ['络绎不绝','连续不断'], ['受益匪浅','得到很多好处'], ['举世闻名','全世界都知道']
  ];
  for (const [word, meaning] of idioms) {
    pushFirst('chinese', `成语“${word}”的意思最接近？`, meaning, ['声音特别大','速度特别慢','颜色特别鲜艳'], `“${word}”表示${meaning}。`);
  }
  const relationWords = [
    ['因为','所以','因果'], ['虽然','但是','转折'], ['如果','就','假设'], ['只要','就','条件'],
    ['不仅','还','递进'], ['不是','而是','并列选择'], ['即使','也','让步'], ['一边','一边','并列']
  ];
  for (const [a, b, rel] of relationWords) {
    pushFirst('chinese', `“${a}……${b}……”通常表示什么关系？`, `${rel}关系`, ['因果关系','转折关系','递进关系'].filter(x => x !== `${rel}关系`).slice(0, 3).concat(['选择关系']).slice(0, 3), `这组关联词常表示${rel}关系。`);
  }
  const sentenceFixes = [
    ['通过这次活动，使我懂得了合作的重要。','这次活动使我懂得了合作的重要。'],
    ['我们要养成认真检查作业。','我们要养成认真检查作业的习惯。'],
    ['他的写作水平明显改进了。','他的写作水平明显提高了。'],
    ['我断定他大概已经回家了。','我断定他已经回家了。'],
    ['公园里开满了五颜六色的红花。','公园里开满了五颜六色的花。'],
    ['他穿着一件蓝上衣和一顶帽子。','他穿着一件蓝上衣，戴着一顶帽子。'],
    ['老师耐心地改正并指出我的错误。','老师耐心地指出并改正我的错误。'],
    ['我把今天的作业基本上全部做完了。','我把今天的作业全部做完了。']
  ];
  for (const [bad, good] of sentenceFixes) {
    pushFirst('chinese', `下面病句“${bad}”修改正确的是？`, good, ['保持原句不变。', '把句号改成问号。', '只删掉第一个字。'], '修改病句要让意思明确、搭配恰当。');
  }

  const verbRows = [
    ['write','wrote','写'], ['read','read','读'], ['buy','bought','买'], ['bring','brought','带来'], ['make','made','制作'],
    ['take','took','拿走'], ['see','saw','看见'], ['say','said','说'], ['eat','ate','吃'], ['drink','drank','喝'],
    ['come','came','来'], ['run','ran','跑'], ['swim','swam','游泳'], ['sing','sang','唱歌'], ['draw','drew','画画']
  ];
  for (const [base, past, cn] of verbRows) {
    pushFirst('english', `动词 ${base} 的过去式是？`, past, [`${base}ed`, `${base}s`, `${base}ing`], `${base} 表示“${cn}”，过去式是 ${past}。`);
    pushFirst('english', `${base} 的中文意思是？`, cn, ['睡觉','打扫','等待'], `${base} = ${cn}。`);
  }
  const grammarSubjects = [['I','am'], ['You','are'], ['We','are'], ['They','are'], ['He','is'], ['She','is'], ['It','is'], ['My father','is'], ['The boys','are'], ['The cat','is']];
  for (const [subj, be] of grammarSubjects) {
    pushFirst('english', `${subj} ___ in the classroom.`, be, ['am','is','are'].filter(x => x !== be), `${subj} 对应 be 动词 ${be}。`);
  }
  const englishWords = [
    ['library','图书馆'], ['hospital','医院'], ['museum','博物馆'], ['between','在两者之间'], ['beside','在旁边'],
    ['weather','天气'], ['usually','通常'], ['sometimes','有时'], ['healthy','健康的'], ['careful','仔细的'],
    ['different','不同的'], ['important','重要的'], ['question','问题'], ['answer','答案'], ['because','因为']
  ];
  for (const [en, cn] of englishWords) pushFirst('english', `${en} 的意思是？`, cn, ['昨天','马上','蓝色'], `${en} = ${cn}。`);

  const scienceConcepts = [
    ['蒸发','液体变成气体'], ['凝固','液体变成固体'], ['融化','固体变成液体'], ['反射','光遇到物体表面改变方向'],
    ['折射','光从一种介质进入另一种介质方向改变'], ['导体','容易让电流通过的物体'], ['绝缘体','不容易让电流通过的物体'],
    ['磁极','磁铁磁性最强的两端'], ['摩擦力','阻碍物体相对运动的力'], ['重力','地球吸引物体的力'],
    ['生产者','能自己制造养分的生物'], ['消费者','直接或间接吃植物的生物'], ['分解者','分解动植物遗体的生物'],
    ['水循环','水在自然界不断运动变化'], ['光合作用','植物利用阳光制造养分'], ['呼吸作用','生物获得能量的过程'],
    ['沉积','泥沙等慢慢堆积下来'], ['侵蚀','流水或风等使地表被破坏搬走'], ['溶解','一种物质均匀分散到另一种物质中'],
    ['过滤','用滤纸等分离不溶物和液体']
  ];
  for (const [term, meaning] of scienceConcepts) {
    pushFirst('science', `${term} 指的是？`, meaning, ['声音变大','颜色变深','物体消失'], `${term}：${meaning}。`);
  }
  const circuitItems = [['开关','控制电路通断'], ['电池','提供电能'], ['灯泡','把电能转化为光和热'], ['导线','连接电路元件']];
  for (const [name, role] of circuitItems) {
    pushFirst('science', `简单电路中，${name}的作用是？`, role, ['吸收水分','制造食物','改变月相'], `${name}在电路中用来${role}。`);
  }

  for (let seed = 1; seed <= 260; seed++) {
    const a = 37 + seed;
    const b = 12 + (seed % 68);
    const c = 3 + (seed % 9);
    const mode = seed % 5;
    if (mode === 0) {
      const ans = a * c + b;
      pushFirst('math', `${a} × ${c} + ${b} = ?`, String(ans), [String(a * (c + 1) + b), String(a * c - b), String(a + b + c)], `先乘后加：${a}×${c}+${b}=${ans}。`);
    } else if (mode === 1) {
      const ans = (a + b) * c;
      pushFirst('math', `(${a} + ${b}) × ${c} = ?`, String(ans), [String(a + b * c), String(a * c + b), String(ans - c)], `先算括号，再乘以 ${c}。`);
    } else if (mode === 2) {
      const ans = a * b;
      pushFirst('math', `${a} × ${b} 的积最接近下面哪一个？`, String(ans), [String(ans + a * 2), String(ans - b * 3), String(a + b)], `准确计算积为 ${ans}。`);
    } else if (mode === 3) {
      const total = b * c + seed % c;
      const rem = total % c;
      pushFirst('math', `${total} ÷ ${c} = ?`, `${Math.floor(total / c)} 余 ${rem}`, [`${Math.floor(total / c) + 1} 余 ${rem}`, `${Math.floor(total / c)} 余 ${c}`, `${Math.floor(total / c) - 1} 余 ${rem}`], `商是 ${Math.floor(total / c)}，余数是 ${rem}。`);
    } else {
      const longSide = b + c;
      const shortSide = c + 5;
      const ans = (longSide + shortSide) * 2;
      pushFirst('math', `长 ${longSide} 厘米、宽 ${shortSide} 厘米的长方形周长是多少厘米？`, String(ans), [String(longSide * shortSide), String(longSide + shortSide), String(ans + 4)], `周长=(长+宽)×2=${ans}。`);
    }
  }

  const cnWords = ['观察','鼓励','清晰','敏捷','辽阔','诚恳','珍惜','探索','判断','积累','严肃','熟练','安慰','宽阔','准确','仿佛','逐渐','仍然','尤其','猛烈'];
  for (const word of cnWords) {
    pushFirst('chinese', `给词语“${word}”选择最合适的造句要求。`, `句子意思要完整，并且正确使用“${word}”。`, ['只要字数多就行。','必须把词语拆开使用。','标点可以随意省略。'], '造句要意思完整，用词准确。');
    pushFirst('chinese', `阅读短文时，遇到关键词“${word}”，最应该先做什么？`, '联系上下文理解意思', ['立刻跳过不看','只看标点','把整段删掉'], '理解词语要结合上下文。');
  }
  const readingSkills = [
    ['概括段意','抓住这一段主要写了什么'], ['理解中心','找出文章想表达的主要意思'], ['品味词句','思考词语和句子的表达效果'],
    ['划分层次','根据内容变化分清结构'], ['提取信息','从文中找出有用内容'], ['推想含义','根据上下文合理判断没有直接说明的意思'],
    ['复述故事','按顺序说清主要情节'], ['体会情感','感受作者或人物的心情']
  ];
  for (const [skill, meaning] of readingSkills) {
    pushFirst('chinese', `阅读方法“${skill}”主要是指？`, meaning, ['只数自然段个数','只看题目不看正文','随便猜一个答案'], `${skill}就是${meaning}。`);
  }

  const pronouns = [['my','我的'], ['your','你的'], ['his','他的'], ['her','她的'], ['our','我们的'], ['their','他们的']];
  const nouns = [['book','书'], ['desk','课桌'], ['bag','书包'], ['pencil','铅笔'], ['classroom','教室'], ['homework','作业'], ['picture','图画'], ['story','故事']];
  for (const [pro, cn] of pronouns) {
    for (const [noun, nounCn] of nouns) {
      pushFirst('english', `${pro} ${noun} 的意思是？`, `${cn}${nounCn}`, [`你的${nounCn}`, `他的${nounCn}`, `我们的${nounCn}`], `${pro} 表示“${cn}”。`);
    }
  }
  const timeWords = [['always','总是'], ['usually','通常'], ['often','经常'], ['sometimes','有时'], ['never','从不']];
  for (const [en, cn] of timeWords) {
    pushFirst('english', `I ${en} read after dinner. 句中 ${en} 的意思是？`, cn, ['昨天','马上','在下面'], `${en} 表示频率：${cn}。`);
  }

  const scienceSituations = [
    ['把冰块放在温暖的房间里，冰会慢慢变成水。这个变化叫？','融化'],
    ['湿衣服晒在太阳下变干，水主要发生了什么变化？','蒸发'],
    ['冬天窗户上出现小水珠，常见原因是？','水蒸气凝结'],
    ['用磁铁靠近铁钉，铁钉被吸引，说明铁钉能被什么吸引？','磁铁'],
    ['用力推小车，小车速度变快，说明力可以改变什么？','运动状态'],
    ['把盐放入水中看不见了，但水变咸，说明盐发生了什么？','溶解'],
    ['用滤纸过滤泥水，主要分离什么？','不溶于水的泥沙'],
    ['白天太阳高度较高时，人的影子通常怎样？','较短'],
    ['夜晚看月亮形状变化，这是观察什么？','月相'],
    ['植物叶片大多呈绿色，和哪种结构有关？','叶绿体']
  ];
  for (let i = 0; i < 8; i++) {
    for (const [q, correct] of scienceSituations) {
      pushFirst('science', q.replace('什么', i % 2 ? '哪一项' : '什么'), correct, ['燃烧','沉积','声音传播'], '根据现象判断对应的科学概念。');
    }
  }
}
expandGrade4Bank();

// 随机抽题工具
const QuizHelper = {
  // 按年级随机抽 n 道题（混合科目）
  pick(grade, n = 5) {
    const gradeData = QUIZ_DATA['grade' + grade] || QUIZ_DATA.grade3;
    const all = [];
    for (const subject in gradeData) {
      for (const q of gradeData[subject]) {
        all.push(this._withShuffledOptions({ ...q, subject, grade }));
      }
    }
    // 洗牌
    const shuffled = all.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, all.length));
  },

  // 难度对应的年级（神庙难度越高年级越高）
  gradeByDifficulty(diff) {
    return 4;
  },

  _withShuffledOptions(q) {
    const options = (q.options || []).map((text, i) => ({ text, correct: i === q.answer }));
    const shuffled = options.slice().sort(() => Math.random() - 0.5);
    return {
      ...q,
      options: shuffled.map(x => x.text),
      answer: Math.max(0, shuffled.findIndex(x => x.correct))
    };
  }
};
