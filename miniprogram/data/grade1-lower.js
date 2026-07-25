/**
 * 沪教牛津版 一年级下册 教材数据
 * TODO: 补充完整下册内容
 */

module.exports = {
  book: '一年级下册',
  publisher: '上海教育出版社（沪教牛津版）',
  units: [
    {
      id: 'unit-01',
      title: 'School',
      subtitle: '学校',
      words: [
        { english: 'book', chinese: '书', image: '' },
        { english: 'pen', chinese: '钢笔', image: '' },
        { english: 'pencil', chinese: '铅笔', image: '' },
        { english: 'ruler', chinese: '尺子', image: '' },
        { english: 'bag', chinese: '书包', image: '' },
        { english: 'desk', chinese: '课桌', image: '' }
      ],
      sentences: [
        { english: 'This is my book.', chinese: '这是我的书。' },
        { english: 'I have a new bag.', chinese: '我有一个新书包。' },
        { english: 'Open your book.', chinese: '打开你的书。' },
        { english: 'Close your book.', chinese: '合上你的书。' }
      ]
    },
    {
      id: 'unit-02',
      title: 'Clothes',
      subtitle: '衣服',
      words: [
        { english: 'shirt', chinese: '衬衫', image: '' },
        { english: 'dress', chinese: '连衣裙', image: '' },
        { english: 'hat', chinese: '帽子', image: '' },
        { english: 'shoe', chinese: '鞋子', image: '' },
        { english: 'sock', chinese: '袜子', image: '' },
        { english: 'coat', chinese: '外套', image: '' }
      ],
      sentences: [
        { english: 'I like my dress.', chinese: '我喜欢我的连衣裙。' },
        { english: 'Put on your hat.', chinese: '戴上你的帽子。' },
        { english: 'The shoes are new.', chinese: '鞋子是新的。' },
        { english: 'It is cold. Wear your coat.', chinese: '天冷了，穿上外套。' }
      ]
    },
    {
      id: 'unit-03',
      title: 'In the park',
      subtitle: '在公园里',
      words: [
        { english: 'tree', chinese: '树', image: '' },
        { english: 'flower', chinese: '花', image: '' },
        { english: 'grass', chinese: '草', image: '' },
        { english: 'lake', chinese: '湖', image: '' },
        { english: 'run', chinese: '跑', image: '' },
        { english: 'jump', chinese: '跳', image: '' }
      ],
      sentences: [
        { english: 'I can run.', chinese: '我会跑。' },
        { english: 'I can jump.', chinese: '我会跳。' },
        { english: 'The flower is beautiful.', chinese: '花很漂亮。' },
        { english: 'Let us play in the park.', chinese: '我们去公园玩吧。' }
      ]
    }
    // TODO: 补充下册剩余单元（unit-04 到 unit-12）
  ]
}
