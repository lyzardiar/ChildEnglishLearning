const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 密钥从 config.js 读取（该文件已加入 .gitignore，不提交到仓库）
const { SECRET_ID, SECRET_KEY } = require('./config')

exports.main = async (event, context) => {
  const { fileID } = event

  if (!fileID) {
    return { code: -1, message: '缺少音频文件' }
  }

  try {
    // 1. 从云存储下载音频文件
    const fileRes = await cloud.downloadFile({ fileID })
    const audioBuffer = fileRes.fileContent

    // 2. 转 base64
    const audioBase64 = audioBuffer.toString('base64')

    // 3. 调用腾讯云一句话识别 API
    const text = await recognizeSpeech(audioBase64)

    // 4. 清理云存储中的临时录音（可选）
    // await cloud.deleteFile({ fileList: [fileID] })

    return { code: 0, text }
  } catch (err) {
    console.error('语音识别失败:', err)
    return { code: -1, message: '识别失败: ' + err.message }
  }
}

/**
 * 调用腾讯云 ASR 一句话识别
 */
function recognizeSpeech(audioBase64) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const date = new Date().toISOString().slice(0, 10)

    // 请求参数
    const payload = JSON.stringify({
      ProjectId: 0,
      SubServiceType: 2, // 一句话识别
      EngSerViceType: '16k_en', // 16k 英文
      SourceType: 1, // base64
      VoiceFormat: 'mp3',
      Data: audioBase64,
      DataLen: Buffer.from(audioBase64, 'base64').length
    })

    const service = 'asr'
    const host = 'asr.tencentcloudapi.com'
    const action = 'SentenceRecognition'
    const version = '2019-06-14'

    // 签名计算 (TC3-HMAC-SHA256)
    const canonicalRequest = [
      'POST',
      '/',
      '',
      `content-type:application/json\nhost:${host}\n`,
      'content-type;host',
      sha256Hex(payload)
    ].join('\n')

    const credentialScope = `${date}/${service}/tc3_request`
    const stringToSign = [
      'TC3-HMAC-SHA256',
      timestamp.toString(),
      credentialScope,
      sha256Hex(canonicalRequest)
    ].join('\n')

    const secretDate = hmacSha256(`TC3${SECRET_KEY}`, date)
    const secretService = hmacSha256(secretDate, service)
    const secretSigning = hmacSha256(secretService, 'tc3_request')
    const signature = hmacSha256(secretSigning, stringToSign).toString('hex')

    const authorization = `TC3-HMAC-SHA256 Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`

    const options = {
      hostname: host,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': host,
        'Authorization': authorization,
        'X-TC-Action': action,
        'X-TC-Version': version,
        'X-TC-Timestamp': timestamp.toString()
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.Response && result.Response.Result) {
            resolve(result.Response.Result)
          } else if (result.Response && result.Response.Error) {
            reject(new Error(result.Response.Error.Message))
          } else {
            reject(new Error('未知响应格式'))
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      })
    })

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

function hmacSha256(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest()
}
