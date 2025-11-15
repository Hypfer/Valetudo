const BEightParser = require("../../../lib/msmart/BEightParser");
const MSmartPacket = require("../../../lib/msmart/MSmartPacket");
const should = require("should");

should.config.checkProtoEql = false;

describe("BEightParser", function () {

    describe("J15 Max Ultra", () => {
        it("Should parse active segments message with zero segments", () => {
            const rawPacket = Buffer.from("aa0eb800000000000003aa0130005c", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({
                segmentIds: []
            });
        });

        it("Should parse active segments message with segments", () => {
            const rawPacket = Buffer.from("aa13b800000000000003aa01300501020306073f", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({
                segmentIds: [1, 2, 3, 6, 7]
            });
        });

        it("Should parse DND settings event", () => {
            const rawPacket = Buffer.from("aa12b800000000000004aa01910016000800d8", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({
                enabled: false,
                start: { hour: 22, minute: 0 },
                end: { hour: 8, minute: 0 }
            });
        });

        it("Should parse Dock Position", () => {
            const rawPacket = Buffer.from("aa14b800000000000003aa01240187019001000048", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({
                valid: true,
                x: 391,
                y: 400,
                angle: 0
            });
        });
    });

    describe("J15 Pro Ultra", () => {
        it("Should parse status message", () => {
            const rawPacket = Buffer.from("aa54b800000000000003aa0101120002ff00010d73490064120100000100000100000000310001000400002e0000080000000d010100200000004b850200353a0001b7010302000202300023000038020a000100b9", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.match({
                work_status: 18,
                function_type: 0,
                control_type: 2,
                move_direction: 255,
                work_mode: 0,
                fan_level: 1,
                work_area: 13,
                water_level: 115,
                voice_level: 73,
                battery_percent: 100,
                work_time: 18,
                uv_switch: true,
                wifi_switch: false,
                voice_switch: false,
                command_source: false,
                device_error: false,
                error_type: 0,
                error_desc: 0,
                has_mop: true,
                has_vibrate_mop: false,
                carpet_switch: 0,
                district_status: undefined,
                cleaning_type: 1,
                vibrate_mode: "efficient",
                vibrate_switch: false,
                electrolyzed_water: false,
                electrolyzed_water_status: 49,
                dustDragSwitch: false,
                dustDragStatus: false,
                dustTimes: 1,
                dustedTimes: 0,
                chargeDockType: 4,
                fluid_1_ok: true,
                fluid_2_ok: true,
                dustbag_installed: true,
                dustbag_full: false,
                mopMode: 0,
                station_error_code: 0,
                station_work_status: 8,
                job_state: 0,
                whole_process_state: 0,
                continuous_clean_mode: true,
                clean_sequence_switch: false,
                child_lock_enabled: false,
                child_lock_follows_dnd: false,
                personal_clean_prefer_switch: false,
                station_inject_fluid_switch: true,
                station_inject_soft_fluid_switch: false,
                carpet_evade_switch: false,
                station_first_fast_wash_switch: false,
                pet_mode_switch: false,
                station_capability_flags: 53,
                stain_clean_switch: false,
                ai_obstacle_switch: true,
                cross_bridge_switch: false,
                camera_led_switch: true,
                map_3d_switch: true,
                ai_recognition_switch: true,
                test_mode_type: 0,
                hot_water_wash_mode: 1,
                station_self_fluid_2_switch: true,
                slam_version_switch: true,
                hot_dry_charge_plate_switch: true,
                telnet_switch: false,
                mop_auto_dry_switch: true,
                ai_grade_avoidance_mode: true,
                tail_sweep_clean_switch: false,
                pound_sign_switch: true,
                stationCleanFrequency: 1,
                beautify_map_grade: 3,
                collect_dust_mode: 2,
                session_id: 2,
                transaction_id: 2,
                bridge_boost_switch: false,
                narrow_zone_recharge_switch: true,
                verification_map_switch: true,
                wake_up_switch: true,
                ai_carpet_avoid_switch: true,
                carpet_evade_adaptive_switch: false,
                stuck_mark_switch: false,
                mop_extend_switch: true,
                zigzag_to_end_switch: false,
                remaining_area: 0,
                ai_avoidance_switch: true,
                gap_deep_cleaning_switch: true,
                furniture_legs_cleaning_switch: true,
                edge_deep_vacuum_switch: false,
                furniture_identify_switch: false,
                frequent_auto_empty: true,
                fall_detection_switch: false,
                obstacle_image_upload_switch: true,
                threshold_recognition_switch: false,
                curtain_recognition_switch: false,
                adb_switch: false,
                station_v2_switch: false,
                static_stain_recognition_switch: false,
                stairless_mode_switch: false
            });
        });
    });

    describe("J12 Ultra", () => {
        it("Should parse status message", () => {
            const rawPacket = Buffer.from("aa4cb800000000000003aa0101120002ff0a010c024b006415010000010100010000000000000100040000220000080000007c01010018000000031c000004000000d00000020001000000009e", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.match({
                work_status: 18,
                function_type: 0,
                control_type: 2,
                move_direction: 255,
                work_mode: 10,
                fan_level: 1,
                work_area: 12,
                water_level: 2,
                voice_level: 75,
                battery_percent: 100,
                work_time: 21,
                uv_switch: true,
                wifi_switch: false,
                voice_switch: false,
                command_source: false,
                device_error: false,
                error_type: 0,
                error_desc: 0,
                has_mop: true,
                has_vibrate_mop: false,
                carpet_switch: 1,
                district_status: undefined,
                cleaning_type: 1,
                vibrate_mode: "efficient",
                vibrate_switch: false,
                electrolyzed_water: false,
                electrolyzed_water_status: 0,
                dustDragSwitch: false,
                dustDragStatus: false,
                dustTimes: 1,
                dustedTimes: 0,
                chargeDockType: 4,
                fluid_1_ok: false,
                fluid_2_ok: false,
                dustbag_installed: true,
                dustbag_full: false,
                mopMode: 0,
                station_error_code: 0,
                station_work_status: 8,
                job_state: 0,
                whole_process_state: 0,
                continuous_clean_mode: true,
                clean_sequence_switch: false,
                child_lock_enabled: false,
                child_lock_follows_dnd: false,
                personal_clean_prefer_switch: false,
                station_inject_fluid_switch: false,
                station_inject_soft_fluid_switch: false,
                carpet_evade_switch: false,
                station_first_fast_wash_switch: false,
                pet_mode_switch: false,
                station_capability_flags: 4,
                stain_clean_switch: false,
                ai_obstacle_switch: false,
                cross_bridge_switch: false,
                camera_led_switch: false,
                map_3d_switch: false,
                ai_recognition_switch: false,
                test_mode_type: 0,
                hot_water_wash_mode: 0,
                station_self_fluid_2_switch: false,
                slam_version_switch: false,
                hot_dry_charge_plate_switch: false,
                telnet_switch: false,
                mop_auto_dry_switch: true,
                ai_grade_avoidance_mode: false,
                tail_sweep_clean_switch: true,
                pound_sign_switch: true,
                stationCleanFrequency: 0,
                beautify_map_grade: 0,
                collect_dust_mode: 2,
                session_id: 1,
                transaction_id: 0,
                bridge_boost_switch: false,
                narrow_zone_recharge_switch: false,
                verification_map_switch: false,
            });
        });

        it("Should parse list_maps reply", () => {
            const rawPacket = Buffer.from("aa13b800000000000003aa01200102010401005e", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({ currentMapId: 1, savedMapIds: [ 1 ] });
        });
    });

    describe("E20 Evo Plus", () => {
        it("Should parse error message with error set", () => {
            const rawPacket = Buffer.from("aa0eb80000000000000aa301020387", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.match({error_type: 1, error_desc: 2});
        });

        it("Should parse status message 0x42", () => {
            const rawPacket = Buffer.from("aa39b8000000000000044202010000080200024b00620044000001005001010000010000020100071400000000000000000002020f0000010043", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.match({
                work_status: 2,
                function_type: 1,
                control_type: 0,
                move_direction: 0,
                work_mode: 8,
                fan_level: 2,
                work_area: 0,
                water_level: 2,
                voice_level: 75,
                battery_percent: 98,
                work_time: 0,
                has_mop: true,
                has_vibrate_mop: false,
                district_status: 1,
                cleaning_type: 1,
                vibrate_mode: "efficient",
                vibrate_switch: true,
            });
        });

        it("Should parse status message 0x32", () => {
            const rawPacket = Buffer.from("aa3ab8000000000001033201030100000002000163005e0001000001000001010100000100000201000014000000000000000000020f00000000e1", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.match({
                work_status: 3,
                function_type: 1,
                control_type: 0,
                move_direction: 0,
                work_mode: 0,
                fan_level: 2,
                work_area: 0,
                water_level: 1,
                voice_level: 99,
                battery_percent: 94,
                work_time: 0,
                carpet_switch: 0,
                district_status: 1,
                cleaning_type: 1,
            });
        });

        it("Should parse get_dnd reply", () => {
            const rawPacket = Buffer.from("aa11b80000000000000332050116000800de", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({
                enabled: true,
                start: { hour: 22, minute: 0 },
                end: { hour: 8, minute: 0 }
            });
        });

        it("Should parse list_maps reply", () => {
            const rawPacket = Buffer.from("aa12b8000000000000033208010201040100f0", "hex");
            const packet = MSmartPacket.FROM_BYTES(rawPacket);

            const data = BEightParser.PARSE(packet);

            data.should.deepEqual({ currentMapId: 1, savedMapIds: [ 1 ] });
        });
    });
});
