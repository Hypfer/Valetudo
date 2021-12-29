export const VirtualRestrictionEditHelp = `
## Virtual Restriction Management

Virtual restrictions are things such as virtual walls, no go areas or no mop areas, that either stop your robot
from driving somewhere all the time or just conditionally (e.g. when there's a specific attachment such as the mop attached to it).

You can use virtual restrictions to protect your fragile furniture from your robot or your fragile robot from your furniture.

Not all firmwares support all of those. Also, usually, there's a firmware-determined limit on how many virtual
restrictions you can have.


Keep in mind that while these work great most of the time, robots may sometimes forget where they are and then start
driving around not knowing anything about any of the previously configured virtual restrictions.
Make sure that they're not the only thing preventing a disaster.


Note that you won't see any map updates while editing unless you press refresh.
Therefore, don't forget to click save before refreshing and/or leaving this page to commit your changes.

`;
