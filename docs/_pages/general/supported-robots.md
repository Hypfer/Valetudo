---
title: Supported Robots
category: General
order: 9
---

# Supported Robots

At the time of writing, (2022-11-20), Valetudo supports more than 20 different Robots.<br/>
If you're interested in hardware specifics, teardowns and more, check out Dennis Giese's [Vacuum Robot Overview](https://dontvacuum.me/robotinfo/).

Please note that Vacuum Robots tend to look very similar to each other. Before you make any assumptions, please consider
asking in the Telegram Group or on the IRC. You can only brick your robot once.

Unless noted otherwise, you can assume that these robots were tested by us.<br/>
**HOWEVER** if noted otherwise, please be aware that the experience can be bad and not representative for Valetudo.<br/>
There may be no one that can help you if something goes wrong. You might even end up with a permanently bricked robot.

Hint:<br/>
You can use Ctrl + F to look for your model of robot.<br/>
**Please** make sure to read and understand the information written there.

## Table of Contents

1. [Xiaomi](#xiaomi)
   1. [V1](#xiaomi_v1)
   2. [1C](#xiaomi_1c)
   3. [1T](#xiaomi_1t)
   4. [P2148](#xiaomi_p2148)
   5. [Vacuum-Mop P](#xiaomi_vacuummop_p)
   6. [Vacuum-Mop 2 Ultra](#xiaomi_p2150)
   7. [X10 Plus](#xiaomi_x10plus)
2. [Dreame](#dreame)
   1. [D9](#dreame_d9)
   2. [D9 Pro](#dreame_d9pro)
   3. [F9](#dreame_f9)
   4. [L10 Pro](#dreame_l10pro)
   5. [Z10 Pro](#dreame_z10pro)
   6. [W10](#dreame_w10)
   7. [W10 Pro](#dreame_w10pro)
   8. [L10s Ultra](#dreame_l10sultra)
   9. [D10s Pro](#dreame_d10spro)
   10. [D10s Plus](#dreame_d10splus)
3. [Roborock](#roborock)
   1. [S5](#roborock_s5)
   2. [S6](#roborock_s6)
   3. [S6 Pure](#roborock_s6pure)
   4. [S4](#roborock_s4)
   5. [S4 Max](#roborock_s4max)
   6. [S5 Max](#roborock_s5max)
   7. [S7](#roborock_s7)
   8. [S7 Pro Ultra](#roborock_s7proultra)
   9. [Q7 Max](#roborock_q7max)
4. [MOVA](#mova)
   1. [Z500](#mova_z500)
5. [Viomi](#viomi)
   1. [V6](#viomi_v6)
   2. [SE](#viomi_se)
6. [Cecotec](#cecotec)
   1. [Conga 3290](#conga_3290)
   2. [Conga 3790](#conga_3790)
7. [Proscenic](#proscenic)
   1. [M6 Pro](#proscenic_m6pro)
8. [Commodore](#commodore)
   1. [CVR 200](#commodore_cvr200)

## Xiaomi<a id="xiaomi"></a>

Robots sold under the Xiaomi brand are actually made by varying manufacturers.<br/>
Don't assume any compatibility of consumables or other parts as well as rooting instructions.

### Xiaomi V1<a id="xiaomi_v1"></a>

<img src="./img/robots/xiaomi/xiaomi_v1.jpg"/>

The Xiaomi V1 is made by Roborock. It is sold as:
- Xiaomi Mi Robot Vacuum

#### Comments

**Note:**<br/>
This robot never received firmware updates that enable persistent maps. This means that it creates a new one on every cleanup.<br/>
There are no virtual walls etc. Do **not** buy this new. There are **much better options**.

Rooting is pretty easy if your device was manufactured before 2020-03.<br/>
In that case, it only requires a Laptop. All warranty seals stay intact.

If your robot is newer than that, full disassembly will be required.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [OTA (before 2020-03)](https://valetudo.cloud/pages/installation/roborock.html#ota)
- [Vinda (after 2020-03)](https://valetudo.cloud/pages/installation/roborock.html#vinda)

### Xiaomi 1C<a id="xiaomi_1c"></a>

<img src="img/robots/xiaomi/xiaomi_1c.jpg"/>

The Xiaomi 1C is made by Dreame. It is sold as:
- Mi Robot Vacuum-Mop
- Xiaomi 1C
- STYTJ01ZHM

#### Comments

**Important note:** <br/>
There are multiple hardware revisions under the same name. Only the `dreame.vacuum.mc1808` is currently supported.

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Xiaomi 1T<a id="xiaomi_1t"></a>

<img src="img/robots/xiaomi/xiaomi_1t.jpg"/>

The Xiaomi 1T is made by Dreame. It is sold as:
- Mi Robot Vacuum-Mop 2 Pro+
- Xiaomi Mijia 1T (CN)
- Mi Robot Vacuum-Mop 1T (CN)
- STYTJ02ZHM

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

On initial root, it might be required to do a factory reset so that the device.conf gets regenerated.
Note that that factory reset will also remove Valetudo meaning that you will have to put it back after that.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Xiaomi P2148<a id="xiaomi_p2148"></a>

<img src="./img/robots/xiaomi/xiaomi_p2148.jpg"/>

The Xiaomi P2148 is made by Dreame. It is sold as:
- Mijia Robot Vacuum-Mop Ultra Slim
- Mijia Robot Vacuum Mop Ultra Slim
- Xiaomi Mijia Ultra-Thin Robot Vacuum
- Xiaomi Mijia Ultra Slim

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

With its 5.5cm height and 32.3cm diameter, this robot offers a solution for some tricky homes.
As it is china exclusive, spare parts may be hard to find in the rest of the world.

On initial root, it might be required to do a factory reset so that the device.conf gets regenerated.
Note that that factory reset will also remove Valetudo meaning that you will have to put it back after that.

There is no reset button on this robot. Instead, press and hold the two buttons for
- \< 1s for the UART shell spawn
- \> 3s for Wi-Fi reset
- \> 5s for full factory reset

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Xiaomi Vacuum-Mop P<a id="xiaomi_vacuummop_p"></a>

<img src="img/robots/xiaomi/xiaomi_vacuummop_p.jpg"/>

The Vacuum-Mop P is using the Viomi cloud stack but is actually made by 3irobotix.<br/>
There are three robots with different IDs under this name, and they're all 3irobotix CRL-200S inside.<br/>
It's very confusing. If unsure, please ask us first.

These are sold under the names:
- Mi Robot Vacuum-Mop P
- Mi Robot Vacuum-Mop Pro (but nut the ijai one!!)
- Mijia STYJ02YM

#### Comments

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

**Warning**:<br/>
Unfortunately, there are some unresolved issues with the Mijia STYTJ02YM viomi.vacuum.v8.
It is strongly recommended to not attempt to root the v8 variant to avoid the risk of bricking the robot.

**Note:**<br/>
While Valetudo works with their model firmwares, the recommended rooting procedure is to flash these with a Viomi V6 firmware as that has more features.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)

### Xiaomi Vacuum-Mop 2 Ultra<a id="xiaomi_p2150"></a>

<img src="img/robots/xiaomi/xiaomi_p2150.jpg"/>

The Xiaomi Vacuum-Mop 2 Ultra is made by Dreame. It is sold as:
- Mi Robot Vacuum-Mop 2 Ultra
- Mi Robot Vacuum-Mop 2 Ultra + Auto-empty station
- BHR5195EU

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes (since FW 1167)`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Xiaomi X10 Plus<a id="xiaomi_x10plus"></a>

<img src="img/robots/xiaomi/xiaomi_x10plus.jpg"/>

The Xiaomi Robot Vacuum X10 Plus is made by Dreame. It is sold as:
- Xiaomi Robot Vacuum X10 Plus

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

## Dreame<a id="dreame"></a>

### D9 <a id="dreame_d9"></a>

<img src="./img/robots/dreame/dreame_d9.jpg"/>

The Dreame D9 is Dreame's first ever Lidar-based vacuum robot. It is sold as:
- Dreame D9

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### D9 Pro<a id="dreame_d9pro"></a>

<img src="./img/robots/dreame/dreame_d9pro.jpg"/>

The Dreame D9 Pro is sold as:
- Dreame D9 Pro

#### Comments

**Important note:** <br/>
Dreame never released any firmware updates for this robot.<br/>
However, we were able to port the regular D9 firmware to it, which is a huge improvement over the stock D9 Pro experience.

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### F9 <a id="dreame_f9"></a>

<img src="./img/robots/dreame/dreame_f9.jpg"/>

The Dreame F9 is sold as:
- Dreame F9

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### L10 Pro <a id="dreame_l10pro"></a>

<img src="./img/robots/dreame/dreame_l10pro.jpg"/>

The Dreame L10 Pro is sold as:
- Dreame L10 Pro

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes (since FW 1138)`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Z10 Pro <a id="dreame_z10pro"></a>

<img src="./img/robots/dreame/dreame_z10pro.jpg"/>

The Dreame Z10 Pro is sold as:
- Dreame Z10 Pro
- Dreame Bot L10 Plus (CN)

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes (since FW 1156)`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### W10 <a id="dreame_w10"></a>

<img src="./img/robots/dreame/dreame_w10.jpg"/>

The Dreame W10 is sold as:
- Dreame W10

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)


### W10 Pro <a id="dreame_w10pro"></a>

<img src="./img/robots/dreame/dreame_w10pro.jpg"/>

The Dreame W10 Pro is sold as:
- Dreame W10 Pro

#### Comments

Rooting is relatively easy. Usage of [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) is highly recommended.
All warranty seals stay intact.

On my test machine, the miio cloudKey was only stored in secure storage which broke cloud communication with Valetudo.
Here's a one-liner to fix that:
`mount -o remount,rw /mnt/private && printf "%s" "$(dreame_release.na -c 7 | awk -F' = ' '/MI_KEY/{print $2}')" > "/mnt/private/ULI/factory/key.txt" && mount -o remount,ro /mnt/private`

If you're rooting your W10 Pro, please let me know if you needed to run that command as well so that the docs can be updated.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes`

#### Rooting instructions

- [Fastboot](https://valetudo.cloud/pages/installation/dreame.html#fastboot)

### L10s Ultra <a id="dreame_l10sultra"></a>

<img src="./img/robots/dreame/dreame_l10sultra.jpg"/>

The Dreame L10s Ultra is sold as:
- Dreame L10s Ultra

#### Comments

Rooting is relatively easy. Usage of [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) is highly recommended.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes`

#### Rooting instructions

- [Fastboot](https://valetudo.cloud/pages/installation/dreame.html#fastboot)

### D10s Pro <a id="dreame_d10spro"></a>

<img src="./img/robots/dreame/dreame_d10spro.jpg"/>

The Dreame D10s Pro is sold as:
- Dreame D10s Pro

#### Comments

Rooting is relatively easy. Usage of [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) is highly recommended.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes`

#### Rooting instructions

- [Fastboot](https://valetudo.cloud/pages/installation/dreame.html#fastboot)

### D10s Plus <a id="dreame_d10splus"></a>

<img src="./img/robots/dreame/dreame_d10splus.jpg"/>

The Dreame D10s Plus is sold as:
- Dreame D10s Plus

#### Comments

Rooting is relatively easy. Usage of [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) is highly recommended.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `aarch64`
**Secure Boot**: `yes`

#### Rooting instructions

- [Fastboot](https://valetudo.cloud/pages/installation/dreame.html#fastboot)

## MOVA<a id="mova"></a>

MOVA apparently was a rather short-lived sub-brand(?) of Dreame

### MOVA Z500<a id="mova_z500"></a>

<img src="./img/robots/mova/mova_z500.jpg"/>

The MOVA Z500 is made by Dreame. It is sold as:
- MOVA Z500

#### Comments

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter, [the Dreame Breakout PCB](https://github.com/Hypfer/valetudo-dreameadapter) and almost no disassembly.
All warranty seals stay intact.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)


## Roborock<a id="roborock"></a>

### Roborock S5<a id="roborock_s5"></a>

<img src="./img/robots/roborock/roborock_s5.jpg"/>

The Roborock S5 is sold as:
- Roborock S5
- Xiaomi Mi Roborock S502-00

#### Comments

Rooting is pretty easy, only requiring a Laptop. All warranty seals stay intact.

Note that segment support is only available starting with firmware version 2008 so make sure you're up-to-date.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [OTA](https://valetudo.cloud/pages/installation/roborock.html#ota)

### Roborock S6<a id="roborock_s6"></a>

<img src="./img/robots/roborock/roborock_s6.jpg"/>

The Roborock S6 is sold as:
- Roborock S6

#### Comments

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [Vinda (before 2020-06)](https://valetudo.cloud/pages/installation/roborock.html#vinda)
- [Init override (after 2020-06)](https://valetudo.cloud/pages/installation/roborock.html#init)

### Roborock S6 Pure<a id="roborock_s6pure"></a>

<img src="./img/robots/roborock/roborock_s6pure.jpg"/>

The Roborock S6 Pure is sold as:
- Roborock S6 Pure

#### Comments

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S4<a id="roborock_s4"></a>

<img src="./img/robots/roborock/roborock_s4.jpg"/>

The Roborock S4 is sold as:
- Roborock S4

#### Comments

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [Vinda](https://valetudo.cloud/pages/installation/roborock.html#vinda)

### Roborock S4 Max<a id="roborock_s4max"></a>

<img src="./img/robots/roborock/roborock_s4max.jpg"/>

The Roborock S4 Max is sold as:
- Roborock S4 Max

#### Comments

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S5 Max<a id="roborock_s5max"></a>

<img src="./img/robots/roborock/roborock_s5max.jpg"/>

The Roborock S5 Max is sold as:
- Roborock S5 Max

#### Comments

Rooting requires full disassembly.


#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S7<a id="roborock_s7"></a>

<img src="./img/robots/roborock/roborock_s7.jpg"/>

The Roborock S7 is sold as:
- Roborock S7
- Roborock S7+

#### Comments

Rooting requires full disassembly.<br/>

**Warning:**<br/>
The VibraRise mop module makes disassembly of this robot difficult and easy to mess up especially for newcomers.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S7 Pro Ultra<a id="roborock_s7proultra"></a>

<img src="./img/robots/roborock/roborock_s7proultra.jpg"/>

The Roborock S7 Pro Ultra is sold as:
- Roborock S7 Pro Ultra

#### Comments

Rooting requires full disassembly.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock Q7 Max<a id="roborock_q7max"></a>

<img src="./img/robots/roborock/roborock_q7max.jpg"/>

The Roborock Q7 Max is sold as:
- Roborock Q7 Max
- Roborock Q7 Max+

#### Comments

Rooting requires full disassembly.

#### Details

**Valetudo Binary**: `armv7-lowmem`
**Secure Boot**: `no`

#### Rooting instructions

- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

## Viomi<a id="viomi"></a>

Viomi is a brand that uses existing robot designs with a slightly customized cloud.<br/>
They're not a robot manufacturer.

### Viomi V6<a id="viomi_v6"></a>

<img src="./img/robots/viomi/viomi_v6.jpg"/>

The Viomi V6 is actually a 3irobotix CRL-200S inside. It is sold as:
- Viomi Cleaning Robot
- Viomi V2
- Viomi V2 Pro
- V-RVCLM21B

#### Comments

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)

### Viomi SE<a id="viomi_se"></a>

<img src="./img/robots/viomi/viomi_se.jpg"/>

The Viomi SE is actually a 3irobotix CRL-200S inside. It is sold as:
- Viomi SE
- V-RVCLM21A

#### Comments

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)


## Cecotec<a id="cecotec"></a>

Conga is a brand that uses existing robot designs with a slightly customized cloud.<br/>
They're not a robot manufacturer.<br/>

### Conga 3290<a id="conga_3290"></a>

<img src="./img/robots/conga/conga_3290.jpg"/>

The Conga 3290 is actually a 3irobotix CRL-200S inside. It is sold as:
- Conga 3290

#### Comments

**Important note:**<br/>
Because Congas use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)

### Conga 3790<a id="conga_3790"></a>

<img src="./img/robots/conga/conga_3790.jpg"/>

The Conga 3790 is actually a 3irobotix CRL-200S inside. It is sold as:
- Conga 3790

#### Comments

**Important note:**<br/>
Because Congas use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)


## Proscenic<a id="proscenic"></a>

Proscenic is a brand that uses existing robot designs with a slightly customized cloud.<br/>
They're not a robot manufacturer.<br/>

### Proscenic M6 Pro<a id="proscenic_m6pro"></a>

<img src="./img/robots/proscenic/proscenic_m6pro.jpg"/>

The Proscenic M6 Pro is actually a 3irobotix CRL-200S inside. It is sold as:
- Proscenic M6 Pro

#### Comments

**Important note:**<br/>
Because Proscenic robots use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)


## Commodore<a id="commodore"></a>

Someone from Austria seems to have bought the rights to use the long-defunct Commodore brand.<br/>
Apparently, the first thing to do with that was to release a line of vacuum robots made by 3irobotix.<br/>

### Commodore CVR 200<a id="commodore_cvr200"></a>

<img src="./img/robots/commodore/commodore_cvr200.jpg"/>

The Commodore CVR 200 is actually a 3irobotix CRL-200S inside. It is sold as:
- Commodore CVR 200

#### Comments

**Important note:**<br/>
Because Commodore robots use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

#### Details

**Valetudo Binary**: `armv7`
**Secure Boot**: `no`

#### Rooting instructions

- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)
