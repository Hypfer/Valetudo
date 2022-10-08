export const ConsumablesHelp = `
## Consumables

Consumables are components of the robot that need periodic cleaning, replacement or other maintenance work.

They come in two flavours which are basically the same
- operating hours left
- percent left

At some point, they will become depleted, requiring you to do maintenance and reset them in the Valetudo UI.
This will restore them to either their manufacturer-dependent design operating hours or 100%.

Not maintaining your consumables may lead to performance degradation.<br/>
Still, Valetudo recommends manual inspection of the part in question. You _may_ be able to use it longer than the manufacturer recommends.


To figure out which part of your robot is the consumable in question, you can hover your mouse over the remaining time/percent.
The robot part will now light up to show you where it is.


### Types of consumables

There are various types of consumables that require different treatment.

#### Brushes

Brushes come in different types such as main or side.
At some point, they are worn out and have to be replaced.

They often also require removal of tangled hair or similar for optimal performance so you should keep an eye on them.

#### Filters

Vacuum-robots usually have some kind of HEPA filter which needs periodic cleaning and replacing when it is worn out.

#### Sensors

Your robot has a few sensors such as cliff- or wall-distance-sensors, which are used for navigation and might get obstructed by dirt, debris, cobwebs or similar.
Cleaning them can usually be done with a soft cloth. Make sure to not scratch the sensors as they are vital to the robots operation.

`;
