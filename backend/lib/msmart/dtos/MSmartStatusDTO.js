const MSmartDTO = require("./MSmartDTO");

class MSmartStatusDTO extends MSmartDTO {
    /**
     * @param {object} data
     * @param {number} [data.work_status]
     * @param {number} [data.function_type]
     * @param {number} [data.control_type]
     * @param {number} [data.move_direction]
     * @param {number} [data.work_mode]
     * @param {number} [data.fan_level]
     * @param {number} [data.work_area]
     * @param {number} [data.water_level]
     * @param {number} [data.voice_level]
     * @param {number} [data.battery_percent]
     * @param {number} [data.work_time]
     * @param {boolean} [data.uv_switch] - TODO: VALIDATE
     * @param {boolean} [data.wifi_switch] - TODO: VALIDATE
     * @param {boolean} [data.voice_switch] - TODO: VALIDATE
     * @param {boolean} [data.command_source] - TODO: VALIDATE
     * @param {boolean} [data.device_error] - TODO: VALIDATE
     * @param {number} [data.error_type]
     * @param {number} [data.error_desc]
     * @param {boolean} [data.has_mop]
     * @param {boolean} [data.has_vibrate_mop]
     * @param {number} [data.carpet_switch]
     * @param {number} [data.district_status]
     * @param {number} [data.cleaning_type]
     * @param {string} [data.vibrate_mode]
     * @param {boolean} [data.vibrate_switch]
     * @param {boolean} [data.electrolyzed_water]
     * @param {number} [data.electrolyzed_water_status]
     * @param {boolean} [data.dustDragSwitch]
     * @param {boolean} [data.dustDragStatus]
     * @param {number} [data.dustTimes]
     * @param {number} [data.dustedTimes]
     * @param {number} [data.chargeDockType]
     * @param {boolean} [data.fluid_1_ok]
     * @param {boolean} [data.fluid_2_ok]
     * @param {boolean} [data.dustbag_installed]
     * @param {boolean} [data.dustbag_full]
     * @param {number} [data.mopMode]
     * @param {number} [data.station_error_code]
     * @param {number} [data.station_work_status]
     * @param {number} [data.job_state]
     * @param {number} [data.whole_process_state]
     * @param {boolean} [data.continuous_clean_mode]
     * @param {boolean} [data.clean_sequence_switch]
     * @param {boolean} [data.child_lock_enabled]
     * @param {boolean} [data.child_lock_follows_dnd]
     * @param {boolean} [data.personal_clean_prefer_switch]
     * @param {boolean} [data.station_inject_fluid_switch]
     * @param {boolean} [data.station_inject_soft_fluid_switch]
     * @param {boolean} [data.carpet_evade_switch]
     * @param {boolean} [data.station_first_fast_wash_switch]
     * @param {boolean} [data.pet_mode_switch]
     * @param {number} [data.station_capability_flags]
     * @param {boolean} [data.stain_clean_switch]
     * @param {boolean} [data.ai_obstacle_switch]
     * @param {boolean} [data.cross_bridge_switch]
     * @param {boolean} [data.camera_led_switch]
     * @param {boolean} [data.map_3d_switch]
     * @param {boolean} [data.ai_recognition_switch]
     * @param {number} [data.test_mode_type]
     * @param {number} [data.hot_water_wash_mode]
     * @param {boolean} [data.station_self_fluid_2_switch]
     * @param {boolean} [data.slam_version_switch]
     * @param {boolean} [data.hot_dry_charge_plate_switch]
     * @param {boolean} [data.telnet_switch]
     * @param {boolean} [data.mop_auto_dry_switch]
     * @param {boolean} [data.ai_grade_avoidance_mode]
     * @param {boolean} [data.tail_sweep_clean_switch]
     * @param {boolean} [data.pound_sign_switch]
     * @param {number} [data.stationCleanFrequency]
     * @param {number} [data.beautify_map_grade]
     * @param {number} [data.collect_dust_mode]
     * @param {number} [data.session_id]
     * @param {number} [data.transaction_id]
     * @param {boolean} [data.bridge_boost_switch]
     * @param {boolean} [data.narrow_zone_recharge_switch]
     * @param {boolean} [data.verification_map_switch]
     * @param {boolean} [data.wake_up_switch]
     * @param {boolean} [data.ai_carpet_avoid_switch]
     * @param {boolean} [data.carpet_evade_adaptive_switch]
     * @param {boolean} [data.stuck_mark_switch]
     * @param {boolean} [data.mop_extend_switch]
     * @param {boolean} [data.zigzag_to_end_switch]
     * @param {number} [data.remaining_area]
     * @param {boolean} [data.ai_avoidance_switch]
     * @param {boolean} [data.gap_deep_cleaning_switch]
     * @param {boolean} [data.furniture_legs_cleaning_switch]
     * @param {boolean} [data.edge_deep_vacuum_switch]
     * @param {boolean} [data.furniture_identify_switch]
     * @param {boolean} [data.frequent_auto_empty]
     * @param {boolean} [data.fall_detection_switch]
     * @param {boolean} [data.obstacle_image_upload_switch]
     * @param {boolean} [data.threshold_recognition_switch]
     * @param {boolean} [data.curtain_recognition_switch]
     * @param {boolean} [data.adb_switch]
     * @param {boolean} [data.station_v2_switch]
     * @param {boolean} [data.static_stain_recognition_switch]
     * @param {boolean} [data.stairless_mode_switch]
     */
    constructor(data) {
        super();

        this.work_status = data.work_status;
        this.function_type = data.function_type;
        this.control_type = data.control_type;
        this.move_direction = data.move_direction;
        this.work_mode = data.work_mode;
        this.fan_level = data.fan_level;
        this.work_area = data.work_area;
        this.water_level = data.water_level;
        this.voice_level = data.voice_level;
        this.battery_percent = data.battery_percent;
        this.work_time = data.work_time;
        this.uv_switch = data.uv_switch;
        this.wifi_switch = data.wifi_switch;
        this.voice_switch = data.voice_switch;
        this.command_source = data.command_source;
        this.device_error = data.device_error;
        this.error_type = data.error_type;
        this.error_desc = data.error_desc;
        this.has_mop = data.has_mop;
        this.has_vibrate_mop = data.has_vibrate_mop;
        this.carpet_switch = data.carpet_switch;
        this.district_status = data.district_status;
        this.cleaning_type = data.cleaning_type;
        this.vibrate_mode = data.vibrate_mode;
        this.vibrate_switch = data.vibrate_switch;
        this.electrolyzed_water = data.electrolyzed_water;
        this.electrolyzed_water_status = data.electrolyzed_water_status;
        this.dustDragSwitch = data.dustDragSwitch;
        this.dustDragStatus = data.dustDragStatus;
        this.dustTimes = data.dustTimes;
        this.dustedTimes = data.dustedTimes;
        this.chargeDockType = data.chargeDockType;
        this.fluid_1_ok = data.fluid_1_ok;
        this.fluid_2_ok = data.fluid_2_ok;
        this.dustbag_installed = data.dustbag_installed;
        this.dustbag_full = data.dustbag_full;
        this.mopMode = data.mopMode;
        this.station_error_code = data.station_error_code;
        this.station_work_status = data.station_work_status;
        this.job_state = data.job_state;
        this.whole_process_state = data.whole_process_state;
        this.continuous_clean_mode = data.continuous_clean_mode;
        this.clean_sequence_switch = data.clean_sequence_switch;
        this.child_lock_enabled = data.child_lock_enabled;
        this.child_lock_follows_dnd = data.child_lock_follows_dnd;
        this.personal_clean_prefer_switch = data.personal_clean_prefer_switch;
        this.station_inject_fluid_switch = data.station_inject_fluid_switch;
        this.station_inject_soft_fluid_switch = data.station_inject_soft_fluid_switch;
        this.carpet_evade_switch = data.carpet_evade_switch;
        this.station_first_fast_wash_switch = data.station_first_fast_wash_switch;
        this.pet_mode_switch = data.pet_mode_switch;
        this.station_capability_flags = data.station_capability_flags;
        this.stain_clean_switch = data.stain_clean_switch;
        this.ai_obstacle_switch = data.ai_obstacle_switch;
        this.cross_bridge_switch = data.cross_bridge_switch;
        this.camera_led_switch = data.camera_led_switch;
        this.map_3d_switch = data.map_3d_switch;
        this.ai_recognition_switch = data.ai_recognition_switch;
        this.test_mode_type = data.test_mode_type;
        this.hot_water_wash_mode = data.hot_water_wash_mode;
        this.station_self_fluid_2_switch = data.station_self_fluid_2_switch;
        this.slam_version_switch = data.slam_version_switch;
        this.hot_dry_charge_plate_switch = data.hot_dry_charge_plate_switch;
        this.telnet_switch = data.telnet_switch;
        this.mop_auto_dry_switch = data.mop_auto_dry_switch;
        this.ai_grade_avoidance_mode = data.ai_grade_avoidance_mode;
        this.tail_sweep_clean_switch = data.tail_sweep_clean_switch;
        this.pound_sign_switch = data.pound_sign_switch;
        this.stationCleanFrequency = data.stationCleanFrequency;
        this.beautify_map_grade = data.beautify_map_grade;
        this.collect_dust_mode = data.collect_dust_mode;
        this.session_id = data.session_id;
        this.transaction_id = data.transaction_id;
        this.bridge_boost_switch = data.bridge_boost_switch;
        this.narrow_zone_recharge_switch = data.narrow_zone_recharge_switch;
        this.verification_map_switch = data.verification_map_switch;
        this.wake_up_switch = data.wake_up_switch;
        this.ai_carpet_avoid_switch = data.ai_carpet_avoid_switch;
        this.carpet_evade_adaptive_switch = data.carpet_evade_adaptive_switch;
        this.stuck_mark_switch = data.stuck_mark_switch;
        this.mop_extend_switch = data.mop_extend_switch;
        this.zigzag_to_end_switch = data.zigzag_to_end_switch;
        this.remaining_area = data.remaining_area;
        this.ai_avoidance_switch = data.ai_avoidance_switch;
        this.gap_deep_cleaning_switch = data.gap_deep_cleaning_switch;
        this.furniture_legs_cleaning_switch = data.furniture_legs_cleaning_switch;
        this.edge_deep_vacuum_switch = data.edge_deep_vacuum_switch;
        this.furniture_identify_switch = data.furniture_identify_switch;
        this.frequent_auto_empty = data.frequent_auto_empty;
        this.fall_detection_switch = data.fall_detection_switch;
        this.obstacle_image_upload_switch = data.obstacle_image_upload_switch;
        this.threshold_recognition_switch = data.threshold_recognition_switch;
        this.curtain_recognition_switch = data.curtain_recognition_switch;
        this.adb_switch = data.adb_switch;
        this.station_v2_switch = data.station_v2_switch;
        this.static_stain_recognition_switch = data.static_stain_recognition_switch;
        this.stairless_mode_switch = data.stairless_mode_switch;

        Object.freeze(this);
    }
}

module.exports = MSmartStatusDTO;
