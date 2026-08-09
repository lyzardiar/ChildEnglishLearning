const app = getApp()
const bookData = require('../../data/index.js')
const speech = require('../../utils/speech')
const audioSession = require('../../utils/audio')
const media = require('../../utils/media')
const imageStyle = require('../../utils/imageStyle')
const { VIDEO_SUBTITLE_LINGER_MS, findTimedLineIndex } = require('../../utils/subtitle')

Page({
  data: {
    grade: 1,
    semester: 'upper',
    unitIndex: 0,
    appendixIndex: 0,
    isAppendix: false,
    unitId: '',
    unitTitle: '',
    unitChinese: '',
    lessonKicker: '',
    audioSectionTitle: '课本音频',
    resourceMessage: '本单元资源正在整理',
    tabs: [],
    activeTab: 'media',
    videos: [],
    audios: [],
    knowledge: [],
    currentVideoIndex: 0,
    currentVideoUrl: '',
    videoLoading: false,
    videoError: false,
    subtitleTracks: { video: {}, audio: {} },
    subtitleLoading: false,
    subtitleError: false,
    currentVideoSubtitles: [],
    currentVideoSubtitleIndex: -1,
    activeVideoSubtitle: null,
    playingAudioId: '',
    audioLoadingId: '',
    audioPaused: false,
    audioProgress: 0,
    audioCurrentText: '00:00',
    audioDurationText: '00:00',
    currentAudioLyrics: [],
    activeAudioLyricIndex: -1,
    audioLyricScrollTarget: '',
    words: [],
    currentWordIndex: 0,
    currentWord: null,
    currentWordImage: '',
    imageLoadError: false,
    sentences: [],
    readyChant: {},
    communication: {},
    letters: [],
    story: {},
    extendTitle: '',
    extendTitleChinese: '',
    extendLines: [],
    ttsPlayingKey: ''
  },

  onLoad(options) {
    const grade = Number(options.grade) || 1
    const semester = options.semester === 'lower' ? 'lower' : 'upper'
    const unitIndex = Number(options.unit) || 0
    const isAppendix = options.appendix !== undefined
    const appendixIndex = Number(options.appendix) || 0
    this.setData({ grade, semester, unitIndex, isAppendix, appendixIndex })
    this.loadUnitData()
  },

  onUnload() {
    this.destroyAudio()
    speech.stop()
  },

  loadUnitData() {
    const unit = this.getCurrentLesson()
    if (!unit) return

    const tabs = [{ key: 'media', name: '课本资源' }]
    if (!this.data.isAppendix) {
      if (unit.words && unit.words.length) tabs.push({ key: 'words', name: '单词' })
      if (unit.sentences && unit.sentences.length) tabs.push({ key: 'sentences', name: '句型' })
      if (unit.story || (unit.extend && unit.extend.length)) tabs.push({ key: 'story', name: '故事' })
      if (unit.letters && unit.letters.length) tabs.push({ key: 'letters', name: '字母' })
    }

    const words = unit.words || []
    const firstWord = words[0] || null
    const semesterName = this.data.semester === 'lower' ? '下册' : '上册'
    const readyChant = unit.readyChant
      ? {
          ...unit.readyChant,
          lines: (unit.readyChant.lines || []).map((item, index) => ({ ...item, ttsKey: `chant-${index}` }))
        }
      : {}
    const communication = unit.communication
      ? {
          ...unit.communication,
          lines: (unit.communication.lines || []).map((item, index) => ({ ...item, ttsKey: `communication-${index}` })),
          question: unit.communication.question
            ? { ...unit.communication.question, ttsKey: 'communication-question' }
            : null
        }
      : {}
    this.setData({
      unitId: unit.id,
      unitTitle: unit.title,
      unitChinese: unit.subtitle || unit.titleChinese,
      lessonKicker: this.data.isAppendix
        ? `${this.data.grade}年级 · ${semesterName} · ${unit.categoryChinese}`
        : `${this.data.grade}年级 · ${semesterName} · Unit ${unit.unitNumber}`,
      audioSectionTitle: this.data.isAppendix ? '附录音频' : '课本音频',
      resourceMessage: unit.statusText || (this.data.isAppendix ? '该附录暂无可播放音频' : '本单元资源正在整理'),
      tabs,
      videos: unit.videos || [],
      audios: unit.audios || [],
      knowledge: unit.knowledge || [],
      subtitleTracks: unit.subtitles || { video: {}, audio: {} },
      words,
      currentWord: firstWord,
      currentWordImage: firstWord ? imageStyle.getWordImage(unit.id, firstWord.english) : '',
      sentences: (unit.sentences || []).map((item, index) => ({ ...item, ttsKey: `sentence-${index}` })),
      readyChant,
      communication,
      letters: (unit.letters || []).map((item, index) => {
        const chant = item.chant || []
        return {
          ...item,
          chant,
          speechText: item.speechText || chant.map(line => line.english).join(' ') || `${item.letter}. ${item.letter[0]} for ${item.word}`,
          ttsKey: `letter-${index}`
        }
      }),
      story: unit.story ? { ...unit.story, lines: (unit.story.lines || []).map((item, index) => ({ ...item, ttsKey: `story-${index}` })) } : {},
      extendTitle: unit.extendTitle || '',
      extendTitleChinese: unit.extendTitleChinese || '',
      extendLines: (unit.extend || []).map((item, index) => ({ ...item, ttsKey: `extend-${index}` }))
    })
    wx.setNavigationBarTitle({ title: this.data.isAppendix ? unit.titleChinese : `Unit ${unit.unitNumber}` })
    if (unit.videos && unit.videos.length) this.prepareVideo(0)
    this.loadSubtitleTracks(unit)
  },

  getCurrentLesson() {
    if (this.data.isAppendix) {
      return bookData.getAppendix(this.data.grade, this.data.semester, this.data.appendixIndex)
    }
    return bookData.getUnit(this.data.grade, this.data.semester, this.data.unitIndex)
  },

  async loadSubtitleTracks(unit) {
    this.setData({ subtitleLoading: Boolean(unit.subtitleFileID), subtitleError: false })
    try {
      const tracks = await bookData.loadUnitSubtitles(unit)
      if (this.data.unitId !== unit.id) return
      const currentVideo = this.data.videos[this.data.currentVideoIndex]
      const currentAudioId = this.data.playingAudioId || this.data.audioLoadingId
      const updates = {
        subtitleTracks: tracks,
        currentVideoSubtitles: currentVideo ? tracks.video[currentVideo.id] || [] : [],
        currentVideoSubtitleIndex: -1,
        activeVideoSubtitle: null,
        subtitleLoading: false,
        subtitleError: false
      }
      if (currentAudioId) {
        updates.currentAudioLyrics = (tracks.audio[currentAudioId] || []).map((line, index) => ({
          ...line,
          anchor: `lyric-${index}`
        }))
      }
      this.setData(updates)
    } catch (error) {
      if (this.data.unitId !== unit.id) return
      console.error('加载字幕失败:', unit.id, error)
      this.setData({ subtitleLoading: false, subtitleError: true })
    }
  },

  onRetrySubtitles() {
    const unit = this.getCurrentLesson()
    if (unit) this.loadSubtitleTracks(unit)
  },

  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab !== 'media') this.pauseAudio()
    this.setData({ activeTab: tab })
  },

  async prepareVideo(index) {
    const item = this.data.videos[index]
    if (!item) return
    const requestId = `${item.id}-${Date.now()}`
    this._videoRequestId = requestId
    const subtitles = this.data.subtitleTracks.video[item.id] || []
    this.setData({
      currentVideoIndex: index,
      currentVideoUrl: '',
      videoLoading: true,
      videoError: false,
      currentVideoSubtitles: subtitles,
      currentVideoSubtitleIndex: -1,
      activeVideoSubtitle: null
    })
    try {
      const url = await media.getTempUrl(item.fileID)
      if (this._videoRequestId === requestId) this.setData({ currentVideoUrl: url, videoLoading: false })
    } catch (err) {
      console.error('加载视频失败:', err)
      if (this._videoRequestId === requestId) this.setData({ videoLoading: false, videoError: true })
    }
  },

  onSelectVideo(e) {
    this.prepareVideo(Number(e.currentTarget.dataset.index))
  },

  onVideoPlay() {
    if (this.data.audioLoadingId) this.destroyAudio()
    else this.pauseAudio()
    const item = this.data.videos[this.data.currentVideoIndex]
    if (item) this.recordLearning('video', item.id)
  },

  onVideoTimeUpdate(e) {
    const index = findTimedLineIndex(
      this.data.currentVideoSubtitles,
      Number(e.detail.currentTime) * 1000,
      VIDEO_SUBTITLE_LINGER_MS
    )
    if (index === this.data.currentVideoSubtitleIndex) return
    this.setData({
      currentVideoSubtitleIndex: index,
      activeVideoSubtitle: index >= 0 ? this.data.currentVideoSubtitles[index] : null
    })
  },

  onVideoError() {
    this.setData({ videoError: true })
  },

  async onToggleAudio(e) {
    const item = this.data.audios[Number(e.currentTarget.dataset.index)]
    if (!item) return

    this.pauseVideo()
    if (this._audio && this.data.playingAudioId === item.id) {
      if (this.data.audioPaused) this._audio.play()
      else this._audio.pause()
      return
    }

    this.destroyAudio()
    this._audioRequestSequence = (this._audioRequestSequence || 0) + 1
    const requestId = `${item.id}-${this._audioRequestSequence}`
    this._audioRequestId = requestId
    const lyrics = (this.data.subtitleTracks.audio[item.id] || []).map((line, index) => ({
      ...line,
      anchor: `lyric-${index}`
    }))
    this.setData({
      audioLoadingId: item.id,
      playingAudioId: '',
      audioProgress: 0,
      currentAudioLyrics: lyrics,
      activeAudioLyricIndex: -1,
      audioLyricScrollTarget: ''
    })
    try {
      const url = await media.getTempUrl(item.fileID)
      if (this._audioRequestId !== requestId) return
      await audioSession.configure()
      if (this._audioRequestId !== requestId) return
      const audio = audioSession.createContext()
      this._audio = audio
      audio.src = url
      audio.onPlay(() => {
        if (this._audio !== audio || this._audioRequestId !== requestId) return
        this.pauseVideo()
        this.setData({ playingAudioId: item.id, audioLoadingId: '', audioPaused: false })
        this.recordLearning('audio', item.id)
      })
      audio.onPause(() => {
        if (this._audio === audio) this.setData({ audioPaused: true })
      })
      audio.onTimeUpdate(() => {
        if (this._audio !== audio) return
        const duration = audio.duration || item.durationSeconds || 0
        const current = audio.currentTime || 0
        const activeAudioLyricIndex = findTimedLineIndex(this.data.currentAudioLyrics, current * 1000)
        const updates = {
          audioProgress: duration ? Math.min(100, current / duration * 100) : 0,
          audioCurrentText: media.formatTime(current),
          audioDurationText: media.formatTime(duration)
        }
        if (activeAudioLyricIndex !== this.data.activeAudioLyricIndex) {
          updates.activeAudioLyricIndex = activeAudioLyricIndex
          updates.audioLyricScrollTarget = activeAudioLyricIndex >= 0 ? `lyric-${activeAudioLyricIndex}` : ''
        }
        this.setData(updates)
      })
      audio.onEnded(() => {
        if (this._audio === audio) this.resetAudioState()
      })
      audio.onError(err => {
        if (this._audio !== audio) return
        console.error('音频播放失败:', err)
        this.resetAudioState()
        wx.showToast({ title: '音频暂时无法播放', icon: 'none' })
      })
      audio.play()
    } catch (err) {
      if (this._audioRequestId !== requestId) return
      console.error('加载音频失败:', err)
      this.resetAudioState()
      wx.showToast({ title: '音频加载失败', icon: 'none' })
    }
  },

  onSeekAudio(e) {
    if (!this._audio || !this._audio.duration) return
    this._audio.seek(this._audio.duration * Number(e.detail.value) / 100)
  },

  onIgnoreAudioTap() {},

  onSeekAudioLyric(e) {
    const line = this.data.currentAudioLyrics[Number(e.currentTarget.dataset.index)]
    if (!this._audio || !line) return
    this._audio.seek(line.startMs / 1000)
    if (this.data.audioPaused) this._audio.play()
  },

  pauseAudio() {
    if (this._audio && !this.data.audioPaused) this._audio.pause()
  },

  pauseVideo() {
    if (!this._videoContext) this._videoContext = wx.createVideoContext('lesson-video', this)
    this._videoContext.pause()
  },

  resetAudioState() {
    this.setData({
      playingAudioId: '',
      audioLoadingId: '',
      audioPaused: false,
      audioProgress: 0,
      audioCurrentText: '00:00',
      audioDurationText: '00:00',
      currentAudioLyrics: [],
      activeAudioLyricIndex: -1,
      audioLyricScrollTarget: ''
    })
  },

  destroyAudio() {
    this._audioRequestId = ''
    const audio = this._audio
    this._audio = null
    if (audio) {
      audio.stop()
      audio.destroy()
    }
    this.resetAudioState()
  },

  async onSpeak(e) {
    const text = e.currentTarget.dataset.text
    const key = e.currentTarget.dataset.key || text
    if (!text) return
    speech.stop()
    this.setData({ ttsPlayingKey: key })
    try {
      await speech.speak(text)
    } catch (err) {
      console.error('播放发音失败:', err)
    }
    this.setData({ ttsPlayingKey: '' })
  },

  onNextWord() {
    const nextIndex = this.data.currentWordIndex + 1
    if (nextIndex >= this.data.words.length) {
      this.recordLearning('words', this.data.unitId)
      wx.showToast({ title: '本单元词卡完成', icon: 'success' })
      return
    }
    this.selectWord(nextIndex)
  },

  onPrevWord() {
    if (this.data.currentWordIndex > 0) this.selectWord(this.data.currentWordIndex - 1)
  },

  selectWord(index) {
    const word = this.data.words[index]
    this.setData({
      currentWordIndex: index,
      currentWord: word,
      currentWordImage: imageStyle.getWordImage(this.data.unitId, word.english),
      imageLoadError: false
    })
  },

  onImageError() {
    this.setData({ imageLoadError: true })
  },

  recordLearning(type, mediaId) {
    if (this.data.isAppendix) return
    const key = `${type}-${mediaId}`
    this._recorded ||= Object.create(null)
    if (this._recorded[key]) return
    this._recorded[key] = true
    const child = app.globalData.currentChild
    if (!child) return
    wx.cloud.callFunction({
      name: 'saveProgress',
      data: {
        action: 'save',
        childId: child._id,
        grade: this.data.grade,
        semester: this.data.semester,
        unitIndex: this.data.unitIndex,
        type,
        mediaId,
        score: type === 'words' ? this.data.words.length : 1
      }
    }).catch(err => console.error('保存学习进度失败:', err))
  }
})
