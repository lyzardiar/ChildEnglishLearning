const catalog = require('./media-catalog.js')
const grade1Upper = require('./grade1-upper.js')
const grade1Lower = require('./grade1-lower.js')
const subtitleCatalog = require('./subtitle-catalog.js')

function normalizeGrade(grade) {
  const value = Number(grade)
  return value >= 1 && value <= 6 ? value : 1
}

function getGrade(grade) {
  return catalog.grades.find(item => item.grade === normalizeGrade(grade)) || catalog.grades[0]
}

function getBook(semester, grade) {
  const safeSemester = semester === 'lower' ? 'lower' : 'upper'
  const safeGrade = normalizeGrade(grade)
  const source = getGrade(safeGrade).semesters[safeSemester]
  const units = source.units.map((unit, index) => {
    const textbook = safeGrade === 1
      ? (safeSemester === 'lower' ? grade1Lower : grade1Upper)
      : null
    if (textbook?.units[index]) {
      return {
        ...unit,
        ...textbook.units[index],
        mediaId: unit.id,
        unitNumber: unit.unitNumber,
        videos: unit.videos,
        audios: unit.audios,
        knowledge: unit.knowledge,
        counts: unit.counts,
        subtitleFileID: unit.subtitleFileID
      }
    }
    return unit
  })
  return { ...source, grade: safeGrade, semester: safeSemester, units }
}

function getUnit(grade, semester, unitIndex) {
  const unit = getBook(semester, grade).units[Number(unitIndex) || 0] || null
  return unit ? { ...unit, subtitles: subtitleCatalog.getUnitTracks(unit.mediaId || unit.id) } : null
}

function getAppendix(grade, semester, appendixIndex) {
  const item = getBook(semester, grade).appendices?.[Number(appendixIndex) || 0] || null
  return item ? { ...item, subtitles: subtitleCatalog.getUnitTracks(item.mediaId || item.id) } : null
}

module.exports = {
  catalog,
  getGrade,
  getBook,
  getUnit,
  getAppendix,
  loadUnitSubtitles: subtitleCatalog.loadUnitTracks,
  getGrades() {
    return catalog.grades.map(item => ({ grade: item.grade, name: item.name }))
  }
}
