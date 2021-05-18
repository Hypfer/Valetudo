meta:
  id: dreame_map_file
  title: Dreame vacuum map format
  license: CC-BY-SA-4.0
  ks-version: 0.9
  endian: le
  bit-endian: be
seq:
  - id: header
    size: 27
    type: header
  - id: image_data
    type:
      switch-on: header.id
      cases:
        0: rism_image_data
        _: regular_image_data
    size: header.width * header.height
  - id: additional_data
    type: str
    encoding: UTF8
    size-eos: true

types:
  header:
    seq:
      - id: id
        type: s2
      - id: frame_id
        type: s2
      - id: frame_type
        type: s1
        doc: May either be ascii I or P
      - id: robot_position
        type: position
      - id: charger_position
        type: position
      - id: pixel_size
        type: s2
        doc: In millimeters
      - id: width
        type: s2
      - id: height
        type: s2
      - id: left
        type: s2
      - id: top
        type: s2
  position:
    seq:
      - id: x
        type: s2
      - id: y
        type: s2
      - id: angle
        type: s2
  regular_image_data:
    seq:
      - id: pixel
        type: regular_pixel
        repeat: eos
  rism_image_data:
    seq:
      - id: pixel
        type: rism_pixel
        repeat: eos
  regular_pixel:
    seq:
      - id: segment_id
        type: b6
      - id: type
        enum: regular_pixel_type
        type: b2
  rism_pixel:
    seq:
      - id: is_wall_flag
        type: b1
      - id: segment_id
        type: b7
enums:
  regular_pixel_type:
    0: "none"
    1: "floor"
    2: "wall"
