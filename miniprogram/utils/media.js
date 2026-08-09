const tempUrlCache = Object.create(null)
const jsonCache = Object.create(null)

function getTempUrl(fileID) {
  if (!fileID || !fileID.startsWith('cloud://')) return Promise.resolve(fileID || '')
  if (tempUrlCache[fileID]) return Promise.resolve(tempUrlCache[fileID])

  return wx.cloud.getTempFileURL({ fileList: [fileID] }).then(result => {
    const item = result.fileList && result.fileList[0]
    if (!item || !item.tempFileURL) {
      throw new Error((item && item.errMsg) || '云存储地址获取失败')
    }
    tempUrlCache[fileID] = item.tempFileURL
    return item.tempFileURL
  })
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(value / 60)
  const rest = value % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function parseJson(data) {
  if (data && typeof data === 'object') return data
  return JSON.parse(String(data || ''))
}

function errorMessage(error) {
  return (error && (error.errMsg || error.message)) || String(error || '未知错误')
}

function requestJson(fileID) {
  return getTempUrl(fileID).then(url => new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      dataType: 'json',
      timeout: 10000,
      success: response => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`字幕请求失败 HTTP ${response.statusCode}`))
          return
        }
        try {
          resolve(parseJson(response.data))
        } catch (error) {
          reject(new Error(`字幕数据无法解析: ${error.message}`))
        }
      },
      fail: error => reject(new Error(errorMessage(error)))
    })
  }))
}

function downloadJson(fileID) {
  return wx.cloud.downloadFile({ fileID }).then(result =>
    new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: result.tempFilePath,
        encoding: 'utf8',
        success: response => {
          try {
            resolve(parseJson(response.data))
          } catch (error) {
            reject(new Error(`字幕数据无法解析: ${error.message}`))
          }
        },
        fail: error => reject(new Error(errorMessage(error)))
      })
    })
  )
}

function getJson(fileID) {
  if (!fileID) return Promise.resolve(null)
  if (jsonCache[fileID]) return jsonCache[fileID]

  jsonCache[fileID] = requestJson(fileID).catch(requestError =>
    downloadJson(fileID).catch(downloadError => {
      throw new Error(`字幕加载失败: ${errorMessage(requestError)}; ${errorMessage(downloadError)}`)
    })
  ).catch(error => {
    delete jsonCache[fileID]
    throw error
  })
  return jsonCache[fileID]
}

module.exports = { getTempUrl, getJson, formatTime }
