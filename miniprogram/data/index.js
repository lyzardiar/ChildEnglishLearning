/**
 * 教材数据统一入口
 * 小程序不支持动态 require，这里静态引入后按学期分发
 */
const upper = require('./grade1-upper.js')
const lower = require('./grade1-lower.js')

module.exports = {
  upper,
  lower,
  getBook(semester) {
    return semester === 'lower' ? lower : upper
  }
}
