/**
 * Copyright (C) 2026 FouC3. All rights reserved.
 * 本文件由 FouC3 编写或修改，其原创部分及针对原代码的修改部分受根目录 LICENSE 文件约束。
 */

(() => {
  const STORAGE_KEY = 'artalk-last-comment-id'
  let config = {
    server: '',
    site: '',
    interval: 60000,
    contentMaxLength: 50,
    lengthCountMode: 'content',
    overflowMode: 'ellipsis',
    customApiEndpoint: '',
    showViewBtn: true,
    clickable: true,
    notificationCardUrl: ''
  }
  let timer = null

  const getApiEndpoint = () => {
    if (config.customApiEndpoint) {
      return config.customApiEndpoint
    }
    const baseUrl = config.server.replace(/\/$/, '')
    return `${baseUrl}/api/v2/stats/latest_comments`
  }

  const fetchLatestComment = async () => {
    try {
      const url = `${getApiEndpoint()}?site_name=${encodeURIComponent(config.site)}&limit=1`
      const res = await fetch(url)
      const result = await res.json()
      return result.data && result.data.length > 0 ? result.data[0] : null
    } catch (err) {
      console.error('Artalk notify fetch error:', err)
      return null
    }
  }

  const getStoredId = () => {
    return localStorage.getItem(STORAGE_KEY)
  }

  const setStoredId = (id) => {
    localStorage.setItem(STORAGE_KEY, id.toString())
  }

  const stripHtml = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const processContent = (nick, content) => {
    const rawContent = stripHtml(content)
    const title = `${nick} 刚刚发表了一个评论`

    if (config.lengthCountMode === 'total') {
      const totalLength = title.length + rawContent.length
      if (totalLength > config.contentMaxLength) {
        if (config.overflowMode === 'hide') {
          return { title, content: '' }
        }
        const availableLength = config.contentMaxLength - title.length - 3
        if (availableLength > 0) {
          return { title, content: rawContent.substring(0, availableLength) + '...' }
        }
        return { title, content: '' }
      }
      return { title, content: rawContent }
    }

    if (rawContent.length > config.contentMaxLength) {
      if (config.overflowMode === 'hide') {
        return { title, content: '' }
      }
      return { title, content: rawContent.substring(0, config.contentMaxLength) + '...' }
    }

    return { title, content: rawContent }
  }

  const showNotification = (comment) => {
    const nick = comment.nick || '匿名用户'
    const rawContent = comment.content_marked || comment.content || ''
    const { title, content } = processContent(nick, rawContent)
    const pageUrl = comment.page_url || ''

    const handleJump = () => {
      if (pageUrl) {
        window.location.href = pageUrl
      }
    }

    btf.showNotification({
      title,
      content,
      position: 'top-right',
      showViewBtn: config.showViewBtn,
      clickable: config.clickable,
      onClick: handleJump,
      onViewClick: handleJump,
      notificationCardUrl: config.notificationCardUrl
    })
  }

  const checkNewComment = async () => {
    const comment = await fetchLatestComment()
    if (!comment) return

    const currentId = comment.id
    const storedId = getStoredId()

    if (storedId === null) {
      setStoredId(currentId)
      return
    }

    if (currentId > parseInt(storedId, 10)) {
      setStoredId(currentId)
      showNotification(comment)
    }
  }

  const startPolling = () => {
    if (timer) clearInterval(timer)
    checkNewComment()
    timer = setInterval(checkNewComment, config.interval)
  }

  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const artalkNotify = {
    init: (options) => {
      config = { ...config, ...options }
      if (!config.server && !config.customApiEndpoint) {
        console.error('Artalk notify: server or customApiEndpoint is required')
        return
      }
      if (!config.site) {
        console.error('Artalk notify: site is required')
        return
      }
      startPolling()
    },
    destroy: stopPolling
  }

  window.artalkNotify = artalkNotify
})()
