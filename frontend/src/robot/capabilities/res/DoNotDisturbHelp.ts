export const DoNotDisturbHelp = `
## Do not disturb

Some firmwares allow you to define a do not disturb period where certain features of the robot are disabled.
What exactly changes may differ based on robot vendor, model and firmware version.

For example, the robot might not continue a partially finished task which has been interrupted due to the
robot having to charge.
As charging back up to 100% battery may take a few hours, it could happen that the robot attempts to continue cleaning
at 3am, which is often considered undesirable.

Another thing that can be affected by the DND setting is the auto empty dock as those are usually pretty loud.


**Please note that DND times are evaluated and stored as UTC. They are only displayed in your current browser timezone
for your convenience.**
`;
