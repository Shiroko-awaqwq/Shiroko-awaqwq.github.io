(function() {
    function initShuoshuoClick() {
        var items = document.querySelectorAll('.shuoshuo-item-clickable[data-url]');
        items.forEach(function(item) {
            item.addEventListener('click', function(e) {
                var url = this.getAttribute('data-url');
                if (url) {
                    if (typeof pjax !== 'undefined' && typeof pjax.loadUrl === 'function') {
                        pjax.loadUrl(url);
                    } else {
                        window.location.href = url;
                    }
                }
            });
        });
    }

    function whenDOMReady() {
        initShuoshuoClick();
    }

    whenDOMReady();
    document.addEventListener("pjax:complete", whenDOMReady);
})();
