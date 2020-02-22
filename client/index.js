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

window.fn.request = function(url, method, callback) {
    var request = new XMLHttpRequest();
    request.open(method, url, true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            callback(null, JSON.parse(request.responseText));
        } else {
            console.error(request);
            callback("There was an error: " + request.status);
        }
    };

    request.onerror = function() {
        callback("Connection error");
    };

    request.send();
};

window.fn.requestWithPayload = function(url, payload, method, callback) {
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    request.send(payload);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            callback(null, JSON.parse(request.responseText));
        } else {
            console.error(request);
            callback("There was an error: " + request.status);
        }
    };

    request.onerror = function() {
        callback("Connection error");
    };
};

window.fn.postFile =
    function(url, path, progressCallback, callback) {
        var formData = new FormData();
        formData.append("file", path);

        var request = new XMLHttpRequest();
        request.onerror = function(e) {
            console.error(request);
            callback("There was an error: " + request.status);
        };

        request.onload = function(e) {
            if (request.status >= 200 && request.status < 400) {
                callback(null, JSON.parse(request.responseText));
            } else {
                console.error(request);
                callback("There was an error: " + request.status);
            }
        };

        request.upload.onprogress = function(e) {
            var p = Math.round(100 / e.total * e.loaded);
            progressCallback(p);
        };

        request.onerror = function() {
            callback("Connection error");
        };

        request.open("POST", url);
        request.send(formData);
    };

window.fn.secondsToHms = function(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
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