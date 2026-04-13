(function() {
    var handle = document.querySelector('.mobile-drawer-handle');
    var body = document.body;

    function toggle() {
        body.classList.toggle('nav-open');
    }

    function close() {
        body.classList.remove('nav-open');
    }

    handle.addEventListener('click', toggle);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            close();
        }
    });

    var links = document.querySelectorAll('.mobile-drawer-content a[href]');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', close);
    }
})();

(function() {
    var headings = document.querySelectorAll('main h2[id]');
    var subLinks = document.querySelectorAll('.nav-subheading');
    if (headings.length === 0 || subLinks.length === 0) return;

    var current = null;

    function highlight(id) {
        if (id === current) return;
        current = id;
        for (var i = 0; i < subLinks.length; i++) {
            subLinks[i].classList.remove('active');
        }
        if (!id) return;
        var link = document.querySelector(
            '.nav-subheading[href$="#' + id + '"]'
        );
        if (link) link.classList.add('active');
    }

    function update() {
        var threshold = 100;
        var active = null;
        var scrolledToBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50);
        if (scrolledToBottom) {
            active = headings[headings.length - 1].id;
        } else {
            for (var i = headings.length - 1; i >= 0; i--) {
                if (headings[i].getBoundingClientRect().top <= threshold) {
                    active = headings[i].id;
                    break;
                }
            }
        }
        highlight(active || headings[0].id);
    }

    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                update();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('hashchange', function() {
        setTimeout(update, 50);
    });

    update();
})();

(function() {
    var sidebar = document.querySelector('.sidebar');
    var activeLink = sidebar && sidebar.querySelector('.nav-link.active');
    if (!sidebar || !activeLink) return;

    var linkTop = activeLink.offsetTop;
    var viewHeight = sidebar.clientHeight;
    if (linkTop > viewHeight / 3) {
        sidebar.scrollTop = linkTop - viewHeight / 3;
    }
})();
