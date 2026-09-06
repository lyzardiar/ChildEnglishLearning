#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const tcb = require('@cloudbase/node-sdk')
const { SECRET_ID, SECRET_KEY } = require('../config')

const ENV_ID = 'cloud1-d8g5ssn6n94472f8a'
const SOURCE_DIR = path.join(__dirname, '..', 'output', 'imagegen', 'chess-pieces', 'final')
const PIECES = ['wk', 'wq', 'wr', 'wb', 'wn', 'wp', 'bk', 'bq', 'br', 'bb', 'bn', 'bp']

const app = tcb.init({ env: ENV_ID, secretId: SECRET_ID, secretKey: SECRET_KEY })

async function upload() {
  const uploaded = []
  for (const piece of PIECES) {
    const localPath = path.join(SOURCE_DIR, `${piece}.png`)
    if (!fs.existsSync(localPath)) throw new Error(`缺少棋子文件: ${localPath}`)
    const cloudPath = `images/chess/metal/${piece}.png`
    const result = await app.uploadFile({
      cloudPath,
      fileContent: fs.createReadStream(localPath)
    })
    if (!result.fileID) throw new Error(`上传 ${piece} 后没有返回 fileID`)
    const checked = await app.getTempFileURL({ fileList: [result.fileID] })
    if (!checked.fileList?.[0]?.tempFileURL) throw new Error(`云端校验 ${piece} 失败`)
    uploaded.push({ piece, cloudPath, fileID: result.fileID, bytes: fs.statSync(localPath).size })
    console.log(`[${uploaded.length}/${PIECES.length}] ${piece} uploaded and verified`)
  }
  console.log(JSON.stringify({ envId: ENV_ID, uploaded }, null, 2))
}

upload().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})
