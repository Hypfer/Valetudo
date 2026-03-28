---
title: Rooting Essentials
category: General
order: 12
---
# Rooting Essentials

This page contains a general overview of vacuum robot rooting.

To find the correct rooting instructions for your specific model of robot, check out the [supported robot](https://valetudo.cloud/pages/general/supported-robots.html) page.

## Requirements

### Skills

Rooting robots is an advanced topic the same way working on a car, your electrical installation or any complex machinery is.
All these things require prior knowledge before attempting to do them or else they may fail catastrophically killing you and/or other people in the process.

While messing up the robot root procedure likely won't harm you, it may still cause a **permanently bricked robot** or
at least annoy the people supporting other Valetudo users in their free time.

Thus, to safely root your robot and install Valetudo, you will need prior knowledge in:
- GNU+Linux-based operating systems
- usage of a text-based shell (the Terminal)
- an understanding of how networks work, what an IP address is, what a webserver is, etc.
- and more.

If you don't know these and don't want to research them yourself, consider asking a friend, relative, colleague or your
nearest computer repair shop for help as teaching these basics is beyond the scope of the Valetudo docs.

It's also not feasible to explain every piece of knowledge required in the Valetudo docs, since different people
might start with different knowledge and therefore would require different information.
We can't mirror half of Wikipedia here.


### Software

Valetudo rooting instructions are written in a way that just works™ **if** you recreate the setup used for determining them.
Because of that, I try to use **Debian** on **x86** for everything (as opposed to e.g. Windows on Itanium), as Debian is literally free as both freedom and free beer and there is probably no place on earth where you can't get an x86 machine.

You don't necessarily have to install it. Booting from a live USB/DVD will usually be sufficient.
You can also use any other linux distribution, however, support will only be provided for the exact setup I have personally tested.

Generally speaking, if you plan on doing any sort of hardware hacking whatsoever, you should own some kind of x86 machine that has been made somewhere in the last 20 years.
If you can afford apple silicon, you can also afford a used 50€ Thinkpad from 2012. You also will absolutely have some drawer space for it.

## General high-level notes on rooting

Because understanding what you're doing and why you're doing it is desirable in a world full of overly complex black boxes
that almost no one even bothers to understand (e.g. k8s), here's a short overview on how vacuum robot rooting works.

While the exact procedures vary greatly based on the device in question, the general ideas behind the different rooting methods is always the same.

Please note that this overview is greatly oversimplified and mostly describes what you - the user - does during rooting.
There's much more to the whole process of rooting a previously unknown vacuum robot.
Figuring out each of these (and more!) steps does take a very long time and tons of work.

### 1. Gain write access to the system storage

First, we need some way of writing to the system storage.
Most of the time this means getting a root shell on the vendor firmware either through exploits or backdoors or similar.
Sometimes, there can also be a SoC bootrom that allow such kind of write access independent of the OS.

As a last resort, it's also sometimes possible to desolder the storage chip entirely and program it outside of the system.
That is of course very advanced and something that most people can't do.

During research for a new root, the challenging parts here are usually stuff such as encryption, signed filesystems,
signed executables, finding vulnerabilities/exploits, getting them to work reliably and easy to use etc.

### 2. Achieve persistence

Once we have a way to write to the system storage, we can leverage that to open up easier ways of getting to that point.

This usually means setting up something that exploits a vulnerability on startup, changing the root password to something known,
spawning a (password-less) shell on some UART or deploying an SSHd or a very retro telnetd with a known or no password.

During research for a new root, the challenging parts here are usually the same as above. Encryption, signed filesystems,
signed executables but also stuff such as firewalls, missing libraries and more

### 3. Do the thing

Now that we have full and easy access to the system, we can finally do what we came for.

This means deploying Valetudo, figuring some way of running it on system start, modifying the vendor software so that it stops talking to the cloud and more

During research for a new root, the challenging part here is understanding the whole business logic of the robots operating system
and of course getting it to work without the cloud.
Sometimes, previous knowledge from other robots can be reused while in other situations you'll start reverse engineering from scratch.
