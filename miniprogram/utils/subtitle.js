const VIDEO_SUBTITLE_LINGER_MS = 1800

function findTimedLineIndex(lines, timeMs, lingerMs = 0) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (timeMs >= lines[index].startMs) {
      return timeMs <= lines[index].endMs + lingerMs ? index : -1
    }
  }
  return -1
}

module.exports = { VIDEO_SUBTITLE_LINGER_MS, findTimedLineIndex }
