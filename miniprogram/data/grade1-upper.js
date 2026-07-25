/**
 * 沪教牛津版 一年级上册 教材数据
 * 数据结构说明：
 * - units: 单元数组
 *   - id: 单元ID
 *   - title: 单元标题（英文）
 *   - subtitle: 单元副标题（中文）
 *   - words: 单词数组 [{ english, chinese, image }]
 *   - sentences: 课文句子数组 [{ english, chinese }]
 */

module.exports = {
  book: '一年级上册',
  publisher: '上海教育出版社（沪教牛津版）',
  units: [
    {
      id: 'unit-01',
      title: 'Hello',
      subtitle: '你好',
      words: [
        { english: 'hello', chinese: '你好', image: '' },
        { english: 'hi', chinese: '嗨', image: '' },
        { english: 'goodbye', chinese: '再见', image: '' },
        { english: 'bye', chinese: '拜拜', image: '' },
        { english: 'morning', chinese: '早上', image: '' },
        { english: 'afternoon', chinese: '下午', image: '' }
      ],
      sentences: [
        { english: 'Hello! I am Kitty.', chinese: '你好！我是Kitty。' },
        { english: 'Hi! I am Ben.', chinese: '嗨！我是Ben。' },
        { english: 'Good morning, Miss Fang.', chinese: '早上好，方老师。' },
        { english: 'Good afternoon, boys and girls.', chinese: '下午好，同学们。' },
        { english: 'Goodbye, Kitty!', chinese: '再见，Kitty！' },
        { english: 'Bye, Ben!', chinese: '拜拜，Ben！' }
      ]
    },
    {
      id: 'unit-02',
      title: 'My name',
      subtitle: '我的名字',
      words: [
        { english: 'name', chinese: '名字', image: '' },
        { english: 'boy', chinese: '男孩', image: '' },
        { english: 'girl', chinese: '女孩', image: '' },
        { english: 'teacher', chinese: '老师', image: '' },
        { english: 'friend', chinese: '朋友', image: '' },
        { english: 'nice', chinese: '好的', image: '' }
      ],
      sentences: [
        { english: "What's your name?", chinese: '你叫什么名字？' },
        { english: 'My name is Kitty.', chinese: '我的名字是Kitty。' },
        { english: 'Nice to meet you.', chinese: '很高兴认识你。' },
        { english: 'I am a boy.', chinese: '我是一个男孩。' },
        { english: 'She is my friend.', chinese: '她是我的朋友。' }
      ]
    },
    {
      id: 'unit-03',
      title: 'My family',
      subtitle: '我的家庭',
      words: [
        { english: 'father', chinese: '爸爸', image: '' },
        { english: 'mother', chinese: '妈妈', image: '' },
        { english: 'brother', chinese: '兄弟', image: '' },
        { english: 'sister', chinese: '姐妹', image: '' },
        { english: 'grandpa', chinese: '爷爷/外公', image: '' },
        { english: 'grandma', chinese: '奶奶/外婆', image: '' }
      ],
      sentences: [
        { english: 'This is my father.', chinese: '这是我爸爸。' },
        { english: 'This is my mother.', chinese: '这是我妈妈。' },
        { english: 'I love my family.', chinese: '我爱我的家人。' },
        { english: 'He is my brother.', chinese: '他是我哥哥。' },
        { english: 'She is my sister.', chinese: '她是我姐姐。' }
      ]
    },
    {
      id: 'unit-04',
      title: 'My body',
      subtitle: '我的身体',
      words: [
        { english: 'eye', chinese: '眼睛', image: '' },
        { english: 'ear', chinese: '耳朵', image: '' },
        { english: 'nose', chinese: '鼻子', image: '' },
        { english: 'mouth', chinese: '嘴巴', image: '' },
        { english: 'hand', chinese: '手', image: '' },
        { english: 'foot', chinese: '脚', image: '' }
      ],
      sentences: [
        { english: 'I have two eyes.', chinese: '我有两只眼睛。' },
        { english: 'I have two ears.', chinese: '我有两只耳朵。' },
        { english: 'This is my nose.', chinese: '这是我的鼻子。' },
        { english: 'Clap your hands.', chinese: '拍拍你的手。' },
        { english: 'Stamp your feet.', chinese: '跺跺你的脚。' }
      ]
    },
    {
      id: 'unit-05',
      title: 'Numbers',
      subtitle: '数字',
      words: [
        { english: 'one', chinese: '一', image: '' },
        { english: 'two', chinese: '二', image: '' },
        { english: 'three', chinese: '三', image: '' },
        { english: 'four', chinese: '四', image: '' },
        { english: 'five', chinese: '五', image: '' },
        { english: 'six', chinese: '六', image: '' },
        { english: 'seven', chinese: '七', image: '' },
        { english: 'eight', chinese: '八', image: '' },
        { english: 'nine', chinese: '九', image: '' },
        { english: 'ten', chinese: '十', image: '' }
      ],
      sentences: [
        { english: 'How many?', chinese: '多少个？' },
        { english: 'I can see three birds.', chinese: '我能看到三只鸟。' },
        { english: 'I have five fingers.', chinese: '我有五个手指。' },
        { english: 'Count with me. One, two, three.', chinese: '跟我一起数。一、二、三。' }
      ]
    },
    {
      id: 'unit-06',
      title: 'Colours',
      subtitle: '颜色',
      words: [
        { english: 'red', chinese: '红色', image: '' },
        { english: 'blue', chinese: '蓝色', image: '' },
        { english: 'yellow', chinese: '黄色', image: '' },
        { english: 'green', chinese: '绿色', image: '' },
        { english: 'orange', chinese: '橙色', image: '' },
        { english: 'purple', chinese: '紫色', image: '' }
      ],
      sentences: [
        { english: 'What colour is it?', chinese: '它是什么颜色？' },
        { english: 'It is red.', chinese: '它是红色的。' },
        { english: 'I like blue.', chinese: '我喜欢蓝色。' },
        { english: 'The sky is blue.', chinese: '天空是蓝色的。' },
        { english: 'The flower is yellow.', chinese: '花是黄色的。' }
      ]
    },
    {
      id: 'unit-07',
      title: 'Animals',
      subtitle: '动物',
      words: [
        { english: 'cat', chinese: '猫', image: '' },
        { english: 'dog', chinese: '狗', image: '' },
        { english: 'bird', chinese: '鸟', image: '' },
        { english: 'fish', chinese: '鱼', image: '' },
        { english: 'rabbit', chinese: '兔子', image: '' },
        { english: 'monkey', chinese: '猴子', image: '' }
      ],
      sentences: [
        { english: 'I can see a cat.', chinese: '我能看到一只猫。' },
        { english: 'The dog is big.', chinese: '这只狗很大。' },
        { english: 'The bird can fly.', chinese: '鸟会飞。' },
        { english: 'The fish can swim.', chinese: '鱼会游泳。' },
        { english: 'I like rabbits.', chinese: '我喜欢兔子。' }
      ]
    },
    {
      id: 'unit-08',
      title: 'Fruit',
      subtitle: '水果',
      words: [
        { english: 'apple', chinese: '苹果', image: '' },
        { english: 'banana', chinese: '香蕉', image: '' },
        { english: 'orange', chinese: '橙子', image: '' },
        { english: 'pear', chinese: '梨', image: '' },
        { english: 'peach', chinese: '桃子', image: '' },
        { english: 'grape', chinese: '葡萄', image: '' }
      ],
      sentences: [
        { english: 'I like apples.', chinese: '我喜欢苹果。' },
        { english: 'Do you like bananas?', chinese: '你喜欢香蕉吗？' },
        { english: 'Yes, I do.', chinese: '是的，我喜欢。' },
        { english: 'The orange is sweet.', chinese: '橙子很甜。' },
        { english: 'Have a pear, please.', chinese: '请吃个梨。' }
      ]
    },
    {
      id: 'unit-09',
      title: 'Food',
      subtitle: '食物',
      words: [
        { english: 'rice', chinese: '米饭', image: '' },
        { english: 'egg', chinese: '鸡蛋', image: '' },
        { english: 'milk', chinese: '牛奶', image: '' },
        { english: 'bread', chinese: '面包', image: '' },
        { english: 'cake', chinese: '蛋糕', image: '' },
        { english: 'water', chinese: '水', image: '' }
      ],
      sentences: [
        { english: 'I am hungry.', chinese: '我饿了。' },
        { english: 'Have some rice.', chinese: '吃点米饭。' },
        { english: 'I like milk.', chinese: '我喜欢牛奶。' },
        { english: 'The cake is nice.', chinese: '蛋糕很好吃。' },
        { english: 'Thank you.', chinese: '谢谢你。' }
      ]
    },
    {
      id: 'unit-10',
      title: 'Toys',
      subtitle: '玩具',
      words: [
        { english: 'ball', chinese: '球', image: '' },
        { english: 'doll', chinese: '娃娃', image: '' },
        { english: 'car', chinese: '小汽车', image: '' },
        { english: 'kite', chinese: '风筝', image: '' },
        { english: 'robot', chinese: '机器人', image: '' },
        { english: 'bear', chinese: '熊', image: '' }
      ],
      sentences: [
        { english: 'I have a ball.', chinese: '我有一个球。' },
        { english: 'The doll is pretty.', chinese: '娃娃很漂亮。' },
        { english: 'Let us play with the kite.', chinese: '我们一起玩风筝吧。' },
        { english: 'The robot is cool.', chinese: '机器人很酷。' }
      ]
    },
    {
      id: 'unit-11',
      title: 'Weather',
      subtitle: '天气',
      words: [
        { english: 'sun', chinese: '太阳', image: '' },
        { english: 'rain', chinese: '雨', image: '' },
        { english: 'wind', chinese: '风', image: '' },
        { english: 'cloud', chinese: '云', image: '' },
        { english: 'hot', chinese: '热', image: '' },
        { english: 'cold', chinese: '冷', image: '' }
      ],
      sentences: [
        { english: 'It is sunny today.', chinese: '今天是晴天。' },
        { english: 'It is raining.', chinese: '下雨了。' },
        { english: 'It is hot.', chinese: '天很热。' },
        { english: 'It is cold.', chinese: '天很冷。' },
        { english: 'I like the sun.', chinese: '我喜欢太阳。' }
      ]
    },
    {
      id: 'unit-12',
      title: 'Happy New Year',
      subtitle: '新年快乐',
      words: [
        { english: 'new', chinese: '新的', image: '' },
        { english: 'year', chinese: '年', image: '' },
        { english: 'happy', chinese: '快乐', image: '' },
        { english: 'party', chinese: '派对', image: '' },
        { english: 'sing', chinese: '唱歌', image: '' },
        { english: 'dance', chinese: '跳舞', image: '' }
      ],
      sentences: [
        { english: 'Happy New Year!', chinese: '新年快乐！' },
        { english: 'Let us sing a song.', chinese: '我们唱首歌吧。' },
        { english: 'I can dance.', chinese: '我会跳舞。' },
        { english: 'We are happy.', chinese: '我们很开心。' },
        { english: 'I love you, Mum and Dad.', chinese: '我爱你们，爸爸妈妈。' }
      ]
    }
  ]
}
