
export const TimersHelp = `
## Timers

Timers allow you to execute a task at a specified time (UTC).<br/>
To operate, they require the system time to be synced using the NTP-Client built into Valetudo.
If that is disabled or unable to reach the configured NTP server, no timers will be executed.

**Please note that timers are evaluated and stored as UTC. They are only displayed in your current browser timezone
for your convenience.**

**If your country/state is taking part in that nonsensical Daylight Saving Time cult, you will have to
manually shift the timers back and forth each time you switch from and to DST.**


Timers in Valetudo are provided as a convenience feature.<br/>
It is **highly recommended** to deploy a full-scale home automation system such as openHAB or Home Assistant to allow for
better scheduled operation taking into account e.g. whether or not a room is currently occupied, you're currently on vacation etc.

`;
