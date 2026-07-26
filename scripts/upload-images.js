/**
 * 批量上传单词配图到微信云存储
 * 用法: node scripts/upload-images.js
 * 
 * 上传后图片 fileID 格式: cloud://{env}.images/words/{style}/{unitId}/{word}.png
 * 前端通过 fileID 前缀 + 路径拼接即可直接访问，无需逐张缓存
 */
const tcb = require('@cloudbase/node-sdk')
const fs = require('fs')
const path = require('path')

// === 配置 ===
// 密钥统一从根目录 config.js 读取（已 gitignore）
const { SECRET_ID, SECRET_KEY } = require('../config')
const ENV_ID = 'cloud1-d8g5ssn6n94472f8a'
const IMAGES_DIR = path.join(__dirname, '..', 'miniprogram', 'images', 'words')

const app = tcb.init({
  env: ENV_ID,
  secretId: SECRET_ID,
  secretKey: SECRET_KEY
})

async function uploadAll() {
  const styles = fs.readdirSync(IMAGES_DIR).filter(d => {
    return fs.statSync(path.join(IMAGES_DIR, d)).isDirectory()
  })

  let total = 0
  let success = 0
  let failed = 0

  for (const style of styles) {
    const styleDir = path.join(IMAGES_DIR, style)
    const units = fs.readdirSync(styleDir).filter(d => {
      return fs.statSync(path.join(styleDir, d)).isDirectory()
    })

    console.log(`\n[${style}]`)

    for (const unit of units) {
      const unitDir = path.join(styleDir, unit)
      const files = fs.readdirSync(unitDir).filter(f => f.endsWith('.png'))

      for (const file of files) {
        total++
        const localPath = path.join(unitDir, file)
        const cloudPath = `images/words/${style}/${unit}/${file}`

        try {
          const result = await app.uploadFile({
            cloudPath,
            fileContent: fs.createReadStream(localPath)
          })
          success++
          process.stdout.write(`  [${success + failed}/${total}] ${cloudPath} OK\n`)
        } catch (err) {
          failed++
          console.error(`  [${success + failed}/${total}] ${cloudPath} FAILED: ${err.message}`)
        }
      }
    }
  }

  console.log(`\n=== 完成 ===`)
  console.log(`成功: ${success} | 失败: ${failed} | 总计: ${total}`)
  console.log(`\nfileID 前缀: cloud://${ENV_ID}.`)
  console.log(`示例: cloud://${ENV_ID}.images/words/flat/unit-01/hello.png`)
}

uploadAll().catch(err => {
  console.error('上传失败:', err)
  process.exit(1)
})
