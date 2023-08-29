---
title: Firmware Updates
category: Usage
order: 13
---

# Firmware Updates

By rooting your robot, you will lose the ability to install firmware updates directly from the vendor via OTA.
This is intentional as those would un-root your robot.
To update your robots' firmware, you will need to install a rooted version of that firmware.

Do note that just because a new firmware version is out, this does not mean that you'll be able to instantly install and use it.
With every new firmware, we need to figure out how to root and patch it to work offline.

Usually, some software updates break out patching, and thus we have to rework it.
Occasionally, the vendor might even introduce new countermeasures against us.
While unlikely, it might happen that a new firmware version turns out to not be rootable at all. Do keep that in mind.


To update your robots' firmware, simply head over to <a href="https://builder.dontvacuum.me" rel="noopener" target="_blank">the dustbuilder</a> and build a new
rooted firmware image with the version you want to install. Make sure to select the "Build for manual installation" option.

With the image built, SSH into your robot, download the tar file, extract it and install the firmware with the installation script provided inside the tar file.
The process is basically the same as the one done during the initial root. Make sure that the robot is docked during that procedure.

If your robot has multiple system partitions like most of them do, you can run that install procedure twice for good measure.
It is however not required to do that.
