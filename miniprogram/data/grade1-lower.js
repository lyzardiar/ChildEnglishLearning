const mediaCatalog = require('./media-catalog.js')
const lower = mediaCatalog.grades[0].semesters.lower

module.exports = {
  book: lower.name,
  publisher: '上海教育出版社（沪教版）',
  contentStatus: 'media-catalog',
  units: lower.units
}
