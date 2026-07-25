const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 密钥从 config.js 读取（该文件已加入 .gitignore，不提交到仓库）
const { SECRET_ID, SECRET_KEY } = require('./config')

exports.main = async (event, context) => {
  const { text } = event

  if (!text || !text.trim()) {
    return { code: -1, message: '缺少文本' }
  }

  const cleanText = text.trim()

  try {
    // 缓存检查：用文本 md5 作为云存储路径，避免重复调用 API
    const hash = crypto.createHash('md5').update(cleanText).digest('hex')
    const cloudPath = `tts-cache/${hash}.mp3`

    // 尝试获取已有缓存
    try {
      const cached = await cloud.getTempFileURL({ fileList: [`cloud://${cloud.DYNAMIC_CURRENT_ENV}.${cloudPath}`] })
      if (cached.fileList && cached.fileList[0] && cached.fileList[0].tempFileURL) {
        return { code: 0, url: cached.fileList[0].tempFileURL, cached: true }
      }
    } catch (e) {
      // 缓存不存在，继续生成
    }

    // 调用腾讯云 TTS
    const audioBase64 = await textToSpeech(cleanText)
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    // 上传到云存储作为缓存
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: audioBuffer
    })

    // 获取临时访问 URL
    const urlRes = await cloud.getTempFileURL({ fileList: [uploadRes.fileID] })
    const url = urlRes.fileList[0].tempFileURL

    return { code: 0, url, cached: false }
  } catch (err) {
    console.error('TTS 失败:', err)
    return { code: -1, message: 'TTS 失败: ' + err.message }
  }
}

/**
 * 调用腾讯云 TTS 文本转语音
 * 使用英文女声（VoiceType 1050 = 英语女声 WeEmma）
 */
function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const date = new Date().toISOString().slice(0, 10)

    const payload = JSON.stringify({
      Text: text,
      SessionId: `tts_${Date.now()}`,
      Volume: 1.0,
      Speed: 0.8,       // 稍慢一点，适合小朋友听
      VoiceType: 1050,  // 英语女声 WeEmma
      Codec: 'mp3'
    })

    const service = 'tts'
    const host = 'tts.tencentcloudapi.com'
    const action = 'TextToVoice'
    const version = '2019-08-23'

    // TC3-HMAC-SHA256 签名
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
          if (result.Response && result.Response.Audio) {
            resolve(result.Response.Audio)
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
