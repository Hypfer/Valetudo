---
title: Firmware Updates
category: Usage
order: 13
---

# Firmware Updates

A rooted robot will no longer do OTA firmware updates through the vendor's cloud infrastructure.
That means that whatever rooted firmware you install during rooting will always be exactly that one.

So you won't suddenly wake up with an enshittified robot, but you also don't suddenly receive bugfixes or improvements while you sleep.

Historically speaking, at the time of writing (2026-08-23), new firmwares on supported bots only ever made those better, so you may want to actually update from time to time.
Valetudo also targets the latest firmware version available in the Dustfab, so if something does not work, make sure you're on that.

That said, it might also happen that newer firmwares aren't rootable, so don't take any reddit screenshots of vendor apps as a source of truth on what is latest. Latest supported can always exclusively be found on <a href="https://fab.valetudo.cloud" rel="noopener" target="_blank">the Dustfab</a> and may not match "latest on vendor app".

## How to update

Updating is pretty straightforward though and just more of the same.
Since rooting means installing a full rooted firmware image, updating the firmware just means installing another full rooted firmware image (but based on a newer firmware).

It is not required to go through the whole initial rooting procedure again, as a rooted firmware grants you root on the machine.
All you thus need is shell access via SSH or UART/ADB (depending on the bot).

Using that access, you build a patched firmware as an Installer package via <a href="https://fab.valetudo.cloud" rel="noopener" target="_blank">the Dustfab</a>, download it to the right location on the robot, then do the right thing to install it.

Said right location and right thing can usually be deduced from the initial rooting instructions, and will probably be something like "run the bundled install script".

If not, a `/tmp` with sufficient free space for tar + unpacked contents is probably a good guess for the former - as it is usually a `tmpfs`. If that does not exist, a large writable partition - usually `/data`, `/mnt/data` or `/userdata` - is the next best option - and will require a cleanup once you're done.

The right script to run will likely be the least specifically named bundled one with a name along the lines of `install.sh` - unless there is exceptionally strong reason to believe otherwise.


Just as with the rooting instructions, flashing a new image is a potentially dangerous process, so I need you - lucidly - in the driver seat there, as I am not going to take responsibility for you.
Therefore - and for maintenance reasons - the individual per-bot instructions cannot be duplicated here.

That said, there shouldn't be any obvious footguns. Or so I hope.

### Misc notes

Don't forget that the robot needs to be docked and charging during the install.

If your robot has multiple system partitions in an A/B configuration like most of them do, you can run that install procedure twice for good measure.
It is however not required to do that.

And, as always, peer support is usually available, so a "hey man this is confusing me. which script should I pick? I thought X, but maybe it's Y because reason Z?" is a perfectly fine question to ask - which might even lead to the docs being improved.

"Hello I am new I do not know linux I was gifted this bot. Someone tell me how to do updates" otoh.. not so much.
Don't be that guy.
