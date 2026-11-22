/*
 * Copyright (C) 2026 FouC3. All rights reserved.
 * 本文件由 FouC3 编写或修改，其原创部分及针对原代码的修改部分受根目录 LICENSE 文件约束。
 * 本文件来源于 https://blog.liushen.fun/ 通过网页控制台获取
 */

(function () {
    'use strict';

    // 从 window.swiperConfig 读取 Hexo 主题配置
    var config = window.swiperConfig || {};

    // 检查是否启用 Swiper
    if (!config.enable) {
        console.log('[Swiper] 功能已禁用');
        return;
    }

    // 检查容器是否存在
    var container = document.getElementById("swiper_container");
    if (!container) {
        console.warn('[Swiper] 未找到容器元素 #swiper_container');
        return;
    }

    // 动态加载 Swiper CSS
    function loadSwiperCSS() {
        return new Promise(function (resolve, reject) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css';
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // 动态加载 Swiper JS
    function loadSwiperJS() {
        return new Promise(function (resolve, reject) {
            if (typeof Swiper !== 'undefined') {
                resolve();
                return;
            }

            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // 初始化 Swiper
    function initSwiper() {
        // 读取基础配置
        var paginationPosition = config.pagination_position || 'right';
        var direction = config.direction || 'horizontal';
        var effect = config.effect || 'fade';
        var autoplayEnable = config.autoplay && config.autoplay.enable !== false;
        var autoplayDelay = (config.autoplay && config.autoplay.delay) || 3000;
        var mousewheel = config.mousewheel !== false;
        var loop = config.loop !== false;

        // 读取高级配置
        var slideConfig = config.slide || {};
        var slideWidth = slideConfig.width || 'auto';
        var slideHeight = slideConfig.height || 'auto';

        var paginationConfig = config.pagination || {};
        var paginationType = paginationConfig.type || 'bullets';
        var paginationClickable = paginationConfig.clickable !== false;
        var dynamicBullets = paginationConfig.dynamic_bullets || false;

        var animationConfig = config.animation || {};
        var watchProgress = animationConfig.watch_progress !== false;
        var backfaceHidden = animationConfig.backface_hidden !== false;
        var speed = animationConfig.speed || 300;

        var lazyConfig = config.lazy || {};
        var lazyEnable = lazyConfig.enable !== false;
        var loadPrevNext = lazyConfig.load_prev_next !== false;
        var loadPrevNextAmount = lazyConfig.load_prev_next_amount || 1;

        // 添加分页器位置类名
        container.classList.add('pagination-' + paginationPosition);

        // 检查幻灯片数量并自动调整配置
        var slideCount = container.querySelectorAll('.blog-slider__item').length;
        console.log('[Swiper] 检测到 ' + slideCount + ' 个幻灯片');

        if (slideCount < 2) {
            loop = false;
            autoplayEnable = false;
            console.warn('[Swiper] 幻灯片数量不足，已自动禁用循环和自动播放');
        }

        // 构建 Swiper 配置对象
        var swiperOptions = {
            // 基础配置
            direction: direction,
            effect: effect,
            loop: loop,
            speed: speed,
            spaceBetween: 30,
            passiveListeners: true,
            mousewheel: mousewheel,

            // 尺寸配置
            width: slideWidth === 'auto' ? null : parseInt(slideWidth),
            height: slideHeight === 'auto' ? null : parseInt(slideHeight),

            // 自动播放
            autoplay: autoplayEnable ? {
                delay: autoplayDelay,
                disableOnInteraction: true
            } : false,

            // 分页器
            pagination: {
                el: ".blog-slider__pagination",
                type: paginationType,
                clickable: paginationClickable,
                dynamicBullets: dynamicBullets
            },

            // 动画细节
            watchSlidesProgress: watchProgress,

            // 懒加载
            lazy: lazyEnable ? {
                loadPrevNext: loadPrevNext,
                loadPrevNextAmount: loadPrevNextAmount
            } : false
        };

        // 添加 backface-hidden 类
        if (backfaceHidden) {
            container.classList.add('swiper-backface-hidden');
        }

        // 创建 Swiper 实例
        var swiper = new Swiper(".blog-slider", swiperOptions);

        // 鼠标悬停暂停自动播放
        if (autoplayEnable) {
            container.addEventListener('mouseenter', function () {
                swiper.autoplay.stop();
            });

            container.addEventListener('mouseleave', function () {
                swiper.autoplay.start();
            });
        }

        // Pjax 支持
        var pjaxConfig = config.pjax || {};
        if (pjaxConfig.enable && typeof pjax !== 'undefined') {
            var loadMethod = pjaxConfig.load_method || 'pjax.loadUrl';

            // 为所有链接添加 Pjax 点击事件
            container.addEventListener('click', function (e) {
                var target = e.target;

                // 查找最近的 <a> 标签
                while (target && target.tagName !== 'A') {
                    target = target.parentElement;
                }

                if (target && target.tagName === 'A' && target.getAttribute('href')) {
                    var href = target.getAttribute('href');

                    // 排除外部链接和锚点
                    if (href && !href.startsWith('http') && !href.startsWith('#') && href !== 'javascript:void(0);') {
                        e.preventDefault();

                        if (loadMethod === 'pjax.loadUrl' && typeof pjax !== 'undefined' && typeof pjax.loadUrl === 'function') {
                            pjax.loadUrl(href);
                        } else {
                            window.location.href = href;
                        }
                    }
                }
            });
        }

        console.log('[Swiper] 初始化成功', {
            direction: direction,
            effect: effect,
            pagination: paginationPosition,
            width: slideWidth,
            lazy: lazyEnable,
            pjax: pjaxConfig.enable || false
        });
    }

    // 加载并初始化
    Promise.all([loadSwiperCSS(), loadSwiperJS()])
        .then(function () {
            // 确保 Swiper 已加载
            if (typeof Swiper === 'undefined') {
                throw new Error('Swiper 库加载失败');
            }
            initSwiper();
        })
        .catch(function (error) {
            console.error('[Swiper] 加载失败:', error);
        });
})();
