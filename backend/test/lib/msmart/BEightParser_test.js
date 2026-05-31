const assert = require("node:assert");
const BEightParser = require("../../../lib/msmart/BEightParser");
const MSmartPacket = require("../../../lib/msmart/MSmartPacket");
const { describe, it } = require("node:test");

describe("BEightParser", () => {

    describe("J15 Max Ultra", () => {
        it("parses active segments message with zero segments", () => {
            const rawPacket = Buffer.from("aa0eb800000000000003aa0130005c", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                segmentIds: []
            });
        });

        it("parses active segments message with segments", () => {
            const rawPacket = Buffer.from("aa13b800000000000003aa01300501020306073f", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                segmentIds: [1, 2, 3, 6, 7]
            });
        });

        it("parses DND settings event", () => {
            const rawPacket = Buffer.from("aa12b800000000000004aa01910016000800d8", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                enabled: false,
                start: { hour: 22, minute: 0 },
                end: { hour: 8, minute: 0 }
            });
        });

        it("parses Dock Position", () => {
            const rawPacket = Buffer.from("aa14b800000000000003aa01240187019001000048", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                valid: true,
                x: 391,
                y: 400,
                angle: 0
            });
        });

        it("parses mop dock settings reply", () => {
            const rawPacket = Buffer.from("aa12b800000000000003aa0293000a031403d0", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                mode: 0,
                general_backwash_area: 10,
                general_cleaning_mode: 3,
                custom_backwash_area: 20,
                custom_cleaning_mode: 3,
            });
        });

        it("parses mop dock dryer settings reply", () => {
            const rawPacket = Buffer.from("aa10b800000000000003aa0194050000f1", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                mode: 5,
                time_remaining: 0
            });
        });
    });

    describe("J15 Pro Ultra", () => {
        it("parses status message", () => {
            const rawPacket = Buffer.from("aa54b800000000000003aa0101120002ff00010d73490064120100000100000100000000310001000400002e0000080000000d010100200000004b850200353a0001b7010302000202300023000038020a000100b9", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.strictEqual(data.work_status, 18);
            assert.strictEqual(data.function_type, 0);
            assert.strictEqual(data.control_type, 2);
            assert.strictEqual(data.move_direction, 255);
            assert.strictEqual(data.work_mode, 0);
            assert.strictEqual(data.fan_level, 1);
            assert.strictEqual(data.work_area, 13);
            assert.strictEqual(data.water_level, 115);
            assert.strictEqual(data.voice_level, 73);
            assert.strictEqual(data.battery_percent, 100);
            assert.strictEqual(data.work_time, 18);
            assert.strictEqual(data.uv_switch, true);
            assert.strictEqual(data.wifi_switch, false);
            assert.strictEqual(data.voice_switch, false);
            assert.strictEqual(data.command_source, false);
            assert.strictEqual(data.device_error, false);
            assert.strictEqual(data.error_type, 0);
            assert.strictEqual(data.error_desc, 0);
            assert.strictEqual(data.has_mop, true);
            assert.strictEqual(data.has_vibrate_mop, false);
            assert.strictEqual(data.carpet_switch, 0);
            assert.strictEqual(data.district_status, undefined);
            assert.strictEqual(data.cleaning_type, 1);
            assert.strictEqual(data.vibrate_mode, "efficient");
            assert.strictEqual(data.vibrate_switch, false);
            assert.strictEqual(data.electrolyzed_water, false);
            assert.strictEqual(data.electrolyzed_water_status, 49);
            assert.strictEqual(data.dustDragSwitch, false);
            assert.strictEqual(data.dustDragStatus, false);
            assert.strictEqual(data.dustTimes, 1);
            assert.strictEqual(data.dustedTimes, 0);
            assert.strictEqual(data.chargeDockType, 4);
            assert.strictEqual(data.fluid_1_ok, true);
            assert.strictEqual(data.fluid_2_ok, true);
            assert.strictEqual(data.dustbag_installed, true);
            assert.strictEqual(data.dustbag_full, false);
            assert.strictEqual(data.mopMode, 0);
            assert.strictEqual(data.station_error_code, 0);
            assert.strictEqual(data.station_work_status, 8);
            assert.strictEqual(data.job_state, 0);
            assert.strictEqual(data.whole_process_state, 0);
            assert.strictEqual(data.continuous_clean_mode, true);
            assert.strictEqual(data.clean_sequence_switch, false);
            assert.strictEqual(data.child_lock_enabled, false);
            assert.strictEqual(data.child_lock_follows_dnd, false);
            assert.strictEqual(data.personal_clean_prefer_switch, false);
            assert.strictEqual(data.station_inject_fluid_switch, true);
            assert.strictEqual(data.station_inject_soft_fluid_switch, false);
            assert.strictEqual(data.carpet_evade_switch, false);
            assert.strictEqual(data.station_first_fast_wash_switch, false);
            assert.strictEqual(data.pet_mode_switch, false);
            assert.strictEqual(data.station_capability_flags, 53);
            assert.strictEqual(data.stain_clean_switch, false);
            assert.strictEqual(data.ai_obstacle_switch, true);
            assert.strictEqual(data.cross_bridge_switch, false);
            assert.strictEqual(data.camera_led_switch, true);
            assert.strictEqual(data.map_3d_switch, true);
            assert.strictEqual(data.ai_recognition_switch, true);
            assert.strictEqual(data.test_mode_type, 0);
            assert.strictEqual(data.hot_water_wash_mode, 1);
            assert.strictEqual(data.station_self_fluid_2_switch, true);
            assert.strictEqual(data.slam_version_switch, true);
            assert.strictEqual(data.hot_dry_charge_plate_switch, true);
            assert.strictEqual(data.telnet_switch, false);
            assert.strictEqual(data.mop_auto_dry_switch, true);
            assert.strictEqual(data.ai_grade_avoidance_mode, true);
            assert.strictEqual(data.tail_sweep_clean_switch, false);
            assert.strictEqual(data.pound_sign_switch, true);
            assert.strictEqual(data.stationCleanFrequency, 1);
            assert.strictEqual(data.beautify_map_grade, 3);
            assert.strictEqual(data.collect_dust_mode, 2);
            assert.strictEqual(data.session_id, 2);
            assert.strictEqual(data.transaction_id, 2);
            assert.strictEqual(data.bridge_boost_switch, false);
            assert.strictEqual(data.narrow_zone_recharge_switch, true);
            assert.strictEqual(data.verification_map_switch, true);
            assert.strictEqual(data.wake_up_switch, true);
            assert.strictEqual(data.ai_carpet_avoid_switch, true);
            assert.strictEqual(data.carpet_evade_adaptive_switch, false);
            assert.strictEqual(data.stuck_mark_switch, false);
            assert.strictEqual(data.mop_extend_switch, true);
            assert.strictEqual(data.zigzag_to_end_switch, false);
            assert.strictEqual(data.remaining_area, 0);
            assert.strictEqual(data.ai_avoidance_switch, true);
            assert.strictEqual(data.gap_deep_cleaning_switch, true);
            assert.strictEqual(data.furniture_legs_cleaning_switch, true);
            assert.strictEqual(data.edge_deep_vacuum_switch, false);
            assert.strictEqual(data.furniture_identify_switch, false);
            assert.strictEqual(data.frequent_auto_empty, true);
            assert.strictEqual(data.fall_detection_switch, false);
            assert.strictEqual(data.obstacle_image_upload_switch, true);
            assert.strictEqual(data.threshold_recognition_switch, false);
            assert.strictEqual(data.curtain_recognition_switch, false);
            assert.strictEqual(data.adb_switch, false);
            assert.strictEqual(data.station_v2_switch, false);
            assert.strictEqual(data.static_stain_recognition_switch, false);
            assert.strictEqual(data.stairless_mode_switch, false);
        });
    });

    describe("J12 Ultra", () => {
        it("parses status message", () => {
            const rawPacket = Buffer.from("aa4cb800000000000003aa0101120002ff0a010c024b006415010000010100010000000000000100040000220000080000007c01010018000000031c000004000000d00000020001000000009e", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.strictEqual(data.work_status, 18);
            assert.strictEqual(data.function_type, 0);
            assert.strictEqual(data.control_type, 2);
            assert.strictEqual(data.move_direction, 255);
            assert.strictEqual(data.work_mode, 10);
            assert.strictEqual(data.fan_level, 1);
            assert.strictEqual(data.work_area, 12);
            assert.strictEqual(data.water_level, 2);
            assert.strictEqual(data.voice_level, 75);
            assert.strictEqual(data.battery_percent, 100);
            assert.strictEqual(data.work_time, 21);
            assert.strictEqual(data.uv_switch, true);
            assert.strictEqual(data.wifi_switch, false);
            assert.strictEqual(data.voice_switch, false);
            assert.strictEqual(data.command_source, false);
            assert.strictEqual(data.device_error, false);
            assert.strictEqual(data.error_type, 0);
            assert.strictEqual(data.error_desc, 0);
            assert.strictEqual(data.has_mop, true);
            assert.strictEqual(data.has_vibrate_mop, false);
            assert.strictEqual(data.carpet_switch, 1);
            assert.strictEqual(data.district_status, undefined);
            assert.strictEqual(data.cleaning_type, 1);
            assert.strictEqual(data.vibrate_mode, "efficient");
            assert.strictEqual(data.vibrate_switch, false);
            assert.strictEqual(data.electrolyzed_water, false);
            assert.strictEqual(data.electrolyzed_water_status, 0);
            assert.strictEqual(data.dustDragSwitch, false);
            assert.strictEqual(data.dustDragStatus, false);
            assert.strictEqual(data.dustTimes, 1);
            assert.strictEqual(data.dustedTimes, 0);
            assert.strictEqual(data.chargeDockType, 4);
            assert.strictEqual(data.fluid_1_ok, false);
            assert.strictEqual(data.fluid_2_ok, false);
            assert.strictEqual(data.dustbag_installed, true);
            assert.strictEqual(data.dustbag_full, false);
            assert.strictEqual(data.mopMode, 0);
            assert.strictEqual(data.station_error_code, 0);
            assert.strictEqual(data.station_work_status, 8);
            assert.strictEqual(data.job_state, 0);
            assert.strictEqual(data.whole_process_state, 0);
            assert.strictEqual(data.continuous_clean_mode, true);
            assert.strictEqual(data.clean_sequence_switch, false);
            assert.strictEqual(data.child_lock_enabled, false);
            assert.strictEqual(data.child_lock_follows_dnd, false);
            assert.strictEqual(data.personal_clean_prefer_switch, false);
            assert.strictEqual(data.station_inject_fluid_switch, false);
            assert.strictEqual(data.station_inject_soft_fluid_switch, false);
            assert.strictEqual(data.carpet_evade_switch, false);
            assert.strictEqual(data.station_first_fast_wash_switch, false);
            assert.strictEqual(data.pet_mode_switch, false);
            assert.strictEqual(data.station_capability_flags, 4);
            assert.strictEqual(data.stain_clean_switch, false);
            assert.strictEqual(data.ai_obstacle_switch, false);
            assert.strictEqual(data.cross_bridge_switch, false);
            assert.strictEqual(data.camera_led_switch, false);
            assert.strictEqual(data.map_3d_switch, false);
            assert.strictEqual(data.ai_recognition_switch, false);
            assert.strictEqual(data.test_mode_type, 0);
            assert.strictEqual(data.hot_water_wash_mode, 0);
            assert.strictEqual(data.station_self_fluid_2_switch, false);
            assert.strictEqual(data.slam_version_switch, false);
            assert.strictEqual(data.hot_dry_charge_plate_switch, false);
            assert.strictEqual(data.telnet_switch, false);
            assert.strictEqual(data.mop_auto_dry_switch, true);
            assert.strictEqual(data.ai_grade_avoidance_mode, false);
            assert.strictEqual(data.tail_sweep_clean_switch, true);
            assert.strictEqual(data.pound_sign_switch, true);
            assert.strictEqual(data.stationCleanFrequency, 0);
            assert.strictEqual(data.beautify_map_grade, 0);
            assert.strictEqual(data.collect_dust_mode, 2);
            assert.strictEqual(data.session_id, 1);
            assert.strictEqual(data.transaction_id, 0);
            assert.strictEqual(data.bridge_boost_switch, false);
            assert.strictEqual(data.narrow_zone_recharge_switch, false);
            assert.strictEqual(data.verification_map_switch, false);
        });

        it("parses list_maps reply", () => {
            const rawPacket = Buffer.from("aa13b800000000000003aa01200102010401005e", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, { currentMapId: 2, savedMapIds: [1] });
        });

        it("parses mop dock settings reply", () => {
            const rawPacket = Buffer.from("aa12b800000000000003aa0193000a031403d1", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                mode: 0,
                general_backwash_area: 10,
                general_cleaning_mode: 3,
                custom_backwash_area: 20,
                custom_cleaning_mode: 3,
            });
        });

        it("parses mop dock dryer settings reply", () => {
            const rawPacket = Buffer.from("aa10b800000000000003aa0194050000f1", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                mode: 5,
                time_remaining: 0
            });
        });
    });

    describe("E20 Evo Plus", () => {
        it("parses error message with error set", () => {
            const rawPacket = Buffer.from("aa0eb80000000000000aa301020387", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.strictEqual(data.error_type, 1);
            assert.strictEqual(data.error_desc, 2);
        });

        it("parses status message 0x42", () => {
            const rawPacket = Buffer.from("aa39b8000000000000044202010000080200024b00620044000001005001010000010000020100071400000000000000000002020f0000010043", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.strictEqual(data.work_status, 2);
            assert.strictEqual(data.function_type, 1);
            assert.strictEqual(data.control_type, 0);
            assert.strictEqual(data.move_direction, 0);
            assert.strictEqual(data.work_mode, 8);
            assert.strictEqual(data.fan_level, 2);
            assert.strictEqual(data.work_area, 0);
            assert.strictEqual(data.water_level, 2);
            assert.strictEqual(data.voice_level, 75);
            assert.strictEqual(data.battery_percent, 98);
            assert.strictEqual(data.work_time, 0);
            assert.strictEqual(data.has_mop, true);
            assert.strictEqual(data.has_vibrate_mop, false);
            assert.strictEqual(data.district_status, 1);
            assert.strictEqual(data.cleaning_type, 1);
            assert.strictEqual(data.vibrate_mode, "efficient");
            assert.strictEqual(data.vibrate_switch, true);
        });

        it("parses status message 0x32", () => {
            const rawPacket = Buffer.from("aa3ab8000000000001033201030100000002000163005e0001000001000001010100000100000201000014000000000000000000020f00000000e1", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.strictEqual(data.work_status, 3);
            assert.strictEqual(data.function_type, 1);
            assert.strictEqual(data.control_type, 0);
            assert.strictEqual(data.move_direction, 0);
            assert.strictEqual(data.work_mode, 0);
            assert.strictEqual(data.fan_level, 2);
            assert.strictEqual(data.work_area, 0);
            assert.strictEqual(data.water_level, 1);
            assert.strictEqual(data.voice_level, 99);
            assert.strictEqual(data.battery_percent, 94);
            assert.strictEqual(data.work_time, 0);
            assert.strictEqual(data.carpet_switch, 0);
            assert.strictEqual(data.district_status, 1);
            assert.strictEqual(data.cleaning_type, 1);
        });

        it("parses get_dnd reply", () => {
            const rawPacket = Buffer.from("aa11b80000000000000332050116000800de", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, {
                enabled: true,
                start: { hour: 22, minute: 0 },
                end: { hour: 8, minute: 0 }
            });
        });

        it("parses list_maps reply", () => {
            const rawPacket = Buffer.from("aa12b8000000000000033208010201040100f0", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            assert.deepEqual(data, { currentMapId: 2, savedMapIds: [1] });
        });
    });
});
