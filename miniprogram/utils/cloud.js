/**
 * 云开发工具模块
 * 封装常用的云数据库和云函数调用
 */

const db = wx.cloud.database()

/**
 * 调用云函数的统一封装
 * @param {string} name - 云函数名
 * @param {object} data - 传递参数
 * @returns {Promise<object>} 云函数返回的 result
 */
async function callFunction(name, data = {}) {
  try {
    const res = await wx.cloud.callFunction({ name, data })
    if (res.result && res.result.code !== 0) {
      throw new Error(res.result.message || '操作失败')
    }
    return res.result
  } catch (err) {
    console.error(`云函数 [${name}] 调用失败:`, err)
    throw err
  }
}

/**
 * 上传文件到云存储
 * @param {string} filePath - 本地文件路径
 * @param {string} cloudPath - 云端存储路径
 * @returns {Promise<string>} fileID
 */
async function uploadFile(filePath, cloudPath) {
  const res = await wx.cloud.uploadFile({ filePath, cloudPath })
  return res.fileID
}

/**
 * 获取云文件临时访问链接
 * @param {string[]} fileIDs - 云文件ID数组
 * @returns {Promise<object[]>} 文件信息列表
 */
async function getTempFileURL(fileIDs) {
  const res = await wx.cloud.getTempFileURL({ fileList: fileIDs })
  return res.fileList
}

module.exports = {
  db,
  callFunction,
  uploadFile,
  getTempFileURL
}
