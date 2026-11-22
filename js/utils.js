/**
 * Copyright (C) 2026 FouC3. All rights reserved.
 * 本文件由 FouC3 编写或修改，其原创部分及针对原代码的修改部分受根目录 LICENSE 文件约束。
 */

(() => {
  const btfFn = {
    debounce: (func, wait = 0, immediate = false) => {
      let timeout
      return (...args) => {
        const later = () => {
          timeout = null
          if (!immediate) func(...args)
        }
        const callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
        if (callNow) func(...args)
      }
    },

    throttle: function (func, wait, options = {}) {
      let timeout, context, args
      let previous = 0

      const later = () => {
        previous = options.leading === false ? 0 : new Date().getTime()
        timeout = null
        func.apply(context, args)
        if (!timeout) context = args = null
      }

      const throttled = (...params) => {
        const now = new Date().getTime()
        if (!previous && options.leading === false) previous = now
        const remaining = wait - (now - previous)
        context = this
        args = params
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout)
            timeout = null
          }
          previous = now
          func.apply(context, args)
          if (!timeout) context = args = null
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining)
        }
      }

      return throttled
    },

    overflowPaddingR: {
      add: () => {
        const innerWidth = window.innerWidth
        const clientWidth = document.body.clientWidth
        const paddingRight = innerWidth - clientWidth

        if (paddingRight > 0) {
          document.body.style.paddingRight = `${paddingRight}px`
          document.body.style.overflow = 'hidden'
          const menuElement = document.querySelector('#page-header.nav-fixed #menus')
          if (menuElement) {
            menuElement.style.paddingRight = `${paddingRight}px`
          }
        }
      },
      remove: () => {
        document.body.style.paddingRight = ''
        document.body.style.overflow = ''
        const menuElement = document.querySelector('#page-header.nav-fixed #menus')
        if (menuElement) {
          menuElement.style.paddingRight = ''
        }
      }
    },

    snackbarShow: (text, showAction = false, duration = 4000) => {
      const { position, bgLight, bgDark } = GLOBAL_CONFIG.Snackbar
      const bg = document.documentElement.getAttribute('data-theme') === 'light' ? bgLight : bgDark
      Snackbar.show({
        text,
        backgroundColor: bg,
        showAction,
        duration,
        pos: position,
        customClass: 'snackbar-css'
      })
    },

    showNotification: async (options) => {
      const notificationConfig = (typeof GLOBAL_CONFIG !== 'undefined' && GLOBAL_CONFIG.notification) || {}
      const style = notificationConfig.style || 'card'
      const cardConfig = notificationConfig.card || {}

      const title = options.title || ''
      const content = options.content || ''
      const plainContent = content.replace(/<br>/g, ', ')
      const fullText = title + (content ? '：' + plainContent : '')

      if (style === 'off') {
        return { close: () => {} }
      }

      if (style === 'card') {
        try {
          if (typeof notificationCard === 'undefined') {
            if (options.notificationCardUrl) {
              await btf.getScript(options.notificationCardUrl)
            }
          }
          if (typeof notificationCard !== 'undefined') {
            const isValidNumber = (val) => typeof val === 'number' && !isNaN(val)
            const finalOptions = { ...options }

            const resolveValue = (optKey, cardKey, defaultVal) => {
              if (isValidNumber(options[optKey])) return options[optKey]
              if (isValidNumber(cardConfig[cardKey])) return cardConfig[cardKey]
              return defaultVal
            }

            finalOptions.minWidth = resolveValue('minWidth', 'minWidth', null)
            finalOptions.maxWidth = resolveValue('maxWidth', 'maxWidth', null)
            finalOptions.duration = resolveValue('duration', 'duration', null)
            finalOptions.fontSize = resolveValue('fontSize', 'fontSize', null)
            finalOptions.animationDuration = resolveValue('animationDuration', 'animationDuration', null)

            if (options.showCloseBtn !== undefined && options.showCloseBtn !== null) {
              finalOptions.showCloseBtn = options.showCloseBtn
            } else if (cardConfig.showCloseBtn !== undefined && cardConfig.showCloseBtn !== null) {
              finalOptions.showCloseBtn = cardConfig.showCloseBtn
            }

            Object.keys(finalOptions).forEach(key => {
              if (finalOptions[key] === null || finalOptions[key] === undefined) {
                delete finalOptions[key]
              }
            })

            return notificationCard.show(finalOptions)
          }
        } catch (e) {
          console.warn('notificationCard load failed:', e)
        }
      }

      if (typeof btf !== 'undefined' && btf.snackbarShow) {
        const isValidNumber = (val) => typeof val === 'number' && !isNaN(val)
        const snackbarDuration = isValidNumber(options.duration) ? options.duration : (isValidNumber(cardConfig.duration) ? cardConfig.duration : 5000)
        btf.snackbarShow(fullText, options.showCloseBtn !== false, snackbarDuration)
        return { close: () => {} }
      }

      console.log(fullText)
      return { close: () => {} }
    },

    diffDate: (inputDate, more = false) => {
      const dateNow = new Date()
      const datePost = new Date(inputDate)
      const diffMs = dateNow - datePost
      const diffSec = diffMs / 1000
      const diffMin = diffSec / 60
      const diffHour = diffMin / 60
      const diffDay = diffHour / 24
      const diffMonth = diffDay / 30
      const { dateSuffix } = GLOBAL_CONFIG

      if (!more) return Math.floor(diffDay)

      if (diffMonth > 12) return datePost.toISOString().slice(0, 10)
      if (diffMonth >= 1) return `${Math.floor(diffMonth)} ${dateSuffix.month}`
      if (diffDay >= 1) return `${Math.floor(diffDay)} ${dateSuffix.day}`
      if (diffHour >= 1) return `${Math.floor(diffHour)} ${dateSuffix.hour}`
      if (diffMin >= 1) return `${Math.floor(diffMin)} ${dateSuffix.min}`
      return dateSuffix.just
    },

    loadComment: (dom, callback) => {
      if ('IntersectionObserver' in window) {
        const observerItem = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            callback()
            observerItem.disconnect()
          }
        }, { threshold: [0] })
        observerItem.observe(dom)
      } else {
        callback()
      }
    },

    scrollToDest: (pos, time = 500) => {
      const currentPos = window.scrollY
      const isNavFixed = document.getElementById('page-header').classList.contains('fixed')
      if (currentPos > pos || isNavFixed) pos = pos - 70

      if (window.lenis && typeof window.lenisScrollTo === 'function') {
        window.lenisScrollTo(pos, { duration: time / 1000 })
        return
      }

      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: pos,
          behavior: 'smooth'
        })
        return
      }

      const startTime = performance.now()
      const animate = currentTime => {
        const timeElapsed = currentTime - startTime
        const progress = Math.min(timeElapsed / time, 1)
        window.scrollTo(0, currentPos + (pos - currentPos) * progress)
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    },

    animateIn: (ele, animation) => {
      ele.style.display = 'block'
      ele.style.animation = animation
    },

    animateOut: (ele, animation) => {
      const handleAnimationEnd = () => {
        ele.style.display = ''
        ele.style.animation = ''
        ele.removeEventListener('animationend', handleAnimationEnd)
      }
      ele.addEventListener('animationend', handleAnimationEnd)
      ele.style.animation = animation
    },

    wrap: (selector, eleType, options) => {
      const createEle = document.createElement(eleType)
      for (const [key, value] of Object.entries(options)) {
        createEle.setAttribute(key, value)
      }
      selector.parentNode.insertBefore(createEle, selector)
      createEle.appendChild(selector)
    },

    isHidden: ele => ele.offsetHeight === 0 && ele.offsetWidth === 0,

    getEleTop: ele => {
      let actualTop = ele.offsetTop
      let current = ele.offsetParent

      while (current !== null) {
        actualTop += current.offsetTop
        current = current.offsetParent
      }

      return actualTop
    },

    loadLightbox: ele => {
      const service = GLOBAL_CONFIG.lightbox

      if (service === 'medium_zoom') {
        mediumZoom(ele, { background: 'var(--zoom-bg)' })
      }

      if (service === 'fancybox') {
        Array.from(ele).forEach(i => {
          if (i.parentNode.tagName !== 'A') {
            const dataSrc = i.dataset.lazySrc || i.src
            const dataCaption = i.title || i.alt || ''
            btf.wrap(i, 'a', { href: dataSrc, 'data-fancybox': 'gallery', 'data-caption': dataCaption, 'data-thumb': dataSrc })
          }
        })

        if (!window.fancyboxRun) {
          Fancybox.bind('[data-fancybox]', {
            Hash: false,
            Thumbs: {
              showOnStart: false
            },
            Images: {
              Panzoom: {
                maxScale: 4
              }
            },
            Carousel: {
              transition: 'slide'
            },
            Toolbar: {
              display: {
                left: ['infobar'],
                middle: [
                  'zoomIn',
                  'zoomOut',
                  'toggle1to1',
                  'rotateCCW',
                  'rotateCW',
                  'flipX',
                  'flipY'
                ],
                right: ['slideshow', 'thumbs', 'close']
              }
            }
          })
          window.fancyboxRun = true
        }
      }
    },

    setLoading: {
      add: ele => {
        const html = `
        <div class="loading-container">
          <div class="loading-item">
            <div></div><div></div><div></div><div></div><div></div>
          </div>
        </div>
      `
        ele.insertAdjacentHTML('afterend', html)
      },
      remove: ele => {
        ele.nextElementSibling.remove()
      }
    },

    updateAnchor: anchor => {
      if (anchor !== window.location.hash) {
        if (!anchor) anchor = location.pathname
        const title = GLOBAL_CONFIG_SITE.title
        window.history.replaceState({
          url: location.href,
          title
        }, title, anchor)
      }
    },

    getScrollPercent: (() => {
      let docHeight, winHeight, headerHeight, contentMath

      return (currentTop, ele) => {
        if (!docHeight || ele.clientHeight !== docHeight) {
          docHeight = ele.clientHeight
          winHeight = window.innerHeight
          headerHeight = ele.offsetTop
          contentMath = Math.max(docHeight - winHeight, document.documentElement.scrollHeight - winHeight)
        }

        const scrollPercent = (currentTop - headerHeight) / contentMath
        return Math.max(0, Math.min(100, Math.round(scrollPercent * 100)))
      }
    })(),

    addEventListenerPjax: (ele, event, fn, option = false) => {
      ele.addEventListener(event, fn, option)
      btf.addGlobalFn('pjaxSendOnce', () => {
        ele.removeEventListener(event, fn, option)
      })
    },

    removeGlobalFnEvent: (key, parent = window) => {
      const globalFn = parent.globalFn || {}
      const keyObj = globalFn[key]
      if (!keyObj) return

      Object.keys(keyObj).forEach(i => keyObj[i]())

      delete globalFn[key]
    }
  }

  window.btf = { ...window.btf, ...btfFn }
})()