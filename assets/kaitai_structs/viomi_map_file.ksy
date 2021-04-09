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

  - id: map_id
    type: u4

  - id: robot_status
    size: 0x28
    if: feature_flags & 0b000000000000001 != 0

  - id: image
    type: map_image_tlv
    if: feature_flags & 0b000000000000010 != 0

  - id: history
    type: history_tlv
    if: feature_flags & 0b000000000000100 != 0

  - id: charger_pos
    type: charger_position
    if: feature_flags & 0b000000000001000 != 0

  - id: restrictions
    type: restrictions_tlv
    if: feature_flags & 0b000000000010000 != 0

  - id: areas
    type: clean_areas_tlv
    if: feature_flags & 0b000000000100000 != 0

  - id: navigate_target
    type: navigate_target
    if: feature_flags & 0b000000001000000 != 0

  - id: realtime_pose
    type: realtime_pose
    if: feature_flags & 0b000000010000000 != 0

  - id: rooms
    type: rooms_tlv
    if: feature_flags & 0b000100000000000 != 0


types:
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

  map_image_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: height
        type: u4

      - id: width
        type: u4

      - id: unk2
        size: 20

      - id: pixels
        size: height * height
        if: height * height >= 0

  history_position:
    seq:
      - id: unk1
        size: 1

      - id: pos
        type: coordinate

  history_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: values
        type: history_position
        repeat: expr
        repeat-expr: tlv.len

  charger_position:
    seq:
      - id: unk1
        type: u4

      - id: position
        type: coordinate

      - id: orientation
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

  restrictions_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: restrictions
        type: restriction_item_tlv
        repeat: expr
        repeat-expr: tlv.len

  area_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: area
        type: area

      - id: unk1
        size: 48

  clean_areas_tlv:
    seq:
      - id: tlv
        type: tag_len

      - id: areas
        type: area_tlv
        repeat: expr
        repeat-expr: tlv.len

  navigate_target:
    seq:
      - id: unk1
        type: u8

      - id: target
        type: coordinate

      - id: unk2
        type: u4

  realtime_pose:
    seq:
      - id: unk1
        size: 9

      - id: pose
        type: coordinate

      - id: unk2
        type: u4

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

      - id: unk1
        type: u8

  # TODO: reverse-engineer properly
  rooms2:
    seq:
      - id: first_b_of_tag
        type: u1

      - id: rest_of_tag
        size: 3

      - id: tag1
        type: u4

      - id: len
        type: u4

      - id: unk_room_data
        size: 92
        repeat: expr
        repeat-expr: len

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

  rooms_tlv:
    seq:
      # It actually doesn't seem to be TLV but whatever
      - id: not_a_tlv
        type: tag_len

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

      - id: rooms2
        type: rooms2
        #if: rooms_len != 0

      - id: unk_pose_stuff_len
        type: u4

      - id: room_flags
        type: rooms_flag
        repeat: expr
        repeat-expr: unk_pose_stuff_len

      # Hack - I wasn't able to understand this structure, it has a variable length that seems grow together with the
      # number of segments, but not linearly, exponentially or anything else.
      # This simply tries to eat up as many bytes until the start of the known tag value is found. Note that the tag
      # varies from vacuum to vacuum
      - id: unk2
        type: u1
        repeat: until
        repeat-until: _ == rooms2.first_b_of_tag

      - id: some_header_ignore
        size: 3

      - id: unk_pose_stuff
        type: u8
        repeat: expr
        repeat-expr: 6

      - id: unk3
        size: 3

      - id: pose_len
        type: u4

      - id: pose
        type: pose
        repeat: expr
        repeat-expr: pose_len

