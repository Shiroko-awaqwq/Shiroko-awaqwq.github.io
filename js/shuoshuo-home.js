let talkTimer = null;
let isPaused = false;
let currentSlideIndex = 0;

const cacheKey = 'talksCache';
const cacheTimeKey = 'talksCacheTime';

function indexTalk() {
    if (talkTimer) {
        clearInterval(talkTimer);
        talkTimer = null;
    }

    if (!document.getElementById('bber-talk')) return;
    if (!window.shuoshuoConfig) return;

    const config = window.shuoshuoConfig;
    const talkBox = document.querySelector("#bber-talk .talk-list");
    let talkData = [];

    function truncateText(text, maxLength, ellipsis, breakOn) {
        const ellipsisStr = ellipsis || '...';
        if (breakOn) {
            try {
                const breakRegex = new RegExp(breakOn, 'g');
                const match = breakRegex.exec(text);
                if (match && match.index > 0) {
                    return text.slice(0, match.index) + ellipsisStr;
                }
            } catch (e) {}
        }
        if (maxLength > 0) {
            const targetLength = maxLength - ellipsisStr.length;
            if (targetLength <= 0) return ellipsisStr.slice(0, maxLength);
            const stripped = text.replace(/<[^>]*>/g, '');
            if (stripped.length <= maxLength) return text;
            let result = '';
            let count = 0;
            let i = 0;
            while (i < text.length && count < targetLength) {
                if (text[i] === '<') {
                    const end = text.indexOf('>', i);
                    if (end !== -1) {
                        result += text.slice(i, end + 1);
                        i = end + 1;
                    } else {
                        result += text[i];
                        i++;
                    }
                } else {
                    result += text[i];
                    count++;
                    i++;
                }
            }
            return result + ellipsisStr;
        } else {
            const talkList = document.querySelector('#bber-talk .talk-list');
            if (!talkList) return text;
            const computedStyle = window.getComputedStyle(talkList);
            const containerWidth = talkList.clientWidth - parseFloat(computedStyle.paddingLeft || 0) - parseFloat(computedStyle.paddingRight || 0);
            const tempSpan = document.createElement('span');
            tempSpan.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;font:inherit;';
            document.body.appendChild(tempSpan);
            tempSpan.innerHTML = text;
            const textWidth = tempSpan.offsetWidth;
            if (textWidth <= containerWidth) {
                document.body.removeChild(tempSpan);
                return text;
            }
            tempSpan.innerHTML = ellipsisStr;
            const ellipsisWidth = tempSpan.offsetWidth;
            const availableWidth = containerWidth - ellipsisWidth;
            if (availableWidth <= 0) {
                document.body.removeChild(tempSpan);
                return ellipsisStr;
            }
            let result = '';
            let currentWidth = 0;
            let i = 0;
            while (i < text.length && currentWidth < availableWidth) {
                if (text[i] === '<') {
                    const end = text.indexOf('>', i);
                    if (end !== -1) {
                        result += text.slice(i, end + 1);
                        i = end + 1;
                    } else {
                        tempSpan.innerHTML = text[i];
                        currentWidth += tempSpan.offsetWidth;
                        result += text[i];
                        i++;
                    }
                } else {
                    tempSpan.innerHTML = text[i];
                    currentWidth += tempSpan.offsetWidth;
                    if (currentWidth <= availableWidth) {
                        result += text[i];
                    }
                    i++;
                }
            }
            document.body.removeChild(tempSpan);
            return result + ellipsisStr;
        }
    }

    function toTextLocal(ls) {
        return ls.map(item => {
            let c = item.content || '';

            const hasImg = /!\[.*?\]\(.*?\)/.test(c);
            const hasLink = /\[.*?\]\(.*?\)/.test(c);

            c = c
                .replace(/#(.*?)\s/g, '')
                .replace(/\{.*?\}/g, '')
                .replace(/!\[.*?\]\(.*?\)/g, '<i class="fa-solid fa-image"></i>')
                .replace(/\[.*?\]\(.*?\)/g, '<i class="fa-solid fa-link"></i>');

            const icons = [];

            if (item.tags?.length) icons.push('fa-solid fa-tag');

            if (icons.length) c += ' ' + icons.map(i => `<i class="${i}"></i>`).join(' ');
            return truncateText(c, config.maxLength, config.ellipsis, config.breakOn);
        });
    }

    function toTextEch0(ls) {
        return ls.map(item => {
            let c = item.content || '';

            const hasImg = /!\[.*?\]\(.*?\)/.test(c);
            const hasLink = /\[.*?\]\(.*?\)/.test(c);

            c = c
                .replace(/#(.*?)\s/g, '')
                .replace(/\{.*?\}/g, '')
                .replace(/!\[.*?\]\(.*?\)/g, '<i class="fa-solid fa-image"></i>')
                .replace(/\[.*?\]\(.*?\)/g, '<i class="fa-solid fa-link"></i>');

            const icons = [];

            if (item.images?.length && !hasImg) icons.push('fa-solid fa-image');
            if (item.extension_type === 'VIDEO') icons.push('fa-solid fa-video');
            if (item.extension_type === 'MUSIC') icons.push('fa-solid fa-music');
            if (item.extension_type === 'WEBSITE' && !hasLink) icons.push('fa-solid fa-link');
            if (item.extension_type === 'GITHUBPROJ' && !hasLink) icons.push('fab fa-github');

            if (icons.length) c += ' ' + icons.map(i => `<i class="${i}"></i>`).join(' ');
            return truncateText(c, config.maxLength, config.ellipsis, config.breakOn);
        });
    }

    function resetTimer() {
        if (talkTimer) {
            clearInterval(talkTimer);
        }
        talkTimer = setInterval(() => {
            if (!isPaused) {
                slideNext();
            }
        }, config.interval || 3000);
    }

    function slideNext() {
        if (!talkBox || talkBox.children.length === 0) return;

        if (config.animation === 'zoom') {
            slideNextZoom();
        } else {
            slideNextDefault();
        }

        currentSlideIndex = (currentSlideIndex + 1) % talkData.length;
    }

    function slidePrev() {
        if (!talkBox || talkBox.children.length === 0) return;

        if (config.animation === 'zoom') {
            slidePrevZoom();
        } else {
            slidePrevDefault();
        }

        currentSlideIndex = (currentSlideIndex - 1 + talkData.length) % talkData.length;
    }

    function slideNextDefault() {
        talkBox.appendChild(talkBox.children[0]);
    }

    function slidePrevDefault() {
        talkBox.insertBefore(talkBox.children[talkBox.children.length - 1], talkBox.firstChild);
    }

    function slideNextZoom() {
        const items = talkBox.querySelectorAll('.item');
        if (items.length === 0) return;

        items.forEach((item, i) => {
            if (i === 0) {
                item.style.transform = 'scale(0.8)';
                item.style.opacity = '0.5';
                item.style.transition = 'all 0.3s ease';
            }
        });

        setTimeout(() => {
            talkBox.appendChild(items[0]);
            const newItems = talkBox.querySelectorAll('.item');
            newItems.forEach((item, i) => {
                if (i === 0) {
                    item.style.transform = 'scale(1)';
                    item.style.opacity = '1';
                    item.style.transition = 'all 0.3s ease';
                } else {
                    item.style.transform = '';
                    item.style.opacity = '';
                    item.style.transition = '';
                }
            });
        }, 300);
    }

    function slidePrevZoom() {
        const items = talkBox.querySelectorAll('.item');
        if (items.length === 0) return;

        const lastItem = items[items.length - 1];
        lastItem.style.transform = 'scale(0.8)';
        lastItem.style.opacity = '0.5';
        lastItem.style.transition = 'all 0.3s ease';

        talkBox.insertBefore(lastItem, talkBox.firstChild);

        setTimeout(() => {
            const newItems = talkBox.querySelectorAll('.item');
            newItems.forEach((item, i) => {
                if (i === 0) {
                    item.style.transform = 'scale(1)';
                    item.style.opacity = '1';
                    item.style.transition = 'all 0.3s ease';
                } else {
                    item.style.transform = '';
                    item.style.opacity = '';
                    item.style.transition = '';
                }
            });
        }, 10);
    }

    function updateTalkMessage(message, useAnimation) {
        if (!talkBox) return;

        if (useAnimation) {
            talkBox.innerHTML = `<li class="item" style="transform: scale(0.8); opacity: 0.5; transition: all 0.3s ease;">${message}</li>`;

            requestAnimationFrame(() => {
                const item = talkBox.querySelector('.item');
                if (item) {
                    item.style.transform = 'scale(1)';
                    item.style.opacity = '1';
                }
            });
        } else {
            talkBox.innerHTML = `<li class="item">${message}</li>`;
        }
    }

    function initTalk(ls, errorMessage) {
        talkData = ls;
        currentSlideIndex = 0;

        if (!talkBox) return;

        if (!ls || ls.length === 0) {
            updateTalkMessage(errorMessage || '暂无说说', true);
            return;
        }

        let html = '';
        ls.forEach((item, i) => {
            html += `<li class="item item-${i + 1}">${item}</li>`;
        });

        talkBox.innerHTML = html;
        resetTimer();
    }

    function setupMouseScroll() {
        if (!config.mouseScroll) return;
        if (!talkBox) return;

        let scrollThreshold = 0;

        talkBox.addEventListener('wheel', (e) => {
            e.preventDefault();
            scrollThreshold += e.deltaY;

            if (Math.abs(scrollThreshold) >= 50) {
                if (scrollThreshold > 0) {
                    slideNext();
                } else {
                    slidePrev();
                }
                scrollThreshold = 0;
                resetTimer();
            }
        });

        talkBox.addEventListener('mouseenter', () => {
            isPaused = true;
        });

        talkBox.addEventListener('mouseleave', () => {
            isPaused = false;
        });
    }

    function fetchWithRetry(url, options, retriesLeft, retryInterval, retryingMessage) {
        return fetch(url, options)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .catch(error => {
                if (retriesLeft > 0) {
                    console.warn(`Ech0 API request failed, retrying (${retriesLeft} left)...`, error);
                    if (retryingMessage) {
                        updateTalkMessage(retryingMessage, true);
                    }
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(fetchWithRetry(url, options, retriesLeft - 1, retryInterval, retryingMessage));
                        }, retryInterval);
                    });
                }
                throw error;
            });
    }

    if (config.source === 'local') {
        const data = toTextLocal(config.data || []);
        initTalk(data.slice(0, 6));
        setupMouseScroll();
    } else if (config.source === 'ech0') {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const currentTime = new Date().getTime();
        const cacheDuration = config.cacheTime || 30 * 60 * 1000;
        const maxRetries = config.maxRetries || 3;
        const retryInterval = config.retryInterval || 2000;
        const retryingMessage = config.retryingMessage || 'Ech0貌似失联了，正在重试中~';
        const errorMessage = config.errorMessage || 'Ech0连接失败啦，等下再试试吧~';

        if (cachedData && cachedTime && (currentTime - cachedTime < cacheDuration)) {
            const data = toTextEch0(JSON.parse(cachedData));
            initTalk(data.slice(0, 6));
            setupMouseScroll();
        } else {
            fetchWithRetry(
                config.apiUrl,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page: 1, pageSize: config.pageSize || 30 })
                },
                maxRetries,
                retryInterval,
                retryingMessage
            )
            .then(data => {
                if (data.code === 1 && data.data && Array.isArray(data.data.items)) {
                    localStorage.setItem(cacheKey, JSON.stringify(data.data.items));
                    localStorage.setItem(cacheTimeKey, currentTime.toString());

                    const formattedData = toTextEch0(data.data.items);
                    initTalk(formattedData.slice(0, 6));
                    setupMouseScroll();
                } else {
                    console.warn('Unexpected ech0 API response format:', data);
                    initTalk([], errorMessage);
                }
            })
            .catch(error => {
                console.error('Error fetching data from ech0:', error);
                initTalk([], errorMessage);
            });
        }
    }
}

function whenDOMReady() {
    indexTalk();
}

whenDOMReady();
document.addEventListener("pjax:complete", whenDOMReady);
