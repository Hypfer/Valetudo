---
title: FAQ
category: Misc
order: 30
---
# Frequently asked questions

## Why the name?

Valetudo is the roman name for the greek goddess Hygieia, which is the goddess of health, cleanliness and hygiene.
Also, I'm bad at naming things.

## Why Javascript? <a name="why-js"></a>

Because it has become a nice programming language that runs everywhere and can do almost anything.
It is also pretty hard to do something so wrong with JS that you get a Segfault and/or an RCE vulnerability.

I strongly encourage you to drop that stale "haha js dumb please like me fellow IT peoples" meme and check out the
most recent iteration of the language for yourself. You will be pleasantly surprised if you give it a chance.

## Are there still random factory resets? <a name="random-factory-resets"></a>

No. We know what caused them, and it's not happening anymore.

To add some context:<br/>
Roborock V1 and Roborock S5 up to firmware version 1898 hat an issue with random factory resets.
This only applies to these two models of vacuum robot. Nothing else.

Those resets were caused by the watchdog of the firmware sometimes noticing that there was less free ram than expected, due to
Valetudo running on the vacuum. This set a "broken" flag for the partition and if on the daily reboot both system A and B were flagged,
the robot would reset itself to factory defaults.

This isn't happening anymore on the S5 FW 2008+ due to roborock having optimized their software quite significantly
so that they could manufacture the S5 Max with only 256MB RAM as opposed to the 512MB on the S5.

However, we've also found a mitigation, which prevents this issue from appearing on the V1, which hasn't yet received the
new and memory-optimized roborock firmware code.

If you build your firmware with the fix reset option (on by default), it will contain a script that on each reboot checks
both System A and System B for the "broken" flag and unsets that.

Therefore, it will never have two "broken" flags, unless stuff is _actually_ broken.

## Where do I configure the Timezone?

The timezone on the device **cannot** be changed. It is always UTC.

Every feature in Valetudo that uses time will automatically use the local time reported by your browser. This means you do not have to worry about it. It is handled by the application itself.

The only instance where the time is relevant, is when looking at the Valetudo logs, which are in UTC (as mentioned above).

On the other hand, when travelling abroad, please be aware that the local time will be different than where the robot is hosted. Keep this in mind.
