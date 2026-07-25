/**
 * 沪教牛津版（深圳用）2024新版 一年级上册 教材数据
 * 共 6 个 Unit
 * 每个 Unit 包含：words(核心单词) / sentences(重点句型) / letters(字母认读) / story(故事对话) / extend(扩展阅读)
 */

module.exports = {
  book: '一年级上册',
  publisher: '上海教育出版社（沪教牛津版·深圳用·2024）',
  units: [
    {
      id: 'unit-01',
      title: 'What is your family like?',
      subtitle: '你的家庭是什么样的？',
      words: [
        { english: 'grandma', chinese: '奶奶/外婆', image: '' },
        { english: 'grandpa', chinese: '爷爷/外公', image: '' },
        { english: 'dad', chinese: '爸爸', image: '' },
        { english: 'mum', chinese: '妈妈', image: '' },
        { english: 'brother', chinese: '哥哥/弟弟', image: '' },
        { english: 'sister', chinese: '姐姐/妹妹', image: '' }
      ],
      sentences: [
        { english: 'This is my mum.', chinese: '这是我妈妈。' },
        { english: 'This is my dad.', chinese: '这是我爸爸。' },
        { english: 'This is my brother.', chinese: '这是我哥哥。' },
        { english: 'This is my sister.', chinese: '这是我姐姐。' },
        { english: 'Who is she?', chinese: '她是谁？' },
        { english: 'She is my grandma.', chinese: '她是我奶奶。' },
        { english: 'Who is he?', chinese: '他是谁？' },
        { english: 'He is my grandpa.', chinese: '他是我爷爷。' },
        { english: 'We are a family.', chinese: '我们是一家人。' }
      ],
      letters: [
        { letter: 'Aa', word: 'ant', chinese: '蚂蚁' },
        { letter: 'Bb', word: 'bear', chinese: '熊' },
        { letter: 'Cc', word: 'cow', chinese: '奶牛' },
        { letter: 'Dd', word: 'dog', chinese: '狗' }
      ],
      story: {
        title: "Grandma's Magic Pot",
        titleChinese: '奶奶的魔法锅',
        lines: [
          { english: 'This is my magic pot. Cook, pot!', chinese: '这是我的魔法锅。煮吧，锅！' },
          { english: 'Wow!', chinese: '哇！' },
          { english: 'Stop, stop, stop, pot!', chinese: '停停停，锅！' },
          { english: 'I like noodles.', chinese: '我喜欢面条。' },
          { english: "I'm hungry. Cook, pot!", chinese: '我饿了。煮吧，锅！' },
          { english: 'Stop, pot! Hey! Stop, pot!', chinese: '停，锅！嘿！停，锅！' },
          { english: "Let's help. Stop, pot!", chinese: '我们来帮忙。停，锅！' },
          { english: 'Stop, stop, stop, pot!', chinese: '停停停，锅！' },
          { english: 'Thank you!', chinese: '谢谢你！' }
        ]
      },
      extend: [
        { english: "I'm Keke. My family is small.", chinese: '我是可可。我的家庭很小。' },
        { english: "I'm Linlin. This is my family. It's big.", chinese: '我是林林。这是我的家庭。它很大。' },
        { english: "I'm Anran. This is my family.", chinese: '我是安然。这是我的家庭。' }
      ]
    },
    {
      id: 'unit-02',
      title: 'How are you today?',
      subtitle: '你今天感觉怎么样？',
      words: [
        { english: 'cold', chinese: '冷的', image: '' },
        { english: 'hot', chinese: '热的', image: '' },
        { english: 'thirsty', chinese: '口渴的', image: '' },
        { english: 'hungry', chinese: '饿的', image: '' },
        { english: 'happy', chinese: '开心的', image: '' },
        { english: 'tired', chinese: '累的', image: '' }
      ],
      sentences: [
        { english: 'How are you today?', chinese: '你今天感觉怎么样？' },
        { english: "I'm hungry.", chinese: '我饿了。' },
        { english: "I'm thirsty.", chinese: '我口渴了。' },
        { english: "I'm hot.", chinese: '我很热。' },
        { english: "I'm cold.", chinese: '我很冷。' },
        { english: "I'm happy.", chinese: '我很开心。' },
        { english: "I'm tired.", chinese: '我累了。' },
        { english: 'An apple for you.', chinese: '给你一个苹果。' },
        { english: 'Some orange juice for you.', chinese: '给你一些橙汁。' },
        { english: 'A fan for you.', chinese: '给你一把扇子。' },
        { english: 'Thank you.', chinese: '谢谢你。' },
        { english: "You're welcome.", chinese: '不客气。' }
      ],
      letters: [
        { letter: 'Ee', word: 'elephant', chinese: '大象' },
        { letter: 'Ff', word: 'frog', chinese: '青蛙' },
        { letter: 'Gg', word: 'giraffe', chinese: '长颈鹿' },
        { letter: 'Hh', word: 'hen', chinese: '母鸡' }
      ],
      story: {
        title: 'On the Farm',
        titleChinese: '在农场',
        lines: [
          { english: 'Hi, kids! Welcome to my farm. How are you?', chinese: '嗨，孩子们！欢迎来到我的农场。你们好吗？' },
          { english: "I'm hungry.", chinese: '我饿了。' },
          { english: 'An apple for you, Julie.', chinese: '给你一个苹果，Julie。' },
          { english: "I'm thirsty.", chinese: '我口渴了。' },
          { english: 'Some orange juice for you, Ann.', chinese: '给你一些橙汁，Ann。' },
          { english: "I'm hot.", chinese: '我很热。' },
          { english: 'A fan for you, John.', chinese: '给你一把扇子，John。' },
          { english: 'Oh! My trousers!', chinese: '哦！我的裤子！' },
          { english: 'Oh no!', chinese: '哦不！' },
          { english: 'Look out, Robot!', chinese: '小心，Robot！' },
          { english: 'Thank you, Mark.', chinese: '谢谢你，Mark。' },
          { english: "You're welcome.", chinese: '不客气。' }
        ]
      },
      extend: [
        { english: 'How are you?', chinese: '你好吗？' },
        { english: "I'm happy.", chinese: '我很开心。' },
        { english: 'How is the tortoise?', chinese: '乌龟怎么样了？' },
        { english: "I'm tired.", chinese: '我累了。' },
        { english: "I'm hot and thirsty.", chinese: '我又热又渴。' }
      ]
    },
    {
      id: 'unit-03',
      title: 'What do you take to school?',
      subtitle: '你带什么去学校？',
      words: [
        { english: 'pencil case', chinese: '铅笔盒', image: '' },
        { english: 'pencil', chinese: '铅笔', image: '' },
        { english: 'eraser', chinese: '橡皮', image: '' },
        { english: 'ruler', chinese: '直尺', image: '' },
        { english: 'pen', chinese: '钢笔', image: '' },
        { english: 'crayon', chinese: '蜡笔', image: '' }
      ],
      sentences: [
        { english: 'What do you take to school?', chinese: '你带什么去学校？' },
        { english: 'How many pencils?', chinese: '多少支铅笔？' },
        { english: 'One, two, three, four.', chinese: '一、二、三、四。' },
        { english: 'Four pencils.', chinese: '四支铅笔。' },
        { english: 'Is that my pencil case?', chinese: '那是我的铅笔盒吗？' },
        { english: 'This is my pencil.', chinese: '这是我的铅笔。' },
        { english: 'This is my pen.', chinese: '这是我的钢笔。' },
        { english: 'This is my crayon.', chinese: '这是我的蜡笔。' },
        { english: 'Where is my pencil case?', chinese: '我的铅笔盒在哪里？' },
        { english: "It's my pencil.", chinese: '这是我的铅笔。' },
        { english: 'Sorry!', chinese: '对不起！' }
      ],
      letters: [
        { letter: 'Ii', word: 'insect', chinese: '昆虫' },
        { letter: 'Jj', word: 'jellyfish', chinese: '水母' },
        { letter: 'Kk', word: 'kangaroo', chinese: '袋鼠' },
        { letter: 'Ll', word: 'lion', chinese: '狮子' }
      ],
      story: {
        title: "Mary's Pencil Case",
        titleChinese: 'Mary的铅笔盒',
        lines: [
          { english: 'Good morning, everyone. Let\'s draw.', chinese: '大家早上好。我们来画画吧。' },
          { english: 'Where\'s my pencil case?', chinese: '我的铅笔盒在哪里？' },
          { english: 'Is that my pencil case?', chinese: '那是我的铅笔盒吗？' },
          { english: 'How many pencils?', chinese: '多少支铅笔？' },
          { english: 'Four.', chinese: '四支。' },
          { english: 'Oh. I have three pencils.', chinese: '哦。我只有三支铅笔。' },
          { english: 'Is that my pencil?', chinese: '那是我的铅笔吗？' },
          { english: "No. It's my pencil.", chinese: '不。这是我的铅笔。' },
          { english: 'Sorry!', chinese: '对不起！' },
          { english: "It's Mary's dad.", chinese: '是Mary的爸爸。' },
          { english: 'Mary, this is your pencil case.', chinese: 'Mary，这是你的铅笔盒。' },
          { english: 'Sorry, everybody!', chinese: '对不起，大家！' }
        ]
      },
      extend: [
        { english: 'This is my pencil.', chinese: '这是我的铅笔。' },
        { english: 'This is my pen.', chinese: '这是我的钢笔。' },
        { english: 'This is my crayon.', chinese: '这是我的蜡笔。' },
        { english: 'This is my coloured pencil.', chinese: '这是我的彩色铅笔。' },
        { english: 'What do you have in your pencil case?', chinese: '你的铅笔盒里有什么？' }
      ]
    },
    {
      id: 'unit-04',
      title: 'What can you do?',
      subtitle: '你会做什么？',
      words: [
        { english: 'read', chinese: '阅读', image: '' },
        { english: 'draw', chinese: '画画', image: '' },
        { english: 'sing', chinese: '唱歌', image: '' },
        { english: 'write', chinese: '写字', image: '' },
        { english: 'dance', chinese: '跳舞', image: '' },
        { english: 'swim', chinese: '游泳', image: '' }
      ],
      sentences: [
        { english: 'What can you do?', chinese: '你会做什么？' },
        { english: 'I can sing.', chinese: '我会唱歌。' },
        { english: 'I can dance.', chinese: '我会跳舞。' },
        { english: 'I can draw.', chinese: '我会画画。' },
        { english: 'I can read.', chinese: '我会阅读。' },
        { english: 'I can write.', chinese: '我会写字。' },
        { english: 'I can swim.', chinese: '我会游泳。' },
        { english: 'Can you fly?', chinese: '你会飞吗？' },
        { english: 'It can fly.', chinese: '它会飞。' },
        { english: "It can't swim.", chinese: '它不会游泳。' }
      ],
      letters: [
        { letter: 'Mm', word: 'monkey', chinese: '猴子' },
        { letter: 'Nn', word: 'nightingale', chinese: '夜莺' },
        { letter: 'Oo', word: 'ox', chinese: '公牛' },
        { letter: 'Pp', word: 'pig', chinese: '猪' }
      ],
      story: {
        title: 'The Talent Show',
        titleChinese: '才艺表演',
        lines: [
          { english: 'Dongdong has a dream.', chinese: '冬冬有一个梦想。' },
          { english: 'Can you help me, Grandpa?', chinese: '你能帮我吗，爷爷？' },
          { english: 'Sure.', chinese: '当然。' },
          { english: 'I can sing.', chinese: '我会唱歌。' },
          { english: 'I can play the violin.', chinese: '我会拉小提琴。' },
          { english: 'Great!', chinese: '太棒了！' },
          { english: 'I can dance.', chinese: '我会跳舞。' },
          { english: 'I can ride a bike.', chinese: '我会骑自行车。' },
          { english: 'My sister can dance. My grandma can play the violin. My grandpa can sing. I can ride a bike!', chinese: '我姐姐会跳舞。我奶奶会拉小提琴。我爷爷会唱歌。我会骑自行车！' },
          { english: 'We win!', chinese: '我们赢了！' }
        ]
      },
      extend: [
        { english: "It can fly. It can't swim. It's a bird!", chinese: '它会飞。它不会游泳。它是一只鸟！' },
        { english: "It can swim. It can't run. It's a fish!", chinese: '它会游泳。它不会跑。它是一条鱼！' },
        { english: 'It can jump. It can swim. It\'s a frog!', chinese: '它会跳。它会游泳。它是一只青蛙！' },
        { english: 'Can you fly? Can you swim?', chinese: '你会飞吗？你会游泳吗？' }
      ]
    },
    {
      id: 'unit-05',
      title: 'What is your favourite animal?',
      subtitle: '你最喜欢什么动物？',
      words: [
        { english: 'dog', chinese: '狗', image: '' },
        { english: 'cat', chinese: '猫', image: '' },
        { english: 'fish', chinese: '鱼', image: '' },
        { english: 'bird', chinese: '鸟', image: '' },
        { english: 'hamster', chinese: '仓鼠', image: '' },
        { english: 'tortoise', chinese: '乌龟', image: '' }
      ],
      sentences: [
        { english: 'What is your favourite animal?', chinese: '你最喜欢什么动物？' },
        { english: 'What is it?', chinese: '它是什么？' },
        { english: "It's a cat.", chinese: '它是一只猫。' },
        { english: "It's a dog.", chinese: '它是一只狗。' },
        { english: "It's lovely!", chinese: '它真可爱！' },
        { english: "It's a baby bird.", chinese: '它是一只小鸟宝宝。' },
        { english: "Let's help the bird.", chinese: '我们帮帮这只鸟吧。' },
        { english: 'Be careful!', chinese: '小心！' },
        { english: 'The baby bird is happy now.', chinese: '小鸟宝宝现在很开心。' }
      ],
      letters: [
        { letter: 'Qq', word: 'queen bee', chinese: '蜂王' },
        { letter: 'Rr', word: 'rabbit', chinese: '兔子' },
        { letter: 'Ss', word: 'snake', chinese: '蛇' },
        { letter: 'Tt', word: 'tiger', chinese: '老虎' }
      ],
      story: {
        title: 'In the Garden',
        titleChinese: '在花园里',
        lines: [
          { english: 'Tweet! Tweet!', chinese: '叽叽！叽叽！' },
          { english: "What's that, Grandpa?", chinese: '那是什么，爷爷？' },
          { english: "Oh, it's a baby bird.", chinese: '哦，它是一只小鸟宝宝。' },
          { english: "Grandpa, let's help the bird.", chinese: '爷爷，我们帮帮这只鸟吧。' },
          { english: 'Oh no! Coco!', chinese: '哦不！Coco！' },
          { english: 'Look! A nest!', chinese: '看！一个鸟窝！' },
          { english: "Let's put the bird in the nest.", chinese: '我们把小鸟放进鸟窝里吧。' },
          { english: 'Be careful, Grandpa!', chinese: '小心，爷爷！' },
          { english: 'The baby bird is happy now.', chinese: '小鸟宝宝现在很开心。' }
        ]
      },
      extend: [
        { english: "Let's go fishing.", chinese: '我们去钓鱼吧。' },
        { english: 'OK, Mum.', chinese: '好的，妈妈。' },
        { english: "What's this, Mum?", chinese: '这是什么，妈妈？' },
        { english: 'Sh!', chinese: '嘘！' },
        { english: "I'm sorry, Mum.", chinese: '对不起，妈妈。' },
        { english: 'Look, Mum! A big fish!', chinese: '看，妈妈！一条大鱼！' },
        { english: 'Well done!', chinese: '做得好！' }
      ]
    },
    {
      id: 'unit-06',
      title: 'What colours can you see?',
      subtitle: '你能看到什么颜色？',
      words: [
        { english: 'red', chinese: '红色', image: '' },
        { english: 'white', chinese: '白色', image: '' },
        { english: 'yellow', chinese: '黄色', image: '' },
        { english: 'green', chinese: '绿色', image: '' },
        { english: 'blue', chinese: '蓝色', image: '' },
        { english: 'black', chinese: '黑色', image: '' }
      ],
      sentences: [
        { english: 'What colours can you see?', chinese: '你能看到什么颜色？' },
        { english: 'Find something green.', chinese: '找一些绿色的东西。' },
        { english: 'A green tree.', chinese: '一棵绿色的树。' },
        { english: 'A green frog.', chinese: '一只绿色的青蛙。' },
        { english: 'Find something white.', chinese: '找一些白色的东西。' },
        { english: 'A white bird.', chinese: '一只白色的鸟。' },
        { english: 'A white duck.', chinese: '一只白色的鸭子。' },
        { english: 'Find something yellow.', chinese: '找一些黄色的东西。' },
        { english: 'Two yellow flowers.', chinese: '两朵黄色的花。' },
        { english: 'What colour is it?', chinese: '它是什么颜色？' },
        { english: "It's blue and yellow.", chinese: '它是蓝色和黄色的。' },
        { english: 'Good job!', chinese: '干得好！' },
        { english: 'Well done!', chinese: '做得好！' }
      ],
      letters: [
        { letter: 'Uu', word: 'duck', chinese: '鸭子' },
        { letter: 'Vv', word: 'dove', chinese: '鸽子' },
        { letter: 'Ww', word: 'swan', chinese: '天鹅' },
        { letter: 'Xx', word: 'fox', chinese: '狐狸' },
        { letter: 'Yy', word: 'yak', chinese: '牦牛' },
        { letter: 'Zz', word: 'zebra', chinese: '斑马' }
      ],
      story: {
        title: 'In the Park',
        titleChinese: '在公园里',
        lines: [
          { english: "Children, let's play a game.", chinese: '孩子们，我们来玩个游戏。' },
          { english: 'Great!', chinese: '太好了！' },
          { english: 'Find something green.', chinese: '找一些绿色的东西。' },
          { english: 'A green tree.', chinese: '一棵绿色的树。' },
          { english: 'A green frog.', chinese: '一只绿色的青蛙。' },
          { english: 'Good job!', chinese: '干得好！' },
          { english: 'Find something white.', chinese: '找一些白色的东西。' },
          { english: 'A white bird.', chinese: '一只白色的鸟。' },
          { english: 'A white duck.', chinese: '一只白色的鸭子。' },
          { english: 'Well done!', chinese: '做得好！' },
          { english: 'Find something yellow.', chinese: '找一些黄色的东西。' },
          { english: 'Two yellow flowers.', chinese: '两朵黄色的花。' },
          { english: 'One for you, and one for me.', chinese: '一朵给你，一朵给我。' },
          { english: 'No! Stop!', chinese: '不！停下！' },
          { english: 'A bee!', chinese: '一只蜜蜂！' },
          { english: 'Oh no!', chinese: '哦不！' },
          { english: 'It hurts!', chinese: '好疼！' },
          { english: "Let's go to the hospital!", chinese: '我们去医院吧！' }
        ]
      },
      extend: [
        { english: 'Look! Chameleons!', chinese: '看！变色龙！' },
        { english: 'The plant is yellow. The chameleon is yellow too.', chinese: '植物是黄色的。变色龙也是黄色的。' },
        { english: 'The ground is grey. The chameleon is grey too.', chinese: '地面是灰色的。变色龙也是灰色的。' },
        { english: 'The tree is red. The chameleon is red too.', chinese: '树是红色的。变色龙也是红色的。' },
        { english: 'The branch is green. The chameleon is green too.', chinese: '树枝是绿色的。变色龙也是绿色的。' },
        { english: 'What colours are the chameleons?', chinese: '变色龙是什么颜色的？' }
      ]
    }
  ]
}
