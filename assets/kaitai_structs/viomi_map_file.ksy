meta:
  id: viomimap
  title: Viomi vacuum map format
  license: CC-BY-SA-4.0
  ks-version: 0.8
  endian: le
  bit-endian: le

seq:
  - id: feature_flags
    type: u4

  - id: robot_status
    type: robot_status_section
    if: feature_flags & 0b000000000000001 != 0

  - id: image
    type: map_image_section
    if: feature_flags & 0b000000000000010 != 0

  - id: history
    type: history_section
    if: feature_flags & 0b000000000000100 != 0

  - id: charger_pos
    type: charger_position_section
    if: feature_flags & 0b000000000001000 != 0

  - id: restrictions
    type: restrictions_section
    if: feature_flags & 0b000000000010000 != 0

  - id: areas
    type: clean_areas_section
    if: feature_flags & 0b000000000100000 != 0

  - id: navigate_target
    type: navigate_target_section
    if: feature_flags & 0b000000001000000 != 0

  - id: realtime_pose
    type: realtime_pose_section
    if: feature_flags & 0b000000010000000 != 0

  - id: unknown_secion_0x00000100
    type: unknown_section
    if: feature_flags & 0b000000100000000 != 0

  - id: unknown_secion_0x00000200
    type: unknown_section
    if: feature_flags & 0b000001000000000 != 0

  - id: unknown_secion_0x00000400
    type: unknown_section
    if: feature_flags & 0b000010000000000 != 0

  - id: unknown_secion_0x00000800
    type: unknown_section
    if: feature_flags & 0b000100000000000 != 0

  - id: rooms
    type: rooms_section
    if: feature_flags & 0b001000000000000 != 0

  - id: rooms_unknown1
    type: rooms_unknown1_section
    if: feature_flags & 0b010000000000000 != 0

  - id: rooms_unknown2
    type: rooms_unknown2_section
    if: feature_flags & 0b100000000000000 != 0


enums:
  pixel_type:
    0: "outside"
    1: "scan"
    10: "room_10"
    11: "room_11"
    12: "room_12"
    13: "room_13"
    14: "room_14"
    15: "room_15"
    16: "room_16"
    17: "room_17"
    18: "room_18"
    19: "room_19"
    20: "room_20"
    21: "room_21"
    22: "room_22"
    23: "room_23"
    24: "room_24"
    25: "room_25"
    26: "room_26"
    27: "room_27"
    28: "room_28"
    29: "room_29"
    30: "room_30"
    31: "room_31"
    32: "room_32"
    33: "room_33"
    34: "room_34"
    35: "room_35"
    36: "room_36"
    37: "room_37"
    38: "room_38"
    39: "room_39"
    40: "room_40"
    41: "room_41"
    42: "room_42"
    43: "room_43"
    44: "room_44"
    45: "room_45"
    46: "room_46"
    47: "room_47"
    48: "room_48"
    49: "room_49"
    50: "room_50"
    51: "room_51"
    52: "room_52"
    53: "room_53"
    54: "room_54"
    55: "room_55"
    56: "room_56"
    57: "room_57"
    58: "room_58"
    59: "room_59"
    60: "room_10_cleaned"
    61: "room_11_cleaned"
    62: "room_12_cleaned"
    63: "room_13_cleaned"
    64: "room_14_cleaned"
    65: "room_15_cleaned"
    66: "room_16_cleaned"
    67: "room_17_cleaned"
    68: "room_18_cleaned"
    69: "room_19_cleaned"
    70: "room_20_cleaned"
    71: "room_21_cleaned"
    72: "room_22_cleaned"
    73: "room_23_cleaned"
    74: "room_24_cleaned"
    75: "room_25_cleaned"
    76: "room_26_cleaned"
    77: "room_27_cleaned"
    78: "room_28_cleaned"
    79: "room_29_cleaned"
    80: "room_30_cleaned"
    81: "room_31_cleaned"
    82: "room_32_cleaned"
    83: "room_33_cleaned"
    84: "room_34_cleaned"
    85: "room_35_cleaned"
    86: "room_36_cleaned"
    87: "room_37_cleaned"
    88: "room_38_cleaned"
    89: "room_39_cleaned"
    90: "room_40_cleaned"
    91: "room_41_cleaned"
    92: "room_42_cleaned"
    93: "room_43_cleaned"
    94: "room_44_cleaned"
    95: "room_45_cleaned"
    96: "room_46_cleaned"
    97: "room_47_cleaned"
    98: "room_48_cleaned"
    99: "room_49_cleaned"
    100: "room_50_cleaned"
    101: "room_51_cleaned"
    102: "room_52_cleaned"
    103: "room_53_cleaned"
    104: "room_54_cleaned"
    105: "room_55_cleaned"
    106: "room_56_cleaned"
    107: "room_57_cleaned"
    108: "room_58_cleaned"
    109: "room_59_cleaned"
    255: "wall"

  history_position_mode:
    0: taxiing
    1: working


