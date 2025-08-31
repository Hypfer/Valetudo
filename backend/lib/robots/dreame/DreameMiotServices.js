module.exports = {
    //https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:dreame-mc1808:1
    "1C": Object.freeze({
        ERROR: {
            SIID: 22,
            PROPERTIES: {
                CODE: {
                    PIID: 1
                }
            }
        },
        VACUUM_2: {
            SIID: 18,
            PROPERTIES: {
                MODE: {
                    PIID: 1
                },
                FAN_SPEED: {
                    PIID: 6
                },
                WATER_USAGE: {
                    PIID: 20
                },
                WATER_TANK_ATTACHMENT: {
                    PIID: 9
                },
                TASK_STATUS: {
                    PIID: 18 // if robot has a task: value = 0
                },
                ADDITIONAL_CLEANUP_PROPERTIES: {
                    PIID: 21
                },
                PERSISTENT_MAPS: {
                    PIID: 23
                },

                CURRENT_STATISTICS_TIME: {
                    PIID: 2
                },
                CURRENT_STATISTICS_AREA: {
                    PIID: 3
                },

                TOTAL_STATISTICS_TIME: {
                    PIID: 13
                },
                TOTAL_STATISTICS_COUNT: {
                    PIID: 14
                },
                TOTAL_STATISTICS_AREA: {
                    PIID: 15
                }
            },
            ACTIONS: {
                START: {
                    AIID: 1
                },
                PAUSE: {
                    AIID: 2
                }
            }
        },
        MANUAL_CONTROL: {
            SIID: 21,
            PROPERTIES: {
                ANGLE: {
                    PIID: 1
                },
                VELOCITY: {
                    PIID: 2
                }
            },
            ACTIONS: {
                MOVE: { // first MOVE action will "start" manual control
                    AIID: 1
                },
                STOP: {
                    AIID: 2
                }
            }
        },
        BATTERY: {
            SIID: 2,
            PROPERTIES: {
                LEVEL: {
                    PIID: 1
                },
                CHARGING: {
                    PIID: 2
                }
            },
            ACTIONS: {
                START_CHARGE: {
                    AIID: 1
                }
            }
        },
        LOCATE: {
            SIID: 17,
            ACTIONS: {
                LOCATE: {
                    AIID: 1
                },
                VOLUME_TEST: {
                    AIID: 3
                }
            }
        },
        VOICE: {
            SIID: 24,
            PROPERTIES: {
                VOLUME: {
                    PIID: 1
                },
                ACTIVE_VOICEPACK: {
                    PIID: 3
                },
                URL: {
                    PIID: 4
                },
                HASH: {
                    PIID: 5
                },
                SIZE: {
                    PIID: 6
                }
            },
            ACTIONS: {
                DOWNLOAD_VOICEPACK: {
                    AIID: 2
                }
            }
        },
        AUDIO: {
            SIID: 7,
            PROPERTIES: {
                VOLUME: {
                    PIID: 1
                }
            },
            ACTIONS: {
                VOLUME_TEST: {
                    AIID: 3
                }
            }
        },
        MAIN_BRUSH: {
            SIID: 26,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 1
                },
                PERCENT_LEFT: {
                    PIID: 2
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        SIDE_BRUSH: {
            SIID: 28,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 1
                },
                PERCENT_LEFT: {
                    PIID: 2
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        FILTER: {
            SIID: 27,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1 //It's only swapped for the filter for some reason..
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },


        MAP: {
            SIID: 23,
            PROPERTIES: {
                MAP_DATA: {
                    PIID: 1
                },
                FRAME_TYPE: { //Can be char I or P (numbers)
                    PIID: 2
                },
                CLOUD_FILE_NAME: {
                    PIID: 3
                },
                MAP_DETAILS: {
                    PIID: 4
                },

                ACTION_RESULT: {
                    PIID: 6
                }
            },
            ACTIONS: {
                POLL: {
                    AIID: 1
                },
                EDIT: {
                    AIID: 2
                }
            }
        }
    }),

    //This is taken from the D9 and Z10 Pro MIOT spec but it applies to many more
    //https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:dreame-p2009:1
    "GEN2":  Object.freeze({
        DEVICE: {
            SIID: 1,
            PROPERTIES: {
                SERIAL_NUMBER: {
                    PIID: 5
                }
            }
        },
        VACUUM_1: {
            SIID: 2,
            PROPERTIES: {
                STATUS: {
                    PIID: 1
                },
                ERROR: {
                    PIID: 2
                }
            },
            ACTIONS: {
                RESUME: {
                    AIID: 1
                },
                PAUSE: {
                    AIID: 2
                }
            }
        },
        VACUUM_2: {
            SIID: 4,
            PROPERTIES: {
                MODE: {
                    PIID: 1
                },
                CLEANING_TIME: {
                    PIID: 2
                },
                CLEANING_AREA: {
                    PIID: 3
                },
                FAN_SPEED: {
                    PIID: 4
                },
                WATER_USAGE: {
                    PIID: 5
                },
                WATER_TANK_ATTACHMENT: {
                    PIID: 6
                },
                TASK_STATUS: {
                    PIID: 7
                },
                STATE_CHANGE_TIMESTAMP: {
                    PIID: 8 //Value is a unix timestamp
                },
                UNKNOWN_01: { //likely irrelevant
                    PIID: 9
                },
                ADDITIONAL_CLEANUP_PROPERTIES: {
                    PIID: 10
                },
                POST_CHARGE_CONTINUE: {
                    PIID: 11
                },
                CARPET_MODE: {
                    PIID: 12
                },
                MANUAL_CONTROL: {
                    PIID: 15
                },
                ERROR_CODE: {
                    PIID: 18
                },
                LOCATING_STATUS: {
                    PIID: 20
                    /*
                        Observed values:
                        0 - knows where it is in its map
                        1 - Trys to locate itself in its map
                        10 - fails to locate itself in its map
                        11 - successfully located itself in its map
                     */
                },
                OBSTACLE_AVOIDANCE: {
                    PIID: 21
                },
                AI_CAMERA_SETTINGS: {
                    PIID: 22
                },
                MOP_DOCK_SETTINGS: {
                    PIID: 23
                },
                MOP_DOCK_STATUS: {
                    PIID: 25
                },
                KEY_LOCK: {
                    PIID: 27
                },
                CARPET_MODE_SENSITIVITY: {
                    PIID: 28
                },
                TIGHT_MOP_PATTERN: {
                    PIID: 29
                },
                MOP_DOCK_UV_TREATMENT: {
                    PIID: 32
                },
                CARPET_DETECTION_SENSOR: {
                    PIID: 33
                },
                MOP_DOCK_WET_DRY_SWITCH: {
                    PIID: 34
                },
                CARPET_DETECTION_SENSOR_MODE: {
                    PIID: 36
                },
                MOP_DOCK_DETERGENT: {
                    PIID: 37
                },
                MOP_DRYING_TIME: {
                    PIID: 40
                },
                MOP_DETACH: {
                    PIID: 45
                },
                MOP_DOCK_WATER_USAGE: {
                    PIID: 46
                },
                MISC_TUNABLES: {
                    PIID: 50
                }
            },
            ACTIONS: {
                START: {
                    AIID: 1
                },
                STOP: {
                    AIID: 2
                },
                MOP_DOCK_INTERACT: {
                    AIID: 4
                }
            }
        },
        BATTERY: {
            SIID: 3,
            PROPERTIES: {
                LEVEL: {
                    PIID: 1
                },
                CHARGING: {
                    PIID: 2
                }
            },
            ACTIONS: {
                START_CHARGE: {
                    AIID: 1
                }
            }
        },
        DND: {
            SIID: 5,
            PROPERTIES: {
                ENABLED: {
                    PIID: 1
                },
                START_TIME: {
                    PIID: 2
                },
                END_TIME: {
                    PIID: 3
                }
            }
        },
        AUDIO: {
            SIID: 7,
            PROPERTIES: {
                VOLUME: {
                    PIID: 1
                },
                ACTIVE_VOICEPACK: {
                    PIID: 2
                },
                VOICEPACK_INSTALL_STATUS: {
                    PIID: 3
                },
                INSTALL_VOICEPACK: {
                    PIID: 4
                }
            },
            ACTIONS: {
                LOCATE: {
                    AIID: 1
                },
                VOLUME_TEST: {
                    AIID: 2
                }
            }
        },
        MAIN_BRUSH: {
            SIID: 9,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 1
                },
                PERCENT_LEFT: {
                    PIID: 2
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        SIDE_BRUSH: {
            SIID: 10,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 1
                },
                PERCENT_LEFT: {
                    PIID: 2
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        FILTER: {
            SIID: 11,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1 //It's only swapped for the filter for some reason..
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        SENSOR: {
            SIID: 16,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        SECONDARY_FILTER: {
            SIID: 17,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        MOP: {
            SIID: 18,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        SILVER_ION: {
            SIID: 19,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        DETERGENT: {
            SIID: 20,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 2
                },
                PERCENT_LEFT: {
                    PIID: 1
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
        MAP: {
            SIID: 6,
            PROPERTIES: {
                MAP_DATA: {
                    PIID: 1
                },
                FRAME_TYPE: { //Can be char I or P (numbers)
                    PIID: 2
                },
                CLOUD_FILE_NAME: {
                    PIID: 3
                },
                MAP_DETAILS: {
                    PIID: 4
                },

                ACTION_RESULT: {
                    PIID: 6
                }
            },
            ACTIONS: {
                POLL: {
                    AIID: 1
                },
                EDIT: {
                    AIID: 2
                }
            }
        },
        PERSISTENT_MAPS: {
            SIID: 13,
            PROPERTIES: {
                ENABLED: {
                    PIID: 1
                }
            }
        },
        TOTAL_STATISTICS: {
            SIID: 12,
            PROPERTIES: {
                TIME: {
                    PIID: 2
                },
                COUNT: {
                    PIID: 3
                },
                AREA: {
                    PIID: 4
                }
            }
        },
        AUTO_EMPTY_DOCK: {
            SIID: 15,
            PROPERTIES: {
                AUTO_EMPTY_ENABLED: {
                    PIID: 1
                },
                INTERVAL: {
                    PIID: 2
                },
                STATUS: {
                    PIID: 3 //Whether or not it's currently able to execute the empty action?
                },
                STATE: {
                    PIID: 5 //1 = currently cleaning, 0 = not currently cleaning
                }
            },
            ACTIONS: {
                EMPTY_DUSTBIN: {
                    AIID: 1
                }
            }
        },
        TIMERS: {
            SIID: 8
        },
        MOP_EXPANSION: {
            SIID: 28,
            PROPERTIES: {
                HIGH_RES_WATER_USAGE: {
                    PIID: 1
                },
                HIGH_RES_MOP_DOCK_HEATER: {
                    PIID: 8
                },
                SIDE_BRUSH_ON_CARPET: {
                    PIID: 29
                }
            }
        },
        MISC_STATES: {
            SIID: 27,
            PROPERTIES: {
                DOCK_FRESHWATER_TANK_ATTACHMENT: {
                    PIID: 1
                },
                DOCK_WASTEWATER_TANK_ATTACHMENT: {
                    PIID: 2
                },
                DOCK_DUSTBAG_ATTACHMENT: {
                    PIID: 3
                },
                DOCK_DETERGENT_ATTACHMENT: {
                    PIID: 4
                }
            }
        },
        WHEEL: {
            SIID: 30,
            PROPERTIES: {
                TIME_LEFT: { //Hours
                    PIID: 1
                },
                PERCENT_LEFT: {
                    PIID: 2
                }
            },
            ACTIONS: {
                RESET: {
                    AIID: 1
                }
            }
        },
    })
};
