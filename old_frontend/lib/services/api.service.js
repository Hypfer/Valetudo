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
            body: JSON.stringify(body),
            cache: "no-store"
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
        var zonePresets = await ApiService.getZonesOpenAPI();
        var zones = [];
        Object.keys(zoneIds).forEach(idsToClean => {
            Object.keys(zonePresets).forEach(zonesIds => {
                if(zonePresets[zonesIds].id === zoneIds[idsToClean]){  
                    for(var multipleZoneIds = 0; multipleZoneIds<zonePresets[zonesIds].zones.length; multipleZoneIds++){
                        var zone = {};
                        zone.iterations = 1;
                        zone.metaData = zonePresets[zonesIds].metaData;
                        zone.points = zonePresets[zonesIds].zones[multipleZoneIds].points;
                        zones.push(zone);
                    }            
                }
            });
        });

        await this.fetch("PUT", "api/v2/robot/capabilities/ZoneCleaningCapability", {
            action: "clean",
            zones: zones
        });
    }

    static async startCleaningZoneByCoords(zones) {
        await this.fetch("PUT", "api/v2/robot/capabilities/ZoneCleaningCapability", {
            action: "clean",
            zones: zones
        });
    }

    static async getSegments() {
        return this.fetch("GET", "api/v2/robot/capabilities/MapSegmentationCapability");
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

    static async splitSegment(pA, pB, segment_id) {
        await this.fetch("PUT", "api/v2/robot/capabilities/MapSegmentEditCapability", {
            action: "split_segment",
            pA: pA,
            pB: pB,
            segment_id: segment_id
        });
    }

    static async joinSegments(segment_a_id, segment_b_id) {
        await this.fetch("PUT", "api/v2/robot/capabilities/MapSegmentEditCapability", {
            action: "join_segments",
            segment_a_id: segment_a_id,
            segment_b_id: segment_b_id
        });
    }

    static async renameSegment(segment_id, name) {
        await this.fetch("PUT", "api/v2/robot/capabilities/MapSegmentRenameCapability", {
            action: "rename_segment",
            segment_id: segment_id,
            name: name
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

    static async getWaterGradePresets() {
        return await this.fetch("GET", "api/v2/robot/capabilities/WaterUsageControlCapability/presets");
    }

    /**
     * @param {string} level
     */
    static async setFanspeed(level) {
        await this.fetch("PUT", "api/v2/robot/capabilities/FanSpeedControlCapability/preset", {
            name: level
        });
    }

    /**
     * @param {string} level
     */
    static async setWaterGrade(level) {
        await this.fetch("PUT", "api/v2/robot/capabilities/WaterUsageControlCapability/preset", {
            name: level
        });
    }

    static async getSupportedVirtualRestrictions() {
        return await this.fetch("GET", "api/v2/robot/capabilities/CombinedVirtualRestrictionsCapability/properties");
    }

    static async setPersistentData(virtualWalls, no_go_areas, no_mop_zones) {
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
                    },
                    type: "regular"
                };
            }).concat(no_mop_zones.map(a => {
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
                    },
                    type: "mop"
                };
            }))
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
    
    static async getZonesOpenAPI() {
        return await this.fetch("GET", "api/v2/robot/capabilities/ZoneCleaningCapability/presets");
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

    static async getValetudoLogContent() {
        return await this.fetch("GET", "api/v2/valetudo/log/content");
    }

    static async getValetudoLogLevel() {
        return await this.fetch("GET", "api/v2/valetudo/log/level");
    }

    static async setValetudoLogLevel(level) {
        await this.fetch("PUT", "api/v2/valetudo/log/level", {level: level});
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

    static async getDndConfiguration() {
        return await this.fetch("GET", "api/v2/robot/capabilities/DoNotDisturbCapability");
    }

    static async setDndConfiguration(enabled, start_hour, start_minute, end_hour, end_minute) {
        await this.fetch("PUT", "api/v2/robot/capabilities/DoNotDisturbCapability", {
            enabled: enabled,
            start: {
                hour: start_hour,
                minute: start_minute
            },
            end: {
                hour: end_hour,
                minute: end_minute
            }
        });
    }

    static async getCarpetModeStatus() {
        return await this.fetch("GET", "api/v2/robot/capabilities/CarpetModeControlCapability");
    }

    static async enableCarpetMode() {
        await this.fetch("PUT", "api/v2/robot/capabilities/CarpetModeControlCapability", {action: "enable"});
    }

    static async disableCarpetMode() {
        await this.fetch("PUT", "api/v2/robot/capabilities/CarpetModeControlCapability", {action: "disable"});
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
        await this.fetch("PUT", "api/v2/robot/capabilities/MapResetCapability", {action: "reset"});
    }


    static async resetConsumable(type, subType) {
        var url = "api/v2/robot/capabilities/ConsumableMonitoringCapability/" + type;

        if (subType) {
            url += "/" + subType;
        }
        await this.fetch("PUT", url, {action: "reset"});
    }

    static async getConsumableStatus() {
        return await this.fetch("GET", "api/v2/robot/capabilities/ConsumableMonitoringCapability");
    }

    static async getCleanSummary() {
        return await this.fetch("GET", "api/clean_summary");
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


    static async getSpeakerVolume() {
        return await this.fetch("GET", "api/v2/robot/capabilities/SpeakerVolumeControlCapability");
    }

    static async setSpeakerVolume(volume) {
        await this.fetch("PUT", "api/v2/robot/capabilities/SpeakerVolumeControlCapability", {action: "set_volume", value: volume});
    }

    static async testSpeakerVolume() {
        await this.fetch("PUT", "api/v2/robot/capabilities/SpeakerTestCapability", {action: "play_test_sound"});
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
}