types:
  section_header:
    seq:
      - id: magic
        type: u4
        valid: map_id

    instances:
      map_id:
        pos: 0x4
        type: u4

  unknown_section:
    seq:
      - id: header
        type: section_header

      - id: unknown
        type: unknown_data_skip
        repeat: until
        repeat-until: _.next_header == map_id

    instances:
      map_id:
        pos: 0x4
        type: u4

  unknown_data_skip:
    seq:
      - id: unknown
        type: u1

    instances:
      next_header:
        pos: _io.pos
        type: u4

  tag_len:
    seq:
      - id: tag
        type: u8

      - id: len
        type: u4

  coordinate:
    seq:
      - id: x_crappy
        type: f4

      - id: y_crappy
        type: f4

    instances:
      x:
        value: ((20 + x_crappy) * 100).to_i

      y:
        value: (4000 - (20 + y_crappy) * 100).to_i

      is_unknown:
        value: x_crappy == 1100 or y_crappy == 1100

  coordinate_nobs:
    seq:
      - id: x_crappy
        type: f4

      - id: y_crappy
        type: f4

    instances:
      x:
        value: x_crappy.to_i
      y:
        value: (4000 - y_crappy).to_i


  area:
    seq:
      - id: vertices
        type: coordinate_nobs
        repeat: expr
        repeat-expr: 4

  line:
    seq:
      - id: p1
        type: coordinate_nobs

      - id: p2
        type: coordinate_nobs

  string:
    seq:
      - id: len
        type: u1

      - id: string
        type: str
        size: len
        encoding: UTF-8

  robot_status_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 0x28

  map_image_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 8

      - id: height
        type: u4

      - id: width
        type: u4

      - id: unk2
        size: 20

      - id: pixels
        type: u1
        enum: pixel_type
        repeat: expr
        repeat-expr: height * height
        if: height * height >= 0

  history_position:
    seq:
      - id: mode
        type: u1
        enum: history_position_mode

      - id: pos
        type: coordinate

  history_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 4

      - id: len
        type: u4

      - id: values
        type: history_position
        repeat: expr
        repeat-expr: len

  charger_position_section:
    seq:
      - id: header
        type: section_header

      - id: position
        type: coordinate

      - id: angle
        type: f4

  virtual_wall:
    seq:
      - id: line
        type: line

      - id: unk1
        size: 16


  restriction_item_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: area
        type: area

      - id: unk1
        size: 48

    instances:
      is_area:
        value: tlv.len == 4
      is_wall:
        value: tlv.len == 2

  restrictions_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 4

      - id: len
        type: u4

      - id: restrictions
        type: restriction_item_tlv
        repeat: expr
        repeat-expr: len

  area_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: area
        type: area

      - id: unk1
        size: 48

  clean_areas_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 4

      - id: len
        type: u4

      - id: areas
        type: area_tlv
        repeat: expr
        repeat-expr: len

  navigate_target_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 4

      - id: target
        type: coordinate

      # Very wild guess
      - id: angle
        type: f4

  realtime_pose_section:
    seq:
      - id: header
        type: section_header

      - id: unk1
        size: 5

      - id: pose
        type: coordinate

      # Very wild guess
      - id: angle
        type: f4

  map:
    seq:
      - id: name
        type: string

      - id: args
        type: u4

  room:
    seq:
      - id: id
        type: u1

      - id: name_len
        type: u1

      - id: name
        type: str
        size: name_len
        encoding: UTF-8

      - id: null_term
        type: u1

      - id: room_name_pos
        type: coordinate

  rooms_flag:
    seq:
      - id: room_id
        type: u1

      - id: some_flag
        type: u1

  pose_point:
    seq:
      - id: x_raw
        type: u2

      - id: y_raw
        type: u2

      - id: unk1
        type: u1

    instances:
      x:
        value: x_raw * 5
      y:
        value: 4000 - y_raw * 5

  pose:
    seq:
      - id: room_id
        type: u4

      - id: elements
        type: u4

      - id: points
        type: pose_point
        repeat: expr
        repeat-expr: elements

  rooms_section:
    seq:
      - id: header
        type: section_header

      - id: maps
        type: map
        repeat: until
        repeat-until: _.args <= 1

      - id: rooms_len
        type: u4

      - id: rooms
        type: room
        repeat: expr
        repeat-expr: rooms_len

      - id: unk1
        size: 6

  rooms_unknown1_section:
    seq:
      # TODO: reverse-engineer properly
      - id: header
        type: section_header

      - id: tag1
        type: u4

      - id: len
        type: u4

      - id: unk_room_data
        size: 92
        repeat: expr
        repeat-expr: len

      - id: unk_pose_stuff_len
        type: u4

      - id: room_flags
        type: rooms_flag
        repeat: expr
        repeat-expr: unk_pose_stuff_len

      - id: unk2
        type: unknown_data_skip
        repeat: until
        repeat-until: _.next_header == map_id

    instances:
      map_id:
        pos: 0x4
        type: u4

  rooms_unknown2_section:
    seq:
      - id: header
        type: section_header

      - id: unk_pose_stuff
        type: u8
        repeat: expr
        repeat-expr: 6
        if: map_id != 0

      - id: unk3
        size: 3
        if: map_id != 0

      - id: pose_len
        type: u4
        if: map_id != 0

      - id: pose
        type: pose
        repeat: expr
        repeat-expr: pose_len
        if: map_id != 0

    instances:
      map_id:
        pos: 0x4
        type: u4
