
        var loadingBarSettingsCarpetMode = document.getElementById('loading-bar-settings-carpet-mode');

        ons.getScriptPage().onShow = function () {
            updateSettingsCarpetModePage();
        };

        function updateSettingsCarpetModePage() {
            loadingBarSettingsCarpetMode.setAttribute("indeterminate", "indeterminate");
            fn.request("api/get_carpet_mode", "GET", function (err, res) {
                loadingBarSettingsCarpetMode.removeAttribute("indeterminate");
                if (err) {
                    ons.notification.toast(err, { buttonLabel: 'Dismiss', timeout: window.fn.toastErrorTimeout })
                } else {
                    var carpetForm = document.getElementById('carpet-mode-form');
                    var result = res[0];
                    carpetForm.current_low.value = result.current_low;
                    carpetForm.current_high.value = result.current_high;
                    carpetForm.current_integral.value = result.current_integral;
                    carpetForm.stall_time.value = result.stall_time;
                    document.getElementById('carpet_mode_enabled').checked = (result.enable==1);
                }
            })
        }

        function saveCarpetMode() {
            ons.notification.confirm('Do you really want to save the modifications made in the carpet mode?').then(function (answer) {
                if (answer === 1) {
                    loadingBarSettingsCarpetMode.setAttribute("indeterminate", "indeterminate");
                    var carpetForm = document.getElementById('carpet-mode-form');
                    var current_low = carpetForm.current_low.value;
                    var current_high = carpetForm.current_high.value;
                    var current_integral = carpetForm.current_integral.value;
                    var stall_time = carpetForm.stall_time.value;
                    var enable = (document.getElementById('carpet_mode_enabled').checked == true);
                    fn.requestWithPayload("api/set_carpet_mode", JSON.stringify({ enable, current_low, current_high, current_integral, stall_time }), "PUT", function (err, res) {
                        if (err) {
                            loadingBarSettingsCarpetMode.removeAttribute("indeterminate");
                            ons.notification.toast(err, { buttonLabel: 'Dismiss', timeout: window.fn.toastErrorTimeout })
                        } else {
                            updateSettingsCarpetModePage();
                        }
                    })
                }
            });
        }
    