<ons-page id="settings-token-page">
    <ons-toolbar>
        <div class="left">
            <ons-back-button>Settings</ons-back-button>
        </div>
        <div class="center">Token</div>
        <div class="right">
        </div>
    </ons-toolbar>
    <ons-progress-bar id="loading-bar-settings-token" value="0" indeterminate="indeterminate"></ons-progress-bar>

    <ons-list-title style="margin-top:5px;">Current Token</ons-list-title>
    <ons-list>
        <ons-list-item>
            <div class="left">
                Cloud Token
            </div>
            <div class="right">
                <span id="settings-cloud-token-label" style="text-align:right;user-select:text;-moz-user-select:text;-ms-user-select:text;-webkit-user-select:text;">
                    ????????????????????????????????
                </span>
            </div>
        </ons-list-item>
        <ons-list-item>
            <div class="left">
                Local Token
            </div>
            <div class="right">
                <span id="settings-token-label" style="text-align:right;user-select:text;-moz-user-select:text;-ms-user-select:text;-webkit-user-select:text;">
                    ????????????????????????????????
                </span>
            </div>
        </ons-list-item>
    </ons-list>
    <script>
        var loadingBarSettingsToken = document.getElementById('loading-bar-settings-token');
        var settingsTokenLabel = {
            local: document.getElementById('settings-token-label'),
            cloud: document.getElementById('settings-cloud-token-label')
        };

        ons.getScriptPage().onShow = function () {
            updateSettingsTokenPage();
        };

        function updateSettingsTokenPage() {
            loadingBarSettingsToken.setAttribute("indeterminate", "indeterminate");
            fn.request("api/token", "GET", function (err, res) {
                loadingBarSettingsToken.removeAttribute("indeterminate");
                if (!err) {
                    settingsTokenLabel.cloud.innerHTML = res.cloud;
                    settingsTokenLabel.local.innerHTML = res.local;
                } else {
                    ons.notification.toast(err, { buttonLabel: 'Dismiss', timeout: window.fn.toastErrorTimeout })
                }
            });
        }
    </script>
</ons-page>