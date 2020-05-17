/*global ons */
window.fn = {};

window.fn.toggleMenu = function() {
    document.getElementById("appSplitter").left.toggle();
    var themeSwitch = document.getElementById("theme-switch");
    themeSwitch.checked = window.fn.theme == "dark";
    themeSwitch.addEventListener("change", (event) => {
        if (event.switch.checked) {
            window.fn.theme = "dark";
        } else {
            window.fn.theme = "light";
        }
        if (event.isInteractive)
            window.localStorage.setItem("theme", window.fn.theme);
        window.fn.applyTheme();
    });
};

window.fn.loadView = function(index) {
    document.getElementById("appTabbar").setActiveTab(index);
    document.getElementById("sidemenu").close();
};

window.fn.loadLink = function(url) {
    window.open(url, "_blank");
};

window.fn.pushPage = function(page, anim) {
    if (anim) {
        document.getElementById("appNavigator")
            .pushPage(page.id, {data: {title: page.title, ...page.data}, animation: anim});
    } else {
        document.getElementById("appNavigator").pushPage(page.id, {
            data: {title: page.title, ...page.data}
        });
    }
    history.pushState({}, page.title);
};

window.fn.popPage =
    function() {
        document.getElementById("appNavigator").popPage();
    };

window.fn.getTopPage =
        function() {
            return document.getElementById("appNavigator").topPage;
        };

window.fn.applyTheme =
    function() {
        let themeEl = document.getElementById("theme");
        let mapThemeEl = document.getElementById("map-theme");
        if (window.fn.theme == "dark") {
            if (themeEl)
                themeEl.setAttribute("href", "css/dark-onsen-css-components.min.css");
            if (mapThemeEl)
                mapThemeEl.setAttribute("href", "css/dark-valetudo-map.css");
        } else {
            if (themeEl)
                themeEl.setAttribute("href", "css/onsen-css-components.min.css");
            if (mapThemeEl)
                mapThemeEl.setAttribute("href", "css/valetudo-map.css");
        }
        window.fn.updateMapPage && window.fn.updateMapPage();
    };

window.fn.toastErrorTimeout = 5e3;
window.fn.toastOKTimeout = 15e2;

// TODO: Fix this routing mess
ons.ready(function() {
    window.addEventListener("popstate", function(e) {
        e.preventDefault();
        document.getElementById("appNavigator").popPage({});
        history.pushState(null, null, window.location.pathname); // What
        // this is just broken
    }, false);
    window.fn.theme = window.localStorage.getItem("theme");
    if (window.fn.theme === null) {
        if (matchMedia("(prefers-color-scheme: dark)").matches) {
            window.fn.theme = "dark";
        } else {
            window.fn.theme = "light";
        }
    }
    window.fn.applyTheme();
});

if (ons.platform.isIPhoneX()) {
    document.documentElement.setAttribute("onsflag-iphonex-portrait", "");
}