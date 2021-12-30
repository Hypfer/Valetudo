export const SegmentEditHelp = `
## Segment Management

A segment is a partition of the map as decided by the robots' firmware.
Segments enable you to just clean one or more predefined areas. Most firmwares also allow naming them.

You may know them as rooms, however they don't necessarily have to be actual rooms.
There could for example be a segment, which is just the area around your dining table.

On most firmwares, the robot uses the segment data to optimize its navigation and drive the most efficient path.


You can select a segment by clicking on the triangle. Depending on your firmware, you can then split it into two or
give it a name. If you select another segment, you can also join the two to form one bigger segment if the firmware allows that.


Segment colors are determined on-the-fly by the map renderer and don't mean anything. They're simply different so that you
can distinguish them from each other. From time to time segments might also change color because one or more of its pixels changed.

### Common issues/Questions

#### I don't see any segments

You can only edit segments if there are any. If you only see a blue map then you have no segments.

Make sure that you've done a full cleanup task with the robot returning to its dock on its own without any interruption.
This is usually required for the robot to split the map into segments.

Also, some firmwares might need you to manually enable the saving of persistent maps before starting that full cleanup task.

#### I can't split a segment

Sometimes, the cutting line placement needs some wiggling to work.
It is not required to carefully place the cutting line exactly between the wall pixels. In fact, this often prevents
a successful split. Try dragging it over the whole width/height of the segment instead of just parts of it.

In some room layouts, you also might have to split a segment multiple times and then rejoin some of those parts to get 
the desired result.

#### Can I delete a segment?

No.

`;
