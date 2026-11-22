/**
 * Copyright (C) 2026 FouC3. All rights reserved.
 * 本文件由 FouC3 编写或修改，其原创部分及针对原代码的修改部分受根目录 LICENSE 文件约束。
 */

document.addEventListener('DOMContentLoaded', () => {
  const { defaultEncoding, translateDelay, msgToTraditionalChinese, msgToSimplifiedChinese } = GLOBAL_CONFIG.translate
  const snackbarData = GLOBAL_CONFIG.Snackbar
  const targetEncodingCookie = 'translate-chn-cht'

  let currentEncoding = defaultEncoding
  let targetEncoding = Number(btf.saveToLocal.get(targetEncodingCookie)) || defaultEncoding
  const translateButtonObject = document.getElementById('translateLink')
  const isSnackbar = snackbarData !== undefined

  const setLang = () => {
    document.documentElement.lang = targetEncoding === 1 ? 'zh-TW' : 'zh-CN'
  }

  const translateText = (txt) => {
    if (!txt) return ''
    if (currentEncoding === 1 && targetEncoding === 2) return window.translateUtils.Simplized(txt)
    if (currentEncoding === 2 && targetEncoding === 1) return window.translateUtils.Traditionalized(txt)
    return txt
  }

  const translateBody = (fobj) => {
    const nodes = typeof fobj === 'object' ? fobj.childNodes : document.body.childNodes

    for (const node of nodes) {
      // Skip BR, HR tags, translate button, or subtitle element
      if (['BR', 'HR'].includes(node.tagName) || node === translateButtonObject) continue
      if (node.id === 'subtitle' || (node.nodeType === Node.ELEMENT_NODE && node.querySelector && node.querySelector('#subtitle') === node)) continue

      if (node.nodeType === Node.ELEMENT_NODE) {
        const { tagName, title, alt, placeholder, value, type } = node

        // Translate title, alt, placeholder
        if (title) node.title = translateText(title)
        if (alt) node.alt = translateText(alt)
        if (placeholder) node.placeholder = translateText(placeholder)

        // Translate input value except text and hidden types
        if (tagName === 'INPUT' && value && type !== 'text' && type !== 'hidden') {
          node.value = translateText(value)
        }

        // Recursively translate child nodes
        translateBody(node)
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Translate text node data
        node.data = translateText(node.data)
      }
    }
  }

  const translatePage = () => {
    if (targetEncoding === 1) {
      currentEncoding = 1
      targetEncoding = 2
      translateButtonObject.textContent = msgToTraditionalChinese
      isSnackbar && btf.snackbarShow(snackbarData.cht_to_chs)
    } else if (targetEncoding === 2) {
      currentEncoding = 2
      targetEncoding = 1
      translateButtonObject.textContent = msgToSimplifiedChinese
      isSnackbar && btf.snackbarShow(snackbarData.chs_to_cht)
    }
    btf.saveToLocal.set(targetEncodingCookie, targetEncoding, 2)
    setLang()
    translateBody()
    if (window.typedJSFn && window.typedJSFn.refresh) {
      window.typedJSFn.refresh()
    }
  }

  const translateInitialization = () => {
    if (translateButtonObject) {
      if (currentEncoding !== targetEncoding) {
        translateButtonObject.textContent =
          targetEncoding === 1
            ? msgToSimplifiedChinese
            : msgToTraditionalChinese
        setLang()
        setTimeout(translateBody, translateDelay)
      }
    }
  }

  window.translateFn = {
    translatePage,
    Traditionalized: (window.translateUtils && window.translateUtils.Traditionalized) ? window.translateUtils.Traditionalized : (s) => s,
    Simplized: (window.translateUtils && window.translateUtils.Simplized) ? window.translateUtils.Simplized : (s) => s,
    translateInitialization
  }

  translateInitialization()
  btf.addGlobalFn('pjaxComplete', translateInitialization, 'translateInitialization')
})