/**
 * 沪教牛津版（深圳用）2024 新版一年级下册教材数据。
 *
 * 内容按 2026-08-09 全册扫描件逐页校订，并用完整课本音频复核。
 * 学生手写答案、批注和涂画均未录入。
 */

module.exports = {
  book: '一年级下册',
  publisher: '上海教育出版社（沪教牛津版·深圳用·2024）',
  contentStatus: 'textbook-verified',
  units: [
    {
      id: 'unit-01',
      title: 'What food do you like?',
      subtitle: '你喜欢什么食物？',
      pageRange: '第2-9页',
      source: {
        scanPages: 'page_0003-page_0010',
        audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0Nzgy'
      },
      words: [
        { english: 'noodles', chinese: '面条', image: '' },
        { english: 'baozi', chinese: '包子', image: '' },
        { english: 'rice', chinese: '米饭', image: '' },
        { english: 'carrot', chinese: '胡萝卜', image: '' },
        { english: 'tomato', chinese: '西红柿', image: '' },
        { english: 'bread', chinese: '面包', image: '' },
        { english: 'egg', chinese: '鸡蛋', image: '' },
        { english: 'milk', chinese: '牛奶', image: '' }
      ],
      sentences: [
        { english: 'What food do you like?', chinese: '你喜欢什么食物？' },
        { english: 'I like noodles.', chinese: '我喜欢面条。' },
        { english: 'I like baozi.', chinese: '我喜欢包子。' },
        { english: 'I like rice.', chinese: '我喜欢米饭。' },
        { english: 'I like carrots and tomatoes, too.', chinese: '我也喜欢胡萝卜和西红柿。' },
        { english: 'I like bread and eggs.', chinese: '我喜欢面包和鸡蛋。' },
        { english: 'I like milk, too.', chinese: '我也喜欢牛奶。' },
        { english: 'Do you like fish?', chinese: '你喜欢鱼吗？' },
        { english: 'Yes, I do.', chinese: '是的，我喜欢。' },
        { english: "No, I don't.", chinese: '不，我不喜欢。' }
      ],
      readyChant: {
        title: 'Eggs, eggs',
        titleChinese: '鸡蛋歌谣',
        lines: [
          { english: 'Eggs, eggs. One, two, three.', chinese: '鸡蛋，鸡蛋。一、二、三。' },
          { english: 'One for you and two for me.', chinese: '一个给你，两个给我。' },
          { english: 'Two for you? No. Two for me!', chinese: '两个给你？不，两个给我！' },
          { english: 'Eggs, eggs. One, two, three.', chinese: '鸡蛋，鸡蛋。一、二、三。' },
          { english: 'Eggs, eggs. One, two, three.', chinese: '鸡蛋，鸡蛋。一、二、三。' },
          { english: 'One for you and one for me.', chinese: '一个给你，一个给我。' },
          { english: 'One for Mother! Yes, I see!', chinese: '一个给妈妈！好，我明白了！' },
          { english: 'Eggs, eggs. One, two, three.', chinese: '鸡蛋，鸡蛋。一、二、三。' }
        ]
      },
      communication: {
        title: 'Think, stick and talk',
        titleChinese: '想一想，贴一贴，说一说',
        lines: [
          { english: 'Do you like fish?', chinese: '你喜欢鱼吗？' },
          { english: 'Yes, I do.', chinese: '是的，我喜欢。' },
          { english: 'Do you like ...?', chinese: '你喜欢……吗？' },
          { english: "Yes, I do. / No, I don't.", chinese: '是的，我喜欢。/ 不，我不喜欢。' }
        ],
        question: { english: 'What do you like to eat for dinner?', chinese: '你晚餐喜欢吃什么？' }
      },
      letters: [
        {
          letter: 'Aa', word: 'ant', chinese: '蚂蚁',
          chant: [
            { english: 'Look, Alice!', chinese: '看，爱丽丝！' },
            { english: 'An ant on the apple.', chinese: '苹果上有一只蚂蚁。' },
            { english: 'Oh! An ant on the apple.', chinese: '哦！苹果上有一只蚂蚁。' }
          ]
        },
        {
          letter: 'Bb', word: 'bee', chinese: '蜜蜂',
          chant: [
            { english: 'I see a bee.', chinese: '我看见一只蜜蜂。' },
            { english: 'I see a bird.', chinese: '我看见一只鸟。' },
            { english: 'I see a bee and a bird.', chinese: '我看见一只蜜蜂和一只鸟。' }
          ]
        },
        {
          letter: 'Cc', word: 'cat', chinese: '猫',
          chant: [
            { english: 'Little cat! Little cat!', chinese: '小猫！小猫！' },
            { english: "Here's a can for you.", chinese: '这里有一个罐头给你。' }
          ]
        },
        {
          letter: 'Dd', word: 'doll', chinese: '玩偶',
          chant: [
            { english: 'I have a doll.', chinese: '我有一个玩偶。' },
            { english: 'I have a toy dog.', chinese: '我有一只玩具狗。' },
            { english: 'Look at my doll.', chinese: '看看我的玩偶。' },
            { english: 'Look at my toy dog.', chinese: '看看我的玩具狗。' }
          ]
        }
      ],
      story: {
        title: 'Leon in the garden',
        titleChinese: '莱昂在花园里',
        lines: [
          { english: 'Look at the garden, Laura.', chinese: '劳拉，看看这个花园。' },
          { english: "It's lovely. But where's Leon?", chinese: '花园真漂亮。可是莱昂在哪里？' },
          { english: "I don't know.", chinese: '我不知道。' },
          { english: "Look! It's Blue Clue!", chinese: '看！是蓝色线索！' },
          { english: 'Leon is hungry!', chinese: '莱昂饿了！' },
          { english: 'What food does Leon like?', chinese: '莱昂喜欢什么食物？' },
          { english: "I don't know. But I have an idea.", chinese: '我不知道，不过我有个主意。' },
          { english: 'Tomatoes! Do you like tomatoes, Andy?', chinese: '西红柿！安迪，你喜欢西红柿吗？' },
          { english: 'Yes, I do!', chinese: '是的，我喜欢！' },
          { english: 'Do you like tomatoes, Leon?', chinese: '莱昂，你喜欢西红柿吗？' },
          { english: 'Apples! Do you like apples, Laura?', chinese: '苹果！劳拉，你喜欢苹果吗？' },
          { english: 'Yes, I do!', chinese: '是的，我喜欢！' },
          { english: 'Do you like apples, Leon?', chinese: '莱昂，你喜欢苹果吗？' },
          { english: 'Carrots! Do you like carrots, Andy?', chinese: '胡萝卜！安迪，你喜欢胡萝卜吗？' },
          { english: "No, I don't.", chinese: '不，我不喜欢。' },
          { english: 'But do you like carrots, Leon?', chinese: '但是莱昂，你喜欢胡萝卜吗？' },
          { english: 'Look! Bugs!', chinese: '看！虫子！' },
          { english: "Eww! Let's go!", chinese: '呀！我们走吧！' },
          { english: 'Bugs? Yum!', chinese: '虫子？真好吃！' },
          { english: "Here's Leon!", chinese: '莱昂在这里！' },
          { english: 'Leon likes bugs!', chinese: '莱昂喜欢虫子！' },
          { english: 'Aww!', chinese: '哎呀！' }
        ]
      },
      extendTitle: 'The spider and the honey tree',
      extendTitleChinese: '蜘蛛和蜂蜜树',
      extend: [
        { english: 'A story from Liberia.', chinese: '一个来自利比里亚的故事。' },
        { english: 'One day, Anna is looking for food. She meets a spider.', chinese: '一天，安娜正在寻找食物。她遇到了一只蜘蛛。' },
        { english: 'Can I come with you?', chinese: '我能和你一起去吗？' },
        { english: 'OK.', chinese: '好的。' },
        { english: 'Look! Bananas!', chinese: '看！香蕉！' },
        { english: 'No bananas for me!', chinese: '我不要香蕉！' },
        { english: 'Look! Plums!', chinese: '看！李子！' },
        { english: 'No plums for me!', chinese: '我不要李子！' },
        { english: 'I love honey!', chinese: '我爱吃蜂蜜！' },
        { english: 'Me too!', chinese: '我也是！' },
        { english: "Oh, no! I can't get out!", chinese: '哦，不！我出不去了！' },
        { english: 'Ha ha! Let me help you.', chinese: '哈哈！让我来帮你。' }
      ]
    },
    {
      id: 'unit-02',
      title: 'What do we do in the classroom?',
      subtitle: '我们在教室里做什么？',
      pageRange: '第10-17页',
      source: {
        scanPages: 'page_0011-page_0018',
        audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0Nzkw'
      },
      words: [
        { english: 'window', chinese: '窗户', image: '' },
        { english: 'blackboard', chinese: '黑板', image: '' },
        { english: 'door', chinese: '门', image: '' },
        { english: 'desk', chinese: '书桌', image: '' },
        { english: 'chair', chinese: '椅子', image: '' },
        { english: 'schoolbag', chinese: '书包', image: '' }
      ],
      sentences: [
        { english: 'This is a window.', chinese: '这是一扇窗户。' },
        { english: 'This is a blackboard.', chinese: '这是一块黑板。' },
        { english: 'This is a door.', chinese: '这是一扇门。' },
        { english: 'This is my desk.', chinese: '这是我的书桌。' },
        { english: 'This is my chair.', chinese: '这是我的椅子。' },
        { english: 'This is my schoolbag.', chinese: '这是我的书包。' },
        { english: 'Close the door, please.', chinese: '请关门。' },
        { english: 'Clean the blackboard, please.', chinese: '请擦黑板。' },
        { english: "Don't draw on the blackboard, please.", chinese: '请不要在黑板上画画。' },
        { english: 'Give me an eraser, please.', chinese: '请给我一块橡皮。' },
        { english: 'Here you are.', chinese: '给你。' }
      ],
      readyChant: {
        title: 'This is our classroom',
        titleChinese: '这是我们的教室',
        lines: [
          { english: 'This is our classroom. Please have a look!', chinese: '这是我们的教室。请看一看！' },
          { english: "This is a window. This is a door, and that's a blackboard.", chinese: '这是一扇窗户。这是一扇门，那是一块黑板。' },
          { english: 'This is my chair. This is my desk, and this is my schoolbag.', chinese: '这是我的椅子。这是我的书桌，这是我的书包。' },
          { english: 'This is our classroom, and please come in!', chinese: '这是我们的教室，请进！' }
        ]
      },
      communication: {
        title: 'Stick and play a game',
        titleChinese: '贴一贴，玩游戏',
        lines: [
          { english: 'Close the door.', chinese: '关门。' },
          { english: 'Look at the blackboard.', chinese: '看黑板。' },
          { english: 'Open the bin.', chinese: '打开垃圾桶。' },
          { english: 'Clean the desk.', chinese: '擦书桌。' },
          { english: 'Close the book.', chinese: '合上书。' },
          { english: 'Close the window.', chinese: '关窗。' },
          { english: 'Open the book.', chinese: '打开书。' },
          { english: 'Clean the window.', chinese: '擦窗户。' }
        ],
        question: { english: 'What do you do when you are on duty at school?', chinese: '你在学校值日时会做什么？' }
      },
      letters: [
        {
          letter: 'Ee', word: 'egg', chinese: '鸡蛋',
          chant: [
            { english: 'Look, Ben!', chinese: '看，本！' },
            { english: 'A red hen.', chinese: '一只红色的母鸡。' },
            { english: 'Look, Ben!', chinese: '看，本！' },
            { english: 'A white egg.', chinese: '一个白色的鸡蛋。' }
          ]
        },
        {
          letter: 'Ff', word: 'fish', chinese: '鱼',
          chant: [
            { english: 'One, two, three, four!', chinese: '一、二、三、四！' },
            { english: 'My father has four fish.', chinese: '我爸爸有四条鱼。' }
          ]
        },
        {
          letter: 'Gg', word: 'gift', chinese: '礼物',
          chant: [
            { english: 'Little girl! Little girl!', chinese: '小女孩！小女孩！' },
            { english: "Here's a gift for you.", chinese: '这里有一份礼物给你。' }
          ]
        },
        {
          letter: 'Hh', word: 'hen', chinese: '母鸡',
          chant: [
            { english: 'A hen in a hat!', chinese: '一只戴帽子的母鸡！' },
            { english: 'A hen in a big big hat!', chinese: '一只戴着大大帽子的母鸡！' }
          ]
        }
      ],
      story: {
        title: 'Leon in the classroom',
        titleChinese: '莱昂在教室里',
        lines: [
          { english: "Where's Leon, Ted?", chinese: '特德，莱昂在哪里？' },
          { english: "Let's find him, Emily. Close the door, please.", chinese: '艾米莉，我们来找他吧。请关门。' },
          { english: 'Look at this schoolbag. Is Leon in it?', chinese: '看看这个书包。莱昂在里面吗？' },
          { english: 'No. Put the schoolbag in the desk.', chinese: '不在。把书包放进书桌里。' },
          { english: 'OK.', chinese: '好的。' },
          { english: "Hey, Ted. It's Leon.", chinese: '嘿，特德。是莱昂。' },
          { english: "Yes, but it's a picture.", chinese: '是的，但那是一幅画。' },
          { english: 'Clean the blackboard, please.', chinese: '请擦黑板。' },
          { english: 'OK.', chinese: '好的。' },
          { english: "Oh, no! It's my picture.", chinese: '哦，不！那是我的画。' },
          { english: "Oh, sorry! But don't draw on the blackboard, please.", chinese: '哦，对不起！但是请不要在黑板上画画。' },
          { english: 'Look! Blue Clue!', chinese: '看！蓝色线索！' },
          { english: 'Find a tree.', chinese: '找一棵树。' },
          { english: 'A tree? Here?', chinese: '一棵树？这里吗？' },
          { english: 'Look! A tree! I have an idea.', chinese: '看！一棵树！我有个主意。' },
          { english: 'Give me an eraser, please.', chinese: '请给我一块橡皮。' },
          { english: 'Here you are.', chinese: '给你。' },
          { english: 'Thanks.', chinese: '谢谢。' },
          { english: "It's Leon.", chinese: '是莱昂。' },
          { english: 'Aww!', chinese: '哎呀！' }
        ]
      },
      extendTitle: 'School is over',
      extendTitleChinese: '放学了',
      extend: [
        { english: 'We pack our schoolbags.', chinese: '我们收拾书包。' },
        { english: 'We clean the classroom.', chinese: '我们打扫教室。' },
        { english: 'We close the window.', chinese: '我们关窗。' },
        { english: 'We turn off the lights.', chinese: '我们关灯。' },
        { english: 'We close the door.', chinese: '我们关门。' }
      ]
    },
    {
      id: 'unit-03',
      title: 'How do we play?',
      subtitle: '我们怎么玩？',
      pageRange: '第18-25页',
      source: {
        scanPages: 'page_0019-page_0026',
        audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0Nzk5'
      },
      words: [
        { english: 'ride a bike', chinese: '骑自行车', image: '' },
        { english: 'ride a scooter', chinese: '骑滑板车', image: '' },
        { english: 'rollerblade', chinese: '滑轮滑', image: '' },
        { english: 'play football', chinese: '踢足球', image: '' },
        { english: 'skateboard', chinese: '滑滑板', image: '' }
      ],
      sentences: [
        { english: 'The boy can ride a bike.', chinese: '这个男孩会骑自行车。' },
        { english: 'The girl can ride a scooter.', chinese: '这个女孩会骑滑板车。' },
        { english: 'The girl can rollerblade.', chinese: '这个女孩会滑轮滑。' },
        { english: 'They can play football.', chinese: '他们会踢足球。' },
        { english: 'The boy can skateboard.', chinese: '这个男孩会滑滑板。' },
        { english: 'Can you ride a bike?', chinese: '你会骑自行车吗？' },
        { english: 'Yes, I can.', chinese: '是的，我会。' },
        { english: "No, I can't.", chinese: '不，我不会。' }
      ],
      readyChant: {
        title: "It's so fun",
        titleChinese: '真有趣',
        lines: [
          { english: 'I can ride a bike.', chinese: '我会骑自行车。' },
          { english: 'You can ride a scooter.', chinese: '你会骑滑板车。' },
          { english: "It's so fun.", chinese: '真有趣。' },
          { english: 'I can skateboard.', chinese: '我会滑滑板。' },
          { english: 'You can play yo-yo.', chinese: '你会玩悠悠球。' },
          { english: "It's so fun.", chinese: '真有趣。' },
          { english: 'I can play football.', chinese: '我会踢足球。' },
          { english: 'You can rollerblade.', chinese: '你会滑轮滑。' },
          { english: "It's so fun.", chinese: '真有趣。' }
        ]
      },
      communication: {
        title: 'Do a survey',
        titleChinese: '做调查',
        lines: [
          { english: 'Can you ride a bike?', chinese: '你会骑自行车吗？' },
          { english: 'Yes, I can.', chinese: '是的，我会。' },
          { english: 'Can you ...?', chinese: '你会……吗？' },
          { english: "Yes, I can. / No, I can't.", chinese: '是的，我会。/ 不，我不会。' }
        ],
        question: { english: 'What do you do with your classmates?', chinese: '你和同学们一起做什么？' }
      },
      letters: [
        {
          letter: 'Ii', word: 'insect', chinese: '昆虫',
          chant: [
            { english: 'An insect in a box!', chinese: '盒子里有一只昆虫！' },
            { english: 'In a big big box.', chinese: '在一个大大的盒子里。' }
          ]
        },
        {
          letter: 'Jj', word: 'juice', chinese: '果汁',
          chant: [
            { english: 'Jenny likes juice.', chinese: '珍妮喜欢果汁。' },
            { english: 'Jenny likes jelly.', chinese: '珍妮喜欢果冻。' },
            { english: 'Jenny likes juice and jelly.', chinese: '珍妮喜欢果汁和果冻。' }
          ]
        },
        {
          letter: 'Kk', word: 'kite', chinese: '风筝',
          chant: [
            { english: 'A kite! A kite!', chinese: '一只风筝！一只风筝！' },
            { english: 'Kitty flies a kite.', chinese: '凯蒂放风筝。' },
            { english: 'The kite is in the sky.', chinese: '风筝在天空中。' }
          ]
        },
        {
          letter: 'Ll', word: 'lion', chinese: '狮子',
          chant: [
            { english: 'Little lion! Little lion!', chinese: '小狮子！小狮子！' },
            { english: 'I like you. I like you.', chinese: '我喜欢你。我喜欢你。' }
          ]
        }
      ],
      story: {
        title: 'Leon in the park',
        titleChinese: '莱昂在公园里',
        lines: [
          { english: "It's a park! Where's Leon?", chinese: '这是一个公园！莱昂在哪里？' },
          { english: "I don't know, Grace.", chinese: '我不知道，格蕾丝。' },
          { english: "Hey! It's Leon.", chinese: '嘿！是莱昂。' },
          { english: 'Can you ride a bike, Tim?', chinese: '蒂姆，你会骑自行车吗？' },
          { english: "No, I can't.", chinese: '不，我不会。' },
          { english: 'But I can run. Come on!', chinese: '但是我会跑。来吧！' },
          { english: 'OK.', chinese: '好的。' },
          { english: "I'm tired.", chinese: '我累了。' },
          { english: 'Me too!', chinese: '我也是！' },
          { english: 'Look! We can rollerblade!', chinese: '看！我们可以滑轮滑！' },
          { english: 'Hello! Is that Leon?', chinese: '你好！那是莱昂吗？' },
          { english: "Leon? No, it isn't.", chinese: '莱昂？不，不是。' },
          { english: 'This is my teddy.', chinese: '这是我的泰迪熊。' },
          { english: 'Look! Blue Clue!', chinese: '看！蓝色线索！' },
          { english: 'Play football!', chinese: '踢足球！' },
          { english: 'I can play football!', chinese: '我会踢足球！' },
          { english: 'Me too!', chinese: '我也是！' },
          { english: 'GOAL!', chinese: '进球了！' },
          { english: "Look! There's Leon!", chinese: '看！莱昂在那里！' },
          { english: 'Aww!', chinese: '哎呀！' }
        ]
      },
      extendTitle: 'Our weekends',
      extendTitleChinese: '我们的周末',
      extend: [
        { english: 'I go to the park with my family.', chinese: '我和家人一起去公园。' },
        { english: 'I play in the playground with my sister.', chinese: '我和姐姐（妹妹）一起在游乐场玩。' },
        { english: 'I fly a kite with my father.', chinese: '我和爸爸一起放风筝。' },
        { english: 'I row a boat with my parents.', chinese: '我和父母一起划船。' },
        { english: 'I have a picnic with my family in the park.', chinese: '我和家人在公园里野餐。' }
      ]
    },
    {
      id: 'unit-04',
      title: 'Which season do you like?',
      subtitle: '你喜欢哪个季节？',
      pageRange: '第26-33页',
      source: {
        scanPages: 'page_0027-page_0034',
        audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0ODA4'
      },
      words: [
        { english: 'spring', chinese: '春天', image: '' },
        { english: 'warm', chinese: '暖和的', image: '' },
        { english: 'summer', chinese: '夏天', image: '' },
        { english: 'hot', chinese: '炎热的', image: '' },
        { english: 'autumn', chinese: '秋天', image: '' },
        { english: 'cool', chinese: '凉爽的', image: '' },
        { english: 'winter', chinese: '冬天', image: '' },
        { english: 'cold', chinese: '寒冷的', image: '' }
      ],
      sentences: [
        { english: "It's spring. It's warm.", chinese: '春天到了。天气很暖和。' },
        { english: "It's summer. It's hot.", chinese: '夏天到了。天气很热。' },
        { english: "It's autumn. It's cool.", chinese: '秋天到了。天气很凉爽。' },
        { english: "It's winter. It's cold.", chinese: '冬天到了。天气很冷。' },
        { english: 'What season is it?', chinese: '现在是什么季节？' },
        { english: 'Is it spring?', chinese: '是春天吗？' },
        { english: 'Yes, it is.', chinese: '是的。' },
        { english: 'Which is your favourite season?', chinese: '你最喜欢哪个季节？' }
      ],
      readyChant: {
        title: 'Four seasons',
        titleChinese: '四季歌谣',
        lines: [
          { english: 'Spring is warm. We see beautiful flowers.', chinese: '春天很暖和。我们看见美丽的花朵。' },
          { english: 'Summer is hot. We swim in the pool.', chinese: '夏天很炎热。我们在泳池里游泳。' },
          { english: 'Autumn is cool. We pick up leaves.', chinese: '秋天很凉爽。我们捡落叶。' },
          { english: 'Winter is cold. We play in the snow.', chinese: '冬天很寒冷。我们在雪地里玩。' }
        ]
      },
      communication: {
        title: 'Draw and guess',
        titleChinese: '画一画，猜一猜',
        lines: [
          { english: 'What season is it?', chinese: '现在是什么季节？' },
          { english: 'Is it spring?', chinese: '是春天吗？' },
          { english: 'Yes, it is.', chinese: '是的。' }
        ],
        question: { english: 'Which is your favourite season? Why?', chinese: '你最喜欢哪个季节？为什么？' }
      },
      letters: [
        {
          letter: 'Mm', word: 'milk', chinese: '牛奶',
          chant: [
            { english: 'Good morning.', chinese: '早上好。' },
            { english: 'Good morning.', chinese: '早上好。' },
            { english: 'Milk for you.', chinese: '牛奶给你。' }
          ]
        },
        {
          letter: 'Nn', word: 'noodles', chinese: '面条',
          chant: [
            { english: 'Taste the noodles.', chinese: '尝尝面条。' },
            { english: 'Taste the noodles.', chinese: '尝尝面条。' },
            { english: 'Nice! Nice! Nice!', chinese: '真好吃！真好吃！真好吃！' }
          ]
        },
        {
          letter: 'Oo', word: 'frog', chinese: '青蛙',
          speechText: 'O. It is a frog. A big big frog. Look! The frog can hop.',
          chant: [
            { english: 'It is a frog.', chinese: '这是一只青蛙。' },
            { english: 'A big big frog.', chinese: '一只大大的青蛙。' },
            { english: 'Look! The frog can hop.', chinese: '看！青蛙会跳。' }
          ]
        },
        {
          letter: 'Pp', word: 'pig', chinese: '猪',
          chant: [
            { english: 'A pig on the farm.', chinese: '农场里有一头猪。' },
            { english: 'A panda in the zoo.', chinese: '动物园里有一只熊猫。' },
            { english: 'The pig is fat.', chinese: '这头猪胖胖的。' },
            { english: 'The panda is fat too.', chinese: '这只熊猫也胖胖的。' }
          ]
        }
      ],
      story: {
        title: 'Leon in the game',
        titleChinese: '游戏中的莱昂',
        lines: [
          { english: "Sophie, let's try this.", chinese: '索菲，我们来试试这个。' },
          { english: "OK. But where's Leon, Oliver?", chinese: '好呀。但是奥利弗，莱昂在哪里？' },
          { english: 'What season is it?', chinese: '现在是什么季节？' },
          { english: "It's spring. It's warm.", chinese: '是春天。天气很暖和。' },
          { english: 'I like spring. Look! Beautiful flowers! But where is Leon?', chinese: '我喜欢春天。看！美丽的花朵！但是莱昂在哪里？' },
          { english: "Look! It's a butterfly.", chinese: '看！是一只蝴蝶。' },
          { english: 'And ... hey, this is MY NOSE!', chinese: '还有……嘿，这是我的鼻子！' },
          { english: 'Look! Blue Clue!', chinese: '看！蓝色线索！' },
          { english: 'Winter!', chinese: '冬天！' },
          { english: 'What season is it now?', chinese: '现在是什么季节？' },
          { english: "It's summer. It's hot.", chinese: '是夏天。天气很热。' },
          { english: "It's autumn.", chinese: '是秋天。' },
          { english: "It's cool.", chinese: '天气很凉爽。' },
          { english: "It's winter. It's cold. I don't like winter.", chinese: '是冬天。天气很冷。我不喜欢冬天。' },
          { english: "I like winter. It's fun!", chinese: '我喜欢冬天。真好玩！' },
          { english: 'Look! A snowman.', chinese: '看！一个雪人。' },
          { english: 'And Leon! He looks so cold.', chinese: '还有莱昂！他看起来好冷。' },
          { english: 'Aww!', chinese: '哎呀！' },
          { english: "That's fun! One more time!", chinese: '真好玩！再来一次！' }
        ]
      },
      extendTitle: 'Do you like summer?',
      extendTitleChinese: '你喜欢夏天吗？',
      extend: [
        { english: 'Summer is here. It is hot.', chinese: '夏天到了。天气很热。' },
        { english: 'Do you like it?', chinese: '你喜欢夏天吗？' },
        { english: 'I feel hot all day.', chinese: '我一整天都觉得很热。' },
        { english: 'But I can go out and play!', chinese: '但是我可以出去玩！' }
      ]
    },
    {
      id: 'unit-05',
      title: 'What do you know about fruit?',
      subtitle: '你对水果了解多少？',
      pageRange: '第34-41页',
      source: {
        scanPages: 'page_0035-page_0042',
        audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0ODE3'
      },
      words: [
        { english: 'lemon', chinese: '柠檬', image: '' },
        { english: 'banana', chinese: '香蕉', image: '' },
        { english: 'apple', chinese: '苹果', image: '' },
        { english: 'watermelon', chinese: '西瓜', image: '' },
        { english: 'pear', chinese: '梨', image: '' },
        { english: 'pineapple', chinese: '菠萝', image: '' },
        { english: 'peach', chinese: '桃子', image: '' },
        { english: 'orange', chinese: '橙子；柑橘', image: '' }
      ],
      sentences: [
        { english: "I have a lemon. It's yellow.", chinese: '我有一个柠檬。它是黄色的。' },
        { english: "I have a banana. It's yellow.", chinese: '我有一根香蕉。它是黄色的。' },
        { english: "I have an apple. It's red.", chinese: '我有一个苹果。它是红色的。' },
        { english: "I have a watermelon. It's green.", chinese: '我有一个西瓜。它是绿色的。' },
        { english: "I have a pear. It's yellow.", chinese: '我有一个梨。它是黄色的。' },
        { english: "I have a pineapple. It's yellow.", chinese: '我有一个菠萝。它是黄色的。' },
        { english: "I have a peach. It's pink.", chinese: '我有一个桃子。它是粉色的。' },
        { english: "I have an orange. It's orange.", chinese: '我有一个橙子。它是橙色的。' },
        { english: 'What are these?', chinese: '这些是什么？' },
        { english: "They're pears.", chinese: '它们是梨。' },
        { english: 'What are those?', chinese: '那些是什么？' },
        { english: "They're lemons.", chinese: '它们是柠檬。' },
        { english: "What's your favourite fruit?", chinese: '你最喜欢什么水果？' }
      ],
      readyChant: {
        title: 'Fruit is good for us',
        titleChinese: '水果对我们有益',
        lines: [
          { english: 'I like apples. I like pears.', chinese: '我喜欢苹果。我喜欢梨。' },
          { english: 'I like sweet fruit. How about you?', chinese: '我喜欢甜甜的水果。你呢？' },
          { english: 'I like peaches. I like oranges.', chinese: '我喜欢桃子。我喜欢橙子。' },
          { english: 'I like juicy fruit. How about you?', chinese: '我喜欢多汁的水果。你呢？' },
          { english: 'Apples and pears.', chinese: '苹果和梨。' },
          { english: 'Peaches and lemons.', chinese: '桃子和柠檬。' },
          { english: 'Fruit is good for us.', chinese: '水果对我们有益。' }
        ]
      },
      communication: {
        title: 'Play a game',
        titleChinese: '玩游戏',
        lines: [
          { english: "They're red. They're sweet. They're on the tree. What are they?", chinese: '它们是红色的，甜甜的，长在树上。它们是什么？' },
          { english: "They're apples.", chinese: '它们是苹果。' }
        ],
        question: { english: 'How many kinds of fruit do you know?', chinese: '你知道多少种水果？' }
      },
      letters: [
        {
          letter: 'Qq', word: 'quiet', chinese: '安静的',
          chant: [
            { english: 'Quack, quack, quack.', chinese: '嘎，嘎，嘎。' },
            { english: 'Please be quiet, little, little duck.', chinese: '请安静，小小鸭。' }
          ]
        },
        {
          letter: 'Rr', word: 'rabbit', chinese: '兔子',
          chant: [
            { english: 'Rain, rain, go away.', chinese: '雨呀，雨呀，快走开。' },
            { english: 'Little rabbit wants to play!', chinese: '小兔子想出去玩！' }
          ]
        },
        {
          letter: 'Ss', word: 'song', chinese: '歌曲',
          chant: [
            { english: 'Sing, sing, sing a song.', chinese: '唱呀，唱呀，唱首歌。' },
            { english: 'Sophie can sing a soft song.', chinese: '索菲会唱一首轻柔的歌。' }
          ]
        },
        {
          letter: 'Tt', word: 'taste', chinese: '品尝',
          chant: [
            { english: 'Taste, taste, taste the soup.', chinese: '尝一尝，尝一尝，尝尝汤。' },
            { english: 'Taste the soup on the table.', chinese: '尝尝桌上的汤。' }
          ]
        }
      ],
      story: {
        title: 'Leon on the farm',
        titleChinese: '莱昂在农场',
        lines: [
          { english: 'Hello, John!', chinese: '你好，约翰！' },
          { english: 'Hi, Uncle Dan!', chinese: '你好，丹叔叔！' },
          { english: "I can't find Leon.", chinese: '我找不到莱昂。' },
          { english: 'What are those?', chinese: '那些是什么？' },
          { english: "They're lemons.", chinese: '它们是柠檬。' },
          { english: 'Do you like lemons?', chinese: '你喜欢柠檬吗？' },
          { english: "No, I don't. They're sour.", chinese: '不，我不喜欢。它们很酸。' },
          { english: "Let's play a game.", chinese: '我们来玩个游戏吧。' },
          { english: "OK. But where's Leon?", chinese: '好呀。但是莱昂在哪里？' },
          { english: 'Look! Blue Clue!', chinese: '看！蓝色线索！' },
          { english: 'Watermelon!', chinese: '西瓜！' },
          { english: 'Close your eyes. What are these?', chinese: '闭上眼睛。这些是什么？' },
          { english: "I think they're pears.", chinese: '我想它们是梨。' },
          { english: 'Do you like pears?', chinese: '你喜欢梨吗？' },
          { english: "Yes, I do. They're sweet and juicy.", chinese: '是的，我喜欢。它们又甜又多汁。' },
          { english: "What are these? They're so HEAVY!", chinese: '这些是什么？它们好重！' },
          { english: 'Look out!', chinese: '小心！' },
          { english: "It's Leon.", chinese: '是莱昂。' },
          { english: 'Aww!', chinese: '哎呀！' }
        ]
      },
      extendTitle: 'Strawberries, apples and bananas',
      extendTitleChinese: '草莓、苹果和香蕉',
      extend: [
        { english: 'Strawberries grow on low plants.', chinese: '草莓长在低矮的植株上。' },
        { english: 'They grow in warm weather.', chinese: '它们在温暖的天气里生长。' },
        { english: 'Apples grow on trees.', chinese: '苹果长在树上。' },
        { english: 'People pick apples in autumn.', chinese: '人们在秋天采摘苹果。' },
        { english: 'Bananas grow on tall plants.', chinese: '香蕉长在高大的植株上。' },
        { english: 'They grow in hot places.', chinese: '它们生长在炎热的地方。' }
      ]
    },
    {
      id: 'unit-06',
      title: 'How do animals grow?',
      subtitle: '动物是怎样长大的？',
      pageRange: '第42-49页',
      source: {
        scanPages: 'page_0043-page_0050',
        audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0ODI4'
      },
      words: [
        { english: 'tadpole', chinese: '蝌蚪', image: '' },
        { english: 'frog', chinese: '青蛙', image: '' },
        { english: 'butterfly', chinese: '蝴蝶', image: '' },
        { english: 'goldfish', chinese: '金鱼', image: '' },
        { english: 'duck', chinese: '鸭子', image: '' },
        { english: 'tortoise', chinese: '龟', image: '' }
      ],
      sentences: [
        { english: "We're tadpoles.", chinese: '我们是蝌蚪。' },
        { english: "I'm a frog.", chinese: '我是一只青蛙。' },
        { english: "I'm a butterfly.", chinese: '我是一只蝴蝶。' },
        { english: "I'm a goldfish.", chinese: '我是一条金鱼。' },
        { english: "I'm a duck.", chinese: '我是一只鸭子。' },
        { english: "I'm a tortoise.", chinese: '我是一只龟。' },
        { english: "These are the butterfly's eggs. They're small.", chinese: '这些是蝴蝶的卵。它们很小。' },
        { english: "These are the duck's eggs. They're big and white.", chinese: '这些是鸭蛋。它们又大又白。' },
        { english: "These are the frog's eggs. They're small and black.", chinese: '这些是青蛙的卵。它们又小又黑。' },
        { english: 'How does a frog grow?', chinese: '青蛙是怎样长大的？' },
        { english: 'How does a butterfly grow?', chinese: '蝴蝶是怎样长大的？' }
      ],
      readyChant: {
        title: 'By the pond',
        titleChinese: '在池塘边',
        lines: [
          { english: 'Hello, Butterfly by the pond. Hello, Butterfly. How are you?', chinese: '你好，池塘边的蝴蝶。你好，蝴蝶。你好吗？' },
          { english: 'Hello, Tortoise by the pond. Hello, Tortoise. How are you?', chinese: '你好，池塘边的龟。你好，龟。你好吗？' },
          { english: 'Hello, Duck on the pond. Hello, Duck. How are you?', chinese: '你好，池塘上的鸭子。你好，鸭子。你好吗？' },
          { english: 'Hello, Goldfish in the pond. Hello, Goldfish. How are you?', chinese: '你好，池塘里的金鱼。你好，金鱼。你好吗？' },
          { english: 'Hello, Frog in the pond. Hello, Frog. How are you?', chinese: '你好，池塘里的青蛙。你好，青蛙。你好吗？' },
          { english: "I'm Little Tadpole in the pond. I'm Little Tadpole. Happy every day.", chinese: '我是池塘里的小蝌蚪。我是小蝌蚪，每天都很快乐。' }
        ]
      },
      communication: {
        title: 'Think and order. Then role-play',
        titleChinese: '想一想，排顺序，然后角色扮演',
        lines: [],
        question: { english: 'How does a frog grow?', chinese: '青蛙是怎样长大的？' }
      },
      letters: [
        {
          letter: 'Uu', word: 'umbrella', chinese: '雨伞',
          chant: [
            { english: "Uncle Li, Uncle Li, it's rainy.", chinese: '李叔叔，李叔叔，下雨了。' },
            { english: 'An umbrella for you.', chinese: '一把雨伞给你。' },
            { english: 'An umbrella for me.', chinese: '一把雨伞给我。' }
          ]
        },
        {
          letter: 'Vv', word: 'van', chinese: '厢式货车',
          chant: [
            { english: 'One, two, three, four, five!', chinese: '一、二、三、四、五！' },
            { english: 'One, two, three, four, five!', chinese: '一、二、三、四、五！' },
            { english: 'I see five doves on the van.', chinese: '我看见厢式货车上有五只鸽子。' }
          ]
        },
        {
          letter: 'Ww', word: 'winter', chinese: '冬天',
          chant: [
            { english: 'It is winter.', chinese: '冬天到了。' },
            { english: 'It is snowy. It is windy.', chinese: '下雪了。风很大。' },
            { english: 'It is snowy and windy.', chinese: '天气又下雪又刮风。' }
          ]
        },
        {
          letter: 'Xx', word: 'fox', chinese: '狐狸',
          speechText: 'X. Here is a toy fox. Here is a box. Put the toy fox in the box.',
          chant: [
            { english: 'Here is a toy fox.', chinese: '这里有一只玩具狐狸。' },
            { english: 'Here is a box.', chinese: '这里有一个盒子。' },
            { english: 'Put the toy fox in the box.', chinese: '把玩具狐狸放进盒子里。' }
          ]
        },
        {
          letter: 'Yy', word: 'yo-yo', chinese: '悠悠球',
          chant: [
            { english: 'I have a yo-yo.', chinese: '我有一个悠悠球。' },
            { english: 'It is yellow.', chinese: '它是黄色的。' },
            { english: 'Can you play yo-yo?', chinese: '你会玩悠悠球吗？' }
          ]
        },
        {
          letter: 'Zz', word: 'zebra', chinese: '斑马',
          chant: [
            { english: 'Zebras, zebras, where are you?', chinese: '斑马，斑马，你们在哪里？' },
            { english: 'Little Zac is in the zoo.', chinese: '小扎克在动物园里。' },
            { english: 'Little Zac wants to see you.', chinese: '小扎克想见你们。' }
          ]
        }
      ],
      story: {
        title: 'Little Tadpole',
        titleChinese: '小蝌蚪',
        lines: [
          { english: 'Now it is spring. The eggs are tadpoles.', chinese: '现在是春天。卵变成了蝌蚪。' },
          { english: "I'm an egg. I'm small and black.", chinese: '我是一颗卵。我又小又黑。' },
          { english: "Little Tadpole can't find his mummy. A butterfly is coming.", chinese: '小蝌蚪找不到妈妈了。一只蝴蝶游了过来。' },
          { english: "Mummy! Mummy! I'm Little Tadpole.", chinese: '妈妈！妈妈！我是小蝌蚪。' },
          { english: "I'm not your mummy. Your mummy has big eyes.", chinese: '我不是你妈妈。你妈妈有一双大眼睛。' },
          { english: 'A goldfish is coming.', chinese: '一条金鱼游了过来。' },
          { english: 'Mummy! Mummy!', chinese: '妈妈！妈妈！' },
          { english: "I'm not your mummy. Your mummy has a big mouth.", chinese: '我不是你妈妈。你妈妈有一张大嘴巴。' },
          { english: "Oh, I'm sorry!", chinese: '哦，对不起！' },
          { english: 'Now Little Tadpole has two legs. A duck is coming.', chinese: '现在小蝌蚪长出了两条腿。一只鸭子游了过来。' },
          { english: 'Mummy! Mummy!', chinese: '妈妈！妈妈！' },
          { english: "I'm not your mummy. Your mummy has a green body.", chinese: '我不是你妈妈。你妈妈有绿色的身体。' },
          { english: "Oh, I'm sorry!", chinese: '哦，对不起！' },
          { english: 'Now Little Tadpole has four legs. A tortoise is coming.', chinese: '现在小蝌蚪长出了四条腿。一只龟游了过来。' },
          { english: 'Oh! Mummy! Mummy!', chinese: '哦！妈妈！妈妈！' },
          { english: "I'm not your mummy. Your mummy can jump, but I can't.", chinese: '我不是你妈妈。你妈妈会跳，但我不会。' },
          { english: "Oh, I'm sorry!", chinese: '哦，对不起！' },
          { english: 'Now Little Tadpole has no tail. A frog is coming.', chinese: '现在小蝌蚪没有尾巴了。一只青蛙游了过来。' },
          { english: 'Big eyes, a big mouth and a green body! And she can jump. Mummy! Mummy!', chinese: '大眼睛、大嘴巴和绿色的身体！而且她会跳。妈妈！妈妈！' },
          { english: 'Oh, my baby! I miss you!', chinese: '哦，我的宝贝！我好想你！' },
          { english: "Let's catch flies.", chinese: '我们去捉苍蝇吧。' },
          { english: 'OK!', chinese: '好呀！' }
        ]
      },
      extendTitle: 'How do I grow?',
      extendTitleChinese: '我是怎样长大的？',
      extend: [
        { english: "Look! I'm an egg. I'm small.", chinese: '看！我是一颗卵。我很小。' },
        { english: "Now I'm a caterpillar. I'm green. I have many legs.", chinese: '现在我是一条毛毛虫。我是绿色的，有很多条腿。' },
        { english: "Now I'm in a cocoon. It's warm inside.", chinese: '现在我在茧里。里面很暖和。' },
        { english: "Now I'm a butterfly. My wings are big and beautiful. I can fly.", chinese: '现在我是一只蝴蝶。我的翅膀又大又漂亮。我会飞。' }
      ]
    }
  ]
}
