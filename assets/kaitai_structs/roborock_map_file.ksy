meta:
  id: roborock_map_file
  title: Roborock vacuum map format
  license: CC-BY-SA-4.0
  ks-version: 0.9
  endian: le
  bit-endian: be
seq:
  - id: magic
    contents: 'rr'
  - id: header
    type: header
  - id: blocks
    type: block
    repeat: eos
types:
  header:
    seq:
      - id: header_length
        type: u2
      - id: data_length
        type: u4
      - id: version
        type: version
      - id: map_index
        type: u4
      - id: map_sequence
        type: u4
  version:
    seq:
      - id: major
        type: u2
      - id: minor
        type: u2
  block:
    seq:
      - id: type
        type: u2
        enum: block_type
      - id: header_length
        type: u2
      - id: data_length
        type: u4
      - id: data
        size: data_length + (header_length - 8)
        type:
          switch-on: type
          cases:
            "block_type::image": image_block_data
            "block_type::charger_location": position_block_data
            "block_type::path": path_block_data
            "block_type::goto_path": path_block_data
            "block_type::goto_predicted_path": path_block_data
            "block_type::currently_cleaned_zones": dual_point_structures_block_data
            "block_type::goto_target": position_block_data
            "block_type::robot_position": position_block_data
            "block_type::no_go_zones": quad_point_structures_block_data
            "block_type::virtual_walls": dual_point_structures_block_data
            "block_type::active_segments": active_segments_block_data
            "block_type::no_mop_zones": quad_point_structures_block_data
            "block_type::digest": digest_block_data

  image_block_data:
    seq:
      - id: segment_count
        type: s4
        if: _parent.header_length == 28
      - id: top
        type: s4
      - id: left
        type: s4
      - id: height
        type: s4
      - id: width
        type: s4
      - id: pixels
        type: pixel
        repeat: eos
  pixel:
    seq:
      - id: segment_id
        type: b5
      - id: type
        enum: pixel_type
        type: b3
  position_block_data:
    seq:
      - id: x
        type: u4
      - id: y
        type: u4
      - id: angle
        type: s4
        if: _parent.data_length == 12
  path_block_data:
    seq:
      - id: point_count
        type: u4
      - id: unknown_01
        type: u4
      - id: angle
        type: s4
      - id: points
        type: point
        repeat: eos
  point:
    seq:
      - id: x
        type: u2
      - id: y
        type: u2
  dual_point_structures_block_data:
    seq:
      - id: count
        type: u4
      - id: structures
        type: dual_point_structure
        repeat: eos
  quad_point_structures_block_data:
    seq:
      - id: count
        type: u4
      - id: structures
        type: quad_point_structure
        repeat: eos
  dual_point_structure:
    seq:
      - id: x0
        type: u2
      - id: y0
        type: u2
      - id: x1
        type: u2
      - id: x2
        type: u2
  quad_point_structure:
    seq:
      - id: x0
        type: u2
      - id: y0
        type: u2
      - id: x1
        type: u2
      - id: x2
        type: u2
      - id: x3
        type: u2
      - id: y3
        type: u2
      - id: x4
        type: u2
      - id: y4
        type: u2
  active_segments_block_data:
    seq:
      - id: count
        type: u4
      - id: segment_ids
        type: u1
        repeat: eos
  digest_block_data:
    seq:
      - id: hash
        size: 12
      - id: unknown
        size: (_parent.data_length - 12)

enums:
  block_type:
    1: "charger_location"
    2: "image"
    3: "path"
    4: "goto_path"
    5: "goto_predicted_path"
    6: "currently_cleaned_zones"
    7: "goto_target"
    8: "robot_position"
    9: "no_go_zones"
    10: "virtual_walls"
    11: "active_segments"
    12: "no_mop_zones"
    1024: "digest"
  pixel_type:
    0: "none"
    1: "wall"
    2: "floor"
    3: "floor"
    4: "floor"
    5: "floor"
    6: "floor"
    7: "floor"

