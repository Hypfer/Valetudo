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
        await this.fetch("PUT", "api/find_robot");
    }

    static async spotClean() {
        await this.fetch("PUT", "api/spot_clean");
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    static async goto(x, y) {
        await this.fetch("PUT", "api/go_to", {
            x: x,
            y: y
        });
    }

    /**
     * @param {number[]} zoneId
     */
    static async startCleaningZonesById(zoneId) {
        await this.fetch("PUT", "api/start_cleaning_zones_by_id", zoneId);
    }

    static async startCleaningZoneByCoords(zones) {
        await this.fetch("PUT", "api/start_cleaning_zone_by_coords", zones);
    }

    /**
     * @param {number[]} segmentIds
     */
    static async startCleaningSegments(segmentIds) {
        await this.fetch("PUT", "api/start_cleaning_segments", segmentIds);
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
        await this.fetch("PUT", "api/persistent_data", {
            virtual_walls: virtualWalls,
            no_go_areas: no_go_areas
        });
    }

    static async getLatestMap() {
        return await this.fetch("GET", "api/v2/robot/state/map");
    }

    static async getSpots() {
        return await this.fetch("GET", "api/spots");
    }

    static async getZones() {
        return await this.fetch("GET", "api/v2/robot/capabilities/ZoneCleaningCapability/presets");
    }

    static async saveSpots(spotConfig) {
        await this.fetch("PUT", "api/spots", spotConfig);
    }

    static async saveZones(zonesConfig) {
        await this.fetch("PUT", "api/zones", zonesConfig);
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

    static async getFWVersion() {
        return await this.fetch("GET", "api/fw_version");
    }

    static async getModel() {
        return await this.fetch("GET", "api/model");
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
        return await this.fetch("GET", "api/get_dnd");
    }

    static async deleteDnd() {
        await this.fetch("PUT", "api/delete_dnd");
    }

    static async setDnd(start_hour, start_minute, end_hour, end_minute) {
        await this.fetch("POST", "api/set_dnd", {start_hour, start_minute, end_hour, end_minute});
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
        return await this.fetch("GET", "api/capabilities");
    }

    static async resetMap() {
        await this.fetch("PUT", "api/reset_map");
    }

    static async setLabStatus(labStatus) {
        await this.fetch("PUT", "api/set_lab_status", {lab_status: labStatus});
    }

    static async resetConsumable(consumable) {
        await this.fetch("PUT", "api/reset_consumable", {consumable: consumable});
    }

    static async getConsumableStatus() {
        return await this.fetch("GET", "api/consumable_status");
    }

    static async getCleanSummary() {
        return await this.fetch("GET", "api/clean_summary");
    }

    static async getTimezone() {
        return await this.fetch("GET", "api/get_timezone");
    }

    static async setTimezone(newTimezone) {
        return await this.fetch("POST", "api/set_timezone", {new_zone: newTimezone});
    }

    static async retrieveCleanRecord(recordId) {
        return await this.fetch("PUT", "api/clean_record", {recordId: recordId});
    }

    static async getWifiStatus() {
        return await this.fetch("GET", "api/v2/robot/capabilities/WifiConfigurationCapability");
    }

    static async saveWifiConfig(ssid, password) {
        await this.fetch("PUT", "api/wifi_configuration", {
            ssid: ssid,
            credentials: {
                type: "wpa2_psk",
                password: password
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
        return await this.fetch("GET", "api/http_auth_config");
    }

    static async saveHttpAuthConfig(httpAuthConfig) {
        await this.fetch("PUT", "api/http_auth_config", httpAuthConfig);
    }

    static async getSshKeys() {
        return await this.fetch("GET", "api/get_ssh_keys");
    }

    static async setSshKeys(keys) {
        await this.fetch("PUT", "api/set_ssh_keys", {keys: keys});
    }

    static async disableSshKeyUpload(confirmation) {
        await this.fetch("PUT", "api/ssh_keys_permanently_disable", {confirmation: confirmation});
    }
}