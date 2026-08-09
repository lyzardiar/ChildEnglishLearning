const grade1LowerUnit1 = require('./subtitles/grade1-lower-unit-01.js')
const media = require('../utils/media')

const units = {
  [grade1LowerUnit1.unitId]: grade1LowerUnit1
}

function getUnitTracks(unitId) {
  return units[unitId] || { video: {}, audio: {} }
}

async function loadUnitTracks(unit) {
  const subtitleUnitId = unit.mediaId || unit.id
  const local = getUnitTracks(subtitleUnitId)
  if (!unit.subtitleFileID) return local
  const remote = await media.getJson(unit.subtitleFileID)
  if (!remote || remote.unitId !== subtitleUnitId) {
    throw new Error(`字幕 Unit 不匹配: ${subtitleUnitId}`)
  }
  return {
    video: { ...(remote.video || {}), ...local.video },
    audio: { ...(remote.audio || {}), ...local.audio }
  }
}

module.exports = { getUnitTracks, loadUnitTracks }
