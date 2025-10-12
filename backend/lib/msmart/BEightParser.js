const Logger = require("../Logger");
const MSmartConst = require("./MSmartConst");
const MSmartPacket = require("./MSmartPacket");

const dtos = require("./dtos");

class BEightParser {
    /**
     * @param {MSmartPacket} packet
     * @returns {import("./dtos/MSmartDTO")|"SKIP"|undefined} - FIXME: remove SKIP
     */
    static PARSE(packet) {
        const payload = packet.payload;

        switch (packet.messageType) {
            case MSmartPacket.MESSAGE_TYPE.SETTING: {
                // 0xaa 0x01 <typeId>
                switch (payload[2]) {
                    case 0xc4: // FIXME
                        // No idea. Sample: aa 01 c4 04 00 00 00 00 5c 00 9d 10 01
                        return "SKIP";
                    case 0x9d: // FIXME
                        // Network state? Sample: aa 01 9d 01 02 01
                        return "SKIP";
                    case 0x22: // FIXME
                        // bSaveMapSwitch. Sample: aa 01 22 00
                        return "SKIP";
                    default: {
                        Logger.warn(
                            `Unhandled SETTING packet with typeId '${payload[2]}'`,
                            packet.toHexString()
                        );
                    }
                }

                break;
            }
            case MSmartPacket.MESSAGE_TYPE.ACTION: {
                // 0xaa 0x01 <typeId>
                switch (payload[2]) {
                    case MSmartConst.ACTION.GET_STATUS: {
                        const data = BEightParser._parse_status_payload(payload);

                        return new dtos.MSmartStatusDTO(data);
                    }
                    case MSmartConst.ACTION.LIST_MAPS: {
                        if (payload.length < 9) {
                            Logger.warn("Received invalid LIST_MAPS response. Payload too short.");
                            return undefined;
                        }

                        const data = {
                            currentMapId: payload[5],
                            savedMapIds: []
                        };

                        const mapBitfield = payload.readUInt16LE(7);

                        for (let i = 0; i < 16; i++) {
                            if ((mapBitfield >> i) & 1) {
                                data.savedMapIds.push(i + 1);
                            }
                        }

                        return new dtos.MSmartMapListDTO(data);
                    }
                    case MSmartConst.ACTION.GET_ACTIVE_ZONES: {
                        const data = BEightParser._parse_active_zones_payload(payload);

                        return new dtos.MSmartActiveZonesDTO(data);
                    }
                    case MSmartConst.ACTION.GET_DND: {
                        const data = BEightParser._parse_dnd_payload(payload);

                        return new dtos.MSmartDndConfigurationDTO(data);
                    }
                    case MSmartConst.ACTION.GET_CLEANING_SETTINGS_1: {
                        const data = BEightParser._parse_cleaning_settings_1_payload(payload);

                        return new dtos.MSmartCleaningSettings1DTO(data);
                    }
                    case MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS: {
                        const data = BEightParser._parse_carpet_behavior_settings_payload(payload);

                        return new dtos.MSmartCarpetBehaviorSettingsDTO(data);
                    }
                    default: {
                        Logger.warn(
                            `Unhandled ACTION packet with typeId '${payload[2]}'`,
                            packet.toHexString()
                        );
                    }
                }

                break;
            }
            case MSmartPacket.MESSAGE_TYPE.EVENT: {
                // 0xaa 0x01 <typeId>
                switch (payload[2]) {
                    case MSmartConst.EVENT.STATUS: {
                        const data = BEightParser._parse_status_payload(payload);

                        return new dtos.MSmartStatusDTO(data);
                    }
                    case MSmartConst.EVENT.ACTIVE_ZONES: {
                        const data = BEightParser._parse_active_zones_payload(payload);

                        return new dtos.MSmartActiveZonesDTO(data);
                    }
                    case MSmartConst.EVENT.ERROR: {
                        return new dtos.MSmartErrorDTO({
                            error_type: payload[3],
                            error_desc: payload[4],
                            sta_index: payload[5],
                        });
                    }
                    case MSmartConst.EVENT.CLEANING_SETTINGS_1: {
                        const data = BEightParser._parse_cleaning_settings_1_payload(payload);

                        return new dtos.MSmartCleaningSettings1DTO(data);
                    }
                    case 0xA8: // FIXME
                        // This seems to be relating to the dock state and what it is doing
                        // There are also timers in here?

                        // payload[3]; // Mode?. 0x00:Idle?, 0x01:Clean?, 0x02:Empty, 0x03:Dry, 0x05:Wash, possibly hair cuttting?
                        // payload.readUInt32LE(4); // unclear
                        // payload.readUInt32LE(8); // timer. Seconds counting up
                        // payload[12]; // unclear
                        // payload.readUInt32LE(13); // possibly expected duration of the timer in seconds

                        return "SKIP";
                    case 0x52:
                        // No clue where this is coming from. Seen on the J12 about once every minute. Might be a state update?
                        return "SKIP";
                    case 0x20:
                        // Seems to be relating to map state?
                        return "SKIP";
                    case 0x21:
                        // No clue
                        return "SKIP";
                    default: {
                        Logger.warn(
                            `Unhandled EVENT packet with typeId '${payload[2]}'`,
                            packet.toHexString()
                        );
                    }
                }

                break;
            }
            case MSmartPacket.MESSAGE_TYPE.DOCK: {
                if (
                    payload[0] === 0x66 &&
                    payload[1] === 0x06
                ) {
                    return new dtos.MSmartDockStatusDTO({
                        dust_collection_count: payload[2],
                        fluid_1_ok: !!payload[5],
                        fluid_2_ok: !!payload[6],
                    });
                } else {
                    Logger.warn("Unhandled DOCK packet", packet.toHexString());
                }
                break;
            }
            default: {
                Logger.warn(
                    `Unhandled packet with messageType '${packet.messageType}'. ${packet.payload.subarray(0, 3).toString("hex")}`,
                    packet.toHexString()
                );
            }
        }

        return undefined;
    }

