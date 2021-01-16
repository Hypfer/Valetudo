export class ApiService {
    /**
     * @private
     * @param {"GET"|"PUT"|"POST"|"DELETE"} method
     * @param {string} url
     * @param {*=} body
     */
    static async fetch(method, url, body) {
        // @ts-ignore
        let response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw Error(await response.text());
        }
        if (response.headers.get("Content-Type").indexOf("json") > -1) {
            return await response.json();
        } else {
            return await response.text();
        }
    }

    static async startCleaning() {
        await this.fetch("PUT", "api/v2/robot/capabilities/BasicControlCapability", {
            action: "start"
        });
    }

    static async pauseCleaning() {
        await this.fetch("PUT", "api/v2/robot/capabilities/BasicControlCapability", {
            action: "pause"
        });
    }

    static async stopCleaning() {
        await this.fetch("PUT", "api/v2/robot/capabilities/BasicControlCapability", {
            action: "stop"
        });
    }

    static async driveHome() {
        await this.fetch("PUT", "api/v2/robot/capabilities/BasicControlCapability", {
            action: "home"
        });
    }

    static async findRobot() {
        await this.fetch("PUT", "api/v2/robot/capabilities/LocateCapability", {
            action: "locate"
        });
    }

    static async spotClean() {
        await this.fetch("PUT", "api/spot_clean");
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    static async goto(x, y) {
        await this.fetch("PUT", "api/v2/robot/capabilities/GoToLocationCapability", {
            action: "goto",
            coordinates: {
                x: x,
                y: y
            }
        });
    }

    /**
     * @param {number[]} zoneIds
     */
    static async startCleaningZonesById(zoneIds) {
        await this.fetch("PUT", "api/v2/robot/capabilities/ZoneCleaningCapability/presets", {
            action: "clean",
            ids: zoneIds
        });
    }

    static async startCleaningZoneByCoords(zones) {
        await this.fetch("PUT", "api/v2/robot/capabilities/ZoneCleaningCapability", {
            action: "clean",
            zones: zones
        });
    }

    /**
     * @param {number[]} segmentIds
     */
    static async startCleaningSegments(segmentIds) {
        await this.fetch("PUT", "api/v2/robot/capabilities/MapSegmentationCapability", {
            action: "start_segment_action",
            segment_ids: segmentIds
        });
    }

    static async getVacuumState() {
        return await this.fetch("GET", "api/v2/robot/state/attributes");
    }

    static async getConfig() {
        return await this.fetch("GET", "api/get_config");
    }

    static async getFanSpeeds() {
        return await this.fetch("GET", "api/v2/robot/capabilities/FanSpeedControlCapability/presets");
    }

    /**
     * @param {string} level
     */
    static async setFanspeed(level) {
        await this.fetch("PUT", "api/v2/robot/capabilities/FanSpeedControlCapability/preset", {
            name: level
        });
    }

    static async setPersistentData(virtualWalls, no_go_areas) {
        await this.fetch("PUT", "api/v2/robot/capabilities/CombinedVirtualRestrictionsCapability", {
            virtualWalls: virtualWalls.map(w => {
                return {
                    points: {
                        pA: {
                            x: w[0],
                            y: w[1],
                        },
                        pB: {
                            x: w[2],
                            y: w[3],
                        },
                    }
                };
            }),
            restrictedZones: no_go_areas.map(a => {
                return {
                    points: {
                        pA: {
                            x: a[0],
                            y: a[1],
                        },
                        pB: {
                            x: a[2],
                            y: a[3],
                        },
                        pC: {
                            x: a[4],
                            y: a[5],
                        },
                        pD: {
                            x: a[6],
                            y: a[7],
                        },
                    }
                };
            })
        });
    }

    static async getLatestMap() {
        return await this.fetch("GET", "api/v2/robot/state/map");
    }

    static async getSpots() {
        return await this.fetch("GET", "api/v2/robot/capabilities/GoToLocationCapability/presets_legacy");
    }

    static async getZones() {
        return await this.fetch("GET", "api/v2/robot/capabilities/ZoneCleaningCapability/presets_legacy");
    }

    static async saveSpots(spotConfig) {
        await this.fetch("POST", "api/v2/robot/capabilities/GoToLocationCapability/presets_legacy", spotConfig);
    }

    static async saveZones(zonesConfig) {
        await this.fetch("POST", "api/v2/robot/capabilities/ZoneCleaningCapability/presets_legacy", zonesConfig);
    }

    static async startManualControl() {
        await this.fetch("PUT", "api/start_manual_control");
    }

    static async stopManualControl() {
        await this.fetch("PUT", "api/stop_manual_control");
    }

    static async setManualControl(angle, velocity, duration, sequenceId) {
        await this.fetch("PUT", "api/set_manual_control", {
            angle: angle,
            velocity: velocity,
            duration: duration,
            sequenceId: sequenceId
        });
    }

    static async getValetudoVersion() {
        return await this.fetch("GET", "api/v2/valetudo/version");
    }

    static async getRobot() {
        return await this.fetch("GET", "api/v2/robot");
    }

    static async getRobotCapabilities() {
        return await this.fetch("GET", "api/v2/robot/capabilities");
    }

    static async getTimers() {
        return await this.fetch("GET", "api/timers");
    }

    static async addTimer(cron) {
        await this.fetch("POST", "api/timers", {cron: cron});
    }

    static async toggleTimer(id, enabled) {
        await this.fetch("PUT", "api/timers/" + id, {enabled: enabled});
    }

    static async deleteTimer(id) {
        await this.fetch("DELETE", "api/timers/" + id);
    }

    static async getDnd() {
        return await this.fetch("GET", "api/v2/robot/capabilities/DoNotDisturbCapability");
    }

    static async deleteDnd() {
        await this.fetch("DELETE", "api/v2/robot/capabilities/DoNotDisturbCapability", {action: "delete"});
    }

    static async setDnd(start_hour, start_minute, end_hour, end_minute) {
        await this.fetch("POST", "api/v2/robot/capabilities/DoNotDisturbCapability", {start: {hour: start_hour, minute: start_minute}, end: {hour: end_hour, minute: end_minute}});
    }

    static async getCarpetMode() {
        return await this.fetch("GET", "api/get_carpet_mode");
    }

    static async setCarpetMode(enable, current_low, current_high, current_integral, stall_time) {
        await this.fetch("PUT", "api/set_carpet_mode", {
            enable, current_low, current_high, current_integral, stall_time
        });
    }

    static async getCapabilities() {
        return await this.fetch("GET", "api/v2/robot/capabilities");
    }


    static async getPersistentMapCapabilityStatus() {
        return await this.fetch("GET", "api/v2/robot/capabilities/PersistentMapControlCapability");
    }

    static async enablePersistentMaps() {
        await this.fetch("PUT", "api/v2/robot/capabilities/PersistentMapControlCapability", {action: "enable"});
    }

    static async disablePersistentMaps() {
        await this.fetch("PUT", "api/v2/robot/capabilities/PersistentMapControlCapability", {action: "disable"});
    }

    static async resetPersistentMaps() {
        await this.fetch("PUT", "api/v2/robot/capabilities/PersistentMapControlCapability", {action: "reset"});
    }


    static async setLabStatus(labStatus) {
        await this.fetch("PUT", "api/set_lab_status", {lab_status: labStatus});
    }

    static async resetConsumable(type, subType) {
        await this.fetch("PUT", "api/v2/robot/capabilities/ConsumableMonitoringCapability/" + type + "/" + subType, {action: "reset"});
    }

    static async getConsumableStatus() {
        return await this.fetch("GET", "api/v2/robot/capabilities/ConsumableMonitoringCapability");
    }

    static async getCleanSummary() {
        return await this.fetch("GET", "api/v2/robot/capabilities/CleanHistoryCapability");
    }

    static async setTimezone(newTimezone) {
        return await this.fetch("POST", "api/set_timezone", {new_zone: newTimezone});
    }
    
    static async retrieveCleanRecord(recordId) {
        return await this.fetch("PUT", "api/v2/robot/capabilities/CleanHistoryCapability/" + recordId);
    }

    static async getWifiStatus() {
        return await this.fetch("GET", "api/v2/robot/capabilities/WifiConfigurationCapability");
    }

    static async saveWifiConfig(ssid, password) {
        await this.fetch("PUT", "api/v2/robot/capabilities/WifiConfigurationCapability", {
            ssid: ssid,
            credentials: {
                type: "wpa2_psk",
                typeSpecificSettings: {
                    password: password
                }
            }
        });
    }

    static async getMqttConfig() {
        return await this.fetch("GET", "api/v2/valetudo/config/interfaces/mqtt");
    }

    static async saveMqttConfig(mqttConfig) {
        await this.fetch("PUT", "api/v2/valetudo/config/interfaces/mqtt", mqttConfig);
    }

    static async getToken() {
        return await this.fetch("GET", "api/token");
    }

    static async getSoundVolume() {
        return await this.fetch("GET", "api/get_sound_volume");
    }

    static async setSoundVolume(volume) {
        await this.fetch("PUT", "api/set_sound_volume", {volume: volume});
    }

    static async testSoundVolume() {
        await this.fetch("PUT", "api/test_sound_volume");
    }

    static async getInstallVoicePackStatus() {
        return await this.fetch("GET", "api/install_voice_pack_status");
    }

    static async getHttpAuthConfig() {
        return await this.fetch("GET", "api/v2/valetudo/config/interfaces/http/auth/basic");
    }

    static async saveHttpAuthConfig(httpAuthConfig) {
        await this.fetch("PUT", "api/v2/valetudo/config/interfaces/http/auth/basic", httpAuthConfig);
    }

    static async getSshKeys() {
        return await this.fetch("GET", "api/v2/valetudo/config/interfaces/ssh/keys");
    }

    static async setSshKeys(keys) {
        await this.fetch("PUT", "api/v2/valetudo/config/interfaces/ssh/keys", {keys: keys});
    }

    static async disableSshKeyUpload() {
        await this.fetch("PUT", "api/v2/valetudo/config/interfaces/ssh", {action: "disable_key_upload"});
    }
}
