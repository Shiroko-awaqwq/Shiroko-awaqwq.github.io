/**
 * Copyright (C) 2026 FouC3. All rights reserved.
 * 本文件由 FouC3 编写或修改，其原创部分及针对原代码的修改部分受根目录 LICENSE 文件约束。
 */

(() => {
  const defaultConfig = {
    position: 'top-right',
    duration: 5000,
    showViewBtn: true,
    showCloseBtn: true,
    clickable: true,
    viewBtnText: '查看',
    minWidth: 200,
    maxWidth: 320,
    fontSize: 14,
    animationDuration: 300,
    onShow: null,
    onClose: null,
    onClick: null,
    onViewClick: null
  }

  let container = null
  let currentPosition = null

  const ensureContainer = (position) => {
    if (!container) {
      container = document.createElement('div')
      container.id = 'notification-card-container'
      container.innerHTML = `<style>
#notification-card-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
}
#notification-card-container.bottom-right {
  bottom: 20px;
  right: 20px;
}
#notification-card-container.bottom-left {
  bottom: 20px;
  left: 20px;
}
#notification-card-container.top-right {
  top: 80px;
  right: 20px;
}
#notification-card-container.top-left {
  top: 20px;
  left: 20px;
}
.notification-card {
  background: var(--card-bg, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 10px;
  max-width: 320px;
  min-width: 200px;
  overflow: hidden;
  pointer-events: auto;
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
}
.notification-card.clickable {
  cursor: pointer;
}
.notification-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 12px 4px;
}
.notification-card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #333);
  flex: 1;
  margin: 0;
}
.notification-card-close {
  background: none;
  border: none;
  color: var(--text-color, #999);
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, color 0.2s;
}
.notification-card-close:hover {
  color: var(--text-color, #666);
  transform: rotate(90deg);
}
.notification-card-content {
  padding: 0 12px 12px;
  font-size: 13px;
  color: var(--text-color, #666);
  word-break: break-word;
  line-height: 1.5;
}
.notification-card-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color, #eee);
}
.notification-card-view-btn {
  background: var(--btn-bg, #4CAF50);
  color: var(--btn-color, #fff);
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.notification-card-view-btn:hover {
  opacity: 0.8;
}

/* 位置动画 - top-right */
#notification-card-container.top-right .notification-card {
  transform: translateX(100%);
}
#notification-card-container.top-right .notification-card.show {
  transform: translateX(0);
  opacity: 1;
}
#notification-card-container.top-right .notification-card.hide {
  transform: translateX(100%);
  opacity: 0;
}

/* 位置动画 - top-left */
#notification-card-container.top-left .notification-card {
  transform: translateX(-100%);
}
#notification-card-container.top-left .notification-card.show {
  transform: translateX(0);
  opacity: 1;
}
#notification-card-container.top-left .notification-card.hide {
  transform: translateX(-100%);
  opacity: 0;
}

/* 位置动画 - bottom-right */
#notification-card-container.bottom-right .notification-card {
  transform: translateX(100%);
}
#notification-card-container.bottom-right .notification-card.show {
  transform: translateX(0);
  opacity: 1;
}
#notification-card-container.bottom-right .notification-card.hide {
  transform: translateX(100%);
  opacity: 0;
}

/* 位置动画 - bottom-left */
#notification-card-container.bottom-left .notification-card {
  transform: translateX(-100%);
}
#notification-card-container.bottom-left .notification-card.show {
  transform: translateX(0);
  opacity: 1;
}
#notification-card-container.bottom-left .notification-card.hide {
  transform: translateX(-100%);
  opacity: 0;
}

@media (prefers-color-scheme: dark) {
  .notification-card {
    background: var(--card-bg, #2a2a2a);
  }
  .notification-card-title {
    color: var(--text-color, #e0e0e0);
  }
  .notification-card-content {
    color: var(--text-color, #aaa);
  }
  .notification-card-close {
    color: var(--text-color, #777);
  }
  .notification-card-footer {
    border-top-color: var(--border-color, #444);
  }
}
[data-theme="dark"] .notification-card {
  background: var(--card-bg, #2a2a2a);
}
[data-theme="dark"] .notification-card-title {
  color: var(--text-color, #e0e0e0);
}
[data-theme="dark"] .notification-card-content {
  color: var(--text-color, #aaa);
}
[data-theme="dark"] .notification-card-close {
  color: var(--text-color, #777);
}
[data-theme="dark"] .notification-card-footer {
  border-top-color: var(--border-color, #444);
}
</style>`
      document.body.appendChild(container)
    }

    if (currentPosition !== position) {
      container.className = `notification-card-container ${position}`
      currentPosition = position
    }

    return container
  }

  const createCard = (options) => {
    const config = { ...defaultConfig, ...options }
    const containerEl = ensureContainer(config.position)

    const card = document.createElement('div')
    card.className = 'notification-card'
    card.style.minWidth = `${config.minWidth}px`
    card.style.maxWidth = `${config.maxWidth}px`
    card.style.fontSize = `${config.fontSize}px`
    if (config.animationDuration > 0) {
      card.style.transitionDuration = `${config.animationDuration}ms`
    } else {
      card.style.transition = 'none'
    }
    if (config.clickable) {
      card.classList.add('clickable')
    }

    const calcCloseBtnSize = (cardWidth) => {
      const suggested = cardWidth * 0.125
      return Math.max(30, Math.min(50, Math.round(suggested)))
    }

    let html = `<div class="notification-card-header">
      <p class="notification-card-title">${config.title || ''}</p>
      ${config.showCloseBtn !== false ? '<button class="notification-card-close" aria-label="关闭"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>' : ''}
    </div>`

    if (config.content) {
      html += `<div class="notification-card-content">${config.content}</div>`
    }

    if (config.showViewBtn) {
      html += `<div class="notification-card-footer">
        <button class="notification-card-view-btn">${config.viewBtnText}</button>
      </div>`
    }

    card.innerHTML = html

    let closeTimer = null
    let isClosed = false

    const getCardFullHeight = () => {
      return card.offsetHeight + 10
    }

    const close = () => {
      if (isClosed) return
      isClosed = true
      clearTimeout(closeTimer)
      card.classList.remove('show')
      card.classList.add('hide')

      const cardHeight = getCardFullHeight()
      const allCards = Array.from(containerEl.querySelectorAll('.notification-card'))
      const cardIndex = allCards.indexOf(card)
      const cardsBelow = allCards.slice(cardIndex + 1)

      card.style.marginTop = `-${cardHeight}px`
      card.style.marginBottom = '0px'

      cardsBelow.forEach((belowCard, index) => {
        belowCard.style.transitionDelay = `${index * 150}ms`
      })

      setTimeout(() => {
        cardsBelow.forEach((belowCard) => {
          belowCard.style.transitionDelay = '0ms'
        })
        card.remove()
        if (config.onClose) config.onClose()
      }, 300 + cardsBelow.length * 150)
    }

    const startTimer = () => {
      if (config.duration > 0) {
        closeTimer = setTimeout(close, config.duration)
      }
    }

    const stopTimer = () => {
      clearTimeout(closeTimer)
    }

    const closeBtn = card.querySelector('.notification-card-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        close()
      })
    }

    if (config.showViewBtn) {
      card.querySelector('.notification-card-view-btn').addEventListener('click', (e) => {
        e.stopPropagation()
        if (config.onViewClick) {
          config.onViewClick()
        }
        close()
      })
    }

    if (config.clickable) {
      card.addEventListener('click', () => {
        if (config.onClick) {
          config.onClick()
        }
        close()
      })
    }

    card.addEventListener('mouseenter', stopTimer)
    card.addEventListener('mouseleave', startTimer)

    const existingCards = containerEl.querySelectorAll('.notification-card')
    const entranceDelay = existingCards.length * 50

    containerEl.appendChild(card)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const closeBtn = card.querySelector('.notification-card-close')
        if (closeBtn) {
          const cardWidth = card.offsetWidth
          const btnSize = calcCloseBtnSize(cardWidth)
          const svg = closeBtn.querySelector('svg')
          closeBtn.style.width = `${btnSize}px`
          closeBtn.style.height = `${btnSize}px`
          svg.setAttribute('width', btnSize - 8)
          svg.setAttribute('height', btnSize - 8)
        }

        if (entranceDelay > 0) {
          card.style.transitionDelay = `${entranceDelay}ms`
        }

        card.classList.add('show')
        if (config.onShow) config.onShow()
        startTimer()

        setTimeout(() => {
          card.style.transitionDelay = '0ms'
        }, entranceDelay + 300)
      })
    })

    return { close }
  }

  const notificationCard = {
    show: (options) => createCard(options),
    setDefaults: (options) => {
      Object.assign(defaultConfig, options)
    }
  }

  window.notificationCard = notificationCard
})()