    /**
     * 
     * @private
     * @param {Buffer} payload
     * @returns {object}
     */
    static _parse_status_payload(payload) {
        const data = {};

        data.work_status = payload[3]; // 1 - 23
        data.function_type = payload[4]; // 1 - 6
        data.control_type = payload[5]; // 0 - 2
        data.move_direction = payload[6]; // 0 - 8
        data.work_mode = payload[7]; // 0 - 15
        data.fan_level = payload[8]; // 0 - 5

        // work_area and work_time each have +4 additional bits in payload[22]. - INSANE
        data.work_area = ((payload[22] & 0b00001111) << 8) + payload[9];

        data.water_level = payload[10]; // 0 - 3, OR high-res starting at >= 100
        data.voice_level = payload[11]; // 0 - 100
        // 12 => have_reserve_tank ??
        data.battery_percent = payload[13]; // 0 - 100

        // work_area and work_time each have +4 additional bits in payload[22]. - INSANE - TODO validate. It was [23] before the LLM suggested something else
        data.work_time = (((payload[22] & 0b11110000) >> 4) << 8) + payload[14];

        data.uv_switch = !!(payload[15] & 0b00000001);
        data.wifi_switch = !!(payload[15] & 0b00000010);
        data.voice_switch = !!(payload[15] & 0b00000100);
        data.command_source = !!(payload[15] & 0b01000000);
        data.device_error = !!(payload[15] & 0b10000000);

        data.error_type = payload[16];
        data.error_desc = payload[17];

        const mopStatusByte = payload[18];
        data.has_mop = !!(mopStatusByte & 0b00000001); // Mops attached bool
        data.has_vibrate_mop = !!(mopStatusByte & 0b00000010);

        data.carpet_switch = payload[19]; // bool, apparently superseded and just relevant for the j12?

        // 20 is unknown

        data.cleaning_type = payload[21]; // 0 - 6

        data.vibrate_mode = payload[23] ? "careful" : "efficient"; // TODO: should this be string?
        data.vibrate_switch = !!payload[24];
        data.electrolyzed_water = !!payload[25];
        data.electrolyzed_water_status = payload[26];

        data.dustDragSwitch = !!(payload[27] & 0x01);
        data.dustDragStatus = !!(payload[27] & 0x02);
        data.dustTimes = payload[28];
        data.dustedTimes = payload[29];
        data.chargeDockType = payload[30];

        const stationStatusBits = payload[33];
        data.fluid_1_ok = !!(stationStatusBits & 0b00000100);
        data.fluid_2_ok = !!(stationStatusBits & 0b00001000);
        data.dustbag_installed = !!(stationStatusBits & 0b00100000);
        data.dustbag_full = !!(stationStatusBits & 0b00010000);

        data.mopMode = payload[34];
        data.station_error_code = payload[35]; // 106 = freshwater empty, 152 = wastewater full, otherwise unknown
        data.station_work_status = payload[36]; // 0 - 89 but with holes

        data.job_state = payload[37]; // > 0 means "resumable" flag unless any other flag takes precedence
        data.whole_process_state = payload[38];

        data.continuous_clean_mode = !!payload[41];
        // 42 is unknown
        data.clean_sequence_switch = !!payload[43];

        const childLockBits = payload[45];
        data.child_lock_enabled = !!(childLockBits & 0b00000001);
        data.child_lock_follows_dnd = !!(childLockBits & 0b00000010);

        // 46-49 seem to be a 4 byte number? async_number? not sure

        const generalSwitchBits1 = payload[50]; // Also known as general_switch
        data.personal_clean_prefer_switch = !!(generalSwitchBits1 & 0b00000001);
        data.station_inject_fluid_switch = !!(generalSwitchBits1 & 0b00000010);
        data.station_inject_soft_fluid_switch = !!(generalSwitchBits1 & 0b00000100);
        data.carpet_evade_switch = !!(generalSwitchBits1 & 0b00010000);
        data.station_first_fast_wash_switch = !!(generalSwitchBits1 & 0b01000000);
        data.pet_mode_switch = !!(generalSwitchBits1 & 0b10000000);

        data.station_capability_flags = payload[52];

        const generalSwitchBits2 = payload[53];
        data.stain_clean_switch = !!(generalSwitchBits2 & 0b00000001);
        data.ai_obstacle_switch = !!(generalSwitchBits2 & 0b00000010);
        data.cross_bridge_switch = !!(generalSwitchBits2 & 0b00000100);
        data.camera_led_switch = !!(generalSwitchBits2 & 0b00001000);
        data.map_3d_switch = !!(generalSwitchBits2 & 0b00010000);

        // Master toggle. When disabled, everything else will disable itself
        // This is set to true once the user accepts some ToS
        data.ai_recognition_switch = !!(generalSwitchBits2 & 0b00100000);

        data.test_mode_type = payload[54];
        data.hot_water_wash_mode = payload[55];

        const generalSwitchBits3 = payload[56];
        data.station_self_fluid_2_switch = !!(generalSwitchBits3 & 0b00000001);
        data.slam_version_switch = !!(generalSwitchBits3 & 0b00000010);
        data.hot_dry_charge_plate_switch = !!(generalSwitchBits3 & 0b00000100);
        data.telnet_switch = !!(generalSwitchBits3 & 0b00001000);
        data.mop_auto_dry_switch = !!(generalSwitchBits3 & 0b00010000);
        data.ai_grade_avoidance_mode = !!(generalSwitchBits3 & 0b00100000);
        data.tail_sweep_clean_switch = !!(generalSwitchBits3 & 0b01000000);
        data.pound_sign_switch = !!(generalSwitchBits3 & 0b10000000); // TODO: naming - this is the criss cross pattern with multiple iterations

        data.stationCleanFrequency = payload[57];
        data.beautify_map_grade = payload[58];
        data.collect_dust_mode = payload[59];
        data.session_id = payload[61];
        data.transaction_id = payload[62];

        const generalSwitchBits4 = payload[63];
        data.bridge_boost_switch = !!(generalSwitchBits4 & 0b00001000);
        data.narrow_zone_recharge_switch = !!(generalSwitchBits4 & 0b00010000);
        data.verification_map_switch = !!(generalSwitchBits4 & 0b00100000);

        if (payload.length >= 67) {
            const generalSwitchBits5 = payload[65];
            data.wake_up_switch = !!(generalSwitchBits5 & 0b00000001);
            data.ai_carpet_avoid_switch = !!(generalSwitchBits5 & 0b00000010);
            data.carpet_evade_adaptive_switch = !!(generalSwitchBits5 & 0b00000100);
            data.stuck_mark_switch = !!(generalSwitchBits5 & 0b00001000);
            data.mop_extend_switch = !!(generalSwitchBits5 & 0b00100000);
            data.zigzag_to_end_switch = !!(generalSwitchBits5 & 0b01000000);

            data.remaining_area = payload.readUInt16LE(66);

            const generalSwitchBits6 = payload[68];
            data.ai_avoidance_switch = !!(generalSwitchBits6 & 0b00001000);
            data.gap_deep_cleaning_switch = !!(generalSwitchBits6 & 0b00010000);
            data.furniture_legs_cleaning_switch = !!(generalSwitchBits6 & 0b00100000);
            data.edge_deep_vacuum_switch = !!(generalSwitchBits6 & 0b10000000);

        }

        if (payload.length >= 71) {
            const generalSwitchBits7 = payload[70];

            // possibly to know which room is which? What does the firmware do with it?
            data.furniture_identify_switch = !!(generalSwitchBits7 & 0b00000001);
            data.frequent_auto_empty = !!(generalSwitchBits7 & 0b00000010);
            data.fall_detection_switch = !!(generalSwitchBits7 & 0b00000100);
            data.obstacle_image_upload_switch = !!(generalSwitchBits7 & 0b00001000);
            data.threshold_recognition_switch = !!(generalSwitchBits7 & 0b01000000);
            data.curtain_recognition_switch = !!(generalSwitchBits7 & 0b10000000);
        }

        if (payload.length >= 74) {
            const generalSwitchBits8 = payload[73];

            data.adb_switch = !!(generalSwitchBits8 & 0b00000001);
            data.station_v2_switch = !!(generalSwitchBits8 & 0b00000010);
            data.static_stain_recognition_switch = !!(generalSwitchBits8 & 0b00000100);
            data.stairless_mode_switch = !!(generalSwitchBits8 & 0b00001000);
        }


        return data;
    }

    /**
     * @private
     * @param {Buffer} payload
     * @returns {object}
     */
    static _parse_active_zones_payload(payload) {
        const zoneCount = payload.readUInt8(3);
        const zones = [];
        let offset = 4;

        for (let i = 0; i < zoneCount; i++) {
            if (offset + 10 > payload.length) {
                Logger.warn("Malformed ACTIVE_ZONES payload. Not enough data for all declared zones.");
                break;
            }

            zones.push({
                index: payload.readUInt8(offset),
                passes: payload.readUInt8(offset + 1),
                pA: {
                    x: payload.readUInt16LE(offset + 2),
                    y: payload.readUInt16LE(offset + 4),
                },
                pC: {
                    x: payload.readUInt16LE(offset + 6),
                    y: payload.readUInt16LE(offset + 8),
                }
            });

            offset += 10;
        }

        return { zones: zones };
    }

    /**
     *
     * @private
     * @param {Buffer} payload
     * @returns {object}
     */
    static _parse_dnd_payload(payload) {
        return {
            enabled: payload[3] !== 0,
            start: {
                hour: payload[4],
                minute: payload[5],
            },
            end: {
                hour: payload[6],
                minute: payload[7]
            }
        };
    }

    /**
     * @private
     * @param {Buffer} payload
     * @returns {object}
     */
    static _parse_cleaning_settings_1_payload(payload) {
        const data = {};

        data.route_type = payload[3];
        data.cut_hair_level = payload[4];
        data.collect_suction_level = payload[7];
        data.exhibition_switch = !!payload[8];
        data.ai_grade_avoidance_mode = payload[9];
        data.cut_hair_super_switch = !!payload[10];
        data.turbidity_re_mop_switch = payload[11];

        return data;
    }

    /**
     * @private
     * @param {Buffer} payload
     * @returns {object}
     */
    static _parse_carpet_behavior_settings_payload(payload) {
        const data = {};

        data.carpet_behavior = payload[3];
        data.parameter_bitfield = payload[4];

        data.clean_carpet_first = !!(data.parameter_bitfield & dtos.MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.CLEAN_CARPET_FIRST);
        data.deep_carpet_cleaning = !!(data.parameter_bitfield & dtos.MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.DEEP_CARPET_CLEANING);
        data.carpet_suction_boost = !!(data.parameter_bitfield & dtos.MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.CARPET_SUCTION_BOOST);
        data.enhanced_carpet_avoidance = !!(data.parameter_bitfield & dtos.MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.ENHANCED_CARPET_AVOIDANCE);

        return data;
    }
}

module.exports = BEightParser;
