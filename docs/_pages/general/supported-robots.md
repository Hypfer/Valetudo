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
2. [Dreame](#dreame)
   1. [D9](#dreame_d9)
   2. [D9 Pro](#dreame_d9pro)
   3. [F9](#dreame_f9)
   4. [L10 Pro](#dreame_l10pro)
   5. [Z10 Pro](#dreame_z10pro)
   6. [W10](#dreame_w10)
3. [Roborock](#roborock)
   1. [S5](#roborock_s5)
   2. [S6](#roborock_s6)
   3. [S6 Pure](#roborock_s6pure)
   4. [S4](#roborock_s4)
   5. [S4 Max](#roborock_s4max)
   6. [S5 Max](#roborock_s5max)
   7. [S7](#roborock_s7)
4. [MOVA](#mova)
   1. [Z500](#mova_z500)
5. [Viomi](#viomi)
   1. [V6](#viomi_v6)
6. [Cecotec](#cecotec)
   1. [Conga 3290](#conga_3290)
   2. [Conga 3790](#conga_3790)
7. [Proscenic](#proscenic)
   1. [M6 Pro](#proscenic_m6pro)


## Xiaomi<a id="xiaomi"></a>

Robots sold under the Xiaomi brand are actually made by varying manufacturers.<br/>
Don't assume any compatibility of consumables or other parts as well as rooting instructions.

### Xiaomi V1<a id="xiaomi_v1"></a>

<img src="./img/robots/xiaomi/xiaomi_v1.jpg"/>

The Xiaomi V1 is made by Roborock. It is sold as:
- Xiaomi Mi Robot Vacuum

**Note:**<br/>
This robot never received firmware updates that enable persistent maps. This means that it creates a new one on every cleanup.<br/>
There are no virtual walls etc. Do **not** buy this new. There are **much better options**.

Rooting is pretty easy if your device was manufactured before 2020-03.<br/>
In that case, it only requires a Laptop. All warranty seals stay intact.

If your robot is newer than that, full disassembly will be required.

Rooting instructions:
- [OTA (before 2020-03)](https://valetudo.cloud/pages/installation/roborock.html#ota)
- [Vinda (after 2020-03)](https://valetudo.cloud/pages/installation/roborock.html#vinda)


### Xiaomi 1C<a id="xiaomi_1c"></a>

<img src="img/robots/xiaomi/xiaomi_1c.jpg"/>

The Xiaomi 1C is made by Dreame. It is sold as:
- Mi Robot Vacuum-Mop
- Xiaomi 1C
- STYTJ01ZHM

**Important note:** <br/>
There are multiple hardware revisions under the same name. Only the `dreame.vacuum.mc1808` is currently supported.

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Xiaomi 1T<a id="xiaomi_1t"></a>

<img src="img/robots/xiaomi/xiaomi_1t.jpg"/>

The Xiaomi 1T is made by Dreame. It is sold as:
- Mi Robot Vacuum-Mop 2 Pro+
- Xiaomi Mijia 1T (CN)
- Mi Robot Vacuum-Mop 1T (CN)
- STYTJ02ZHM

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Xiaomi P2148<a id="xiaomi_p2148"></a>

<img src="./img/robots/xiaomi/xiaomi_p2148.jpg"/>

The Xiaomi P2148 is made by Dreame. It is sold as:
- Mijia Robot Vacuum-Mop Ultra Slim
- Mijia Robot Vacuum Mop Ultra Slim
- Xiaomi Mijia Ultra-Thin Robot Vacuum
- Xiaomi Mijia Ultra Slim

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

With its 5.5cm height and 32.3cm diameter, this robot offers a solution for some tricky homes.
As it is china exclusive, spare parts may be hard to find in the rest of the world.

On initial root, it might be required to do a factory reset so that the device.conf gets regenerated.

There is no reset button on this robot. Instead, press and hold the two buttons for
- \< 1s for the UART shell spawn
- \> 3s for Wi-Fi reset
- \> 5s for full factory reset

Rooting instructions:
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

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

**Warning**:<br/>
Unfortunately, there are some unresolved issues with the Mijia STYTJ02YM viomi.vacuum.v8.
If you have that robot, you might want to ask for assistance.

**Note:**<br/>
While Valetudo works with their model firmwares, the recommended rooting procedure is to flash these with a Viomi V6 firmware as that has more features.

Rooting instructions:
- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)

## Dreame<a id="dreame"></a>

### D9 <a id="dreame_d9"></a>

<img src="./img/robots/dreame/dreame_d9.jpg"/>

The Dreame D9 is Dreame's first ever Lidar-based vacuum robot. It is sold as:
- Dreame D9

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### D9 Pro<a id="dreame_d9pro"></a>

<img src="./img/robots/dreame/dreame_d9pro.jpg"/>

The Dreame D9 Pro is sold as:
- Dreame D9 Pro

**Important note:** <br/>
Dreame never released any firmware updates for this robot.<br/>
However, we were able to port the regular D9 firmware to it, which is a huge improvement over the stock D9 Pro experience.

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### F9 <a id="dreame_f9"></a>

<img src="./img/robots/dreame/dreame_f9.jpg"/>

The Dreame F9 is sold as:
- Dreame F9

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### L10 Pro <a id="dreame_l10pro"></a>

<img src="./img/robots/dreame/dreame_l10pro.jpg"/>

The Dreame L10 Pro is sold as:
- Dreame L10 Pro

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### Z10 Pro <a id="dreame_z10pro"></a>

<img src="./img/robots/dreame/dreame_z10pro.jpg"/>

The Dreame Z10 Pro is sold as:
- Dreame Z10 Pro
- Dreame Bot L10 Plus (CN)

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

### W10 <a id="dreame_w10"></a>

<img src="./img/robots/dreame/dreame_w10.jpg"/>

The Dreame W10 is sold as:
- Dreame W10

Rooting is fairly easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Because of its port placement, it can be a bit difficult to connect the required cables for rooting.<br/>
If you're struggling to do that, consider removing the Lid to gain better access to the connector.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)

## MOVA<a id="mova"></a>

MOVA apparently was a rather short-lived sub-brand(?) of Dreame

### MOVA Z500<a id="mova_z500"></a>

<img src="./img/robots/mova/mova_z500.jpg"/>

The MOVA Z500 is made by Dreame. It is sold as:
- MOVA Z500

Rooting is pretty easy, only requiring a 3.3v USB UART Adapter and almost no disassembly. All warranty seals stay intact.

Rooting instructions:
- [UART](https://valetudo.cloud/pages/installation/dreame.html#uart)


## Roborock<a id="roborock"></a>

### Roborock S5<a id="roborock_s5"></a>

<img src="./img/robots/roborock/roborock_s5.jpg"/>

The Roborock S5 is sold as:
- Roborock S5

Rooting is pretty easy, only requiring a Laptop. All warranty seals stay intact.

Rooting instructions:
- [OTA](https://valetudo.cloud/pages/installation/roborock.html#ota)

### Roborock S6<a id="roborock_s6"></a>

<img src="./img/robots/roborock/roborock_s6.jpg"/>

The Roborock S6 is sold as:
- Roborock S6

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

Rooting instructions:
- [Vinda (before 2020-06)](https://valetudo.cloud/pages/installation/roborock.html#vinda)
- [Init override (after 2020-06)](https://valetudo.cloud/pages/installation/roborock.html#init)

### Roborock S6 Pure<a id="roborock_s6pure"></a>

<img src="./img/robots/roborock/roborock_s6pure.jpg"/>

The Roborock S6 Pure is sold as:
- Roborock S6 Pure

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

Rooting instructions:
- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S4<a id="roborock_s4"></a>

<img src="./img/robots/roborock/roborock_s4.jpg"/>

The Roborock S4 is sold as:
- Roborock S4

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

Rooting instructions:
- [Vinda](https://valetudo.cloud/pages/installation/roborock.html#vinda)

### Roborock S4 Max<a id="roborock_s4max"></a>

<img src="./img/robots/roborock/roborock_s4max.jpg"/>

The Roborock S4 Max is sold as:
- Roborock S4 Max

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.

Rooting instructions:
- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S5 Max<a id="roborock_s5max"></a>

<img src="./img/robots/roborock/roborock_s5max.jpg"/>

The Roborock S5 Max is sold as:
- Roborock S5 Max

Rooting requires full disassembly.

Rooting instructions:
- [FEL](https://valetudo.cloud/pages/installation/roborock.html#fel)

### Roborock S7<a id="roborock_s7"></a>

<img src="./img/robots/roborock/roborock_s7.jpg"/>

The Roborock S7 is sold as:
- Roborock S7

**Important Note:**<br/>
I do not own this robot. There can be unknown issues with equally unknown solutions.<br/>
Not everything might work. The available firmware might be outdated. The experience might be subpar.

Rooting requires full disassembly.<br/>
**Warning:**<br/>
- It is easy to mess up the reassembly and (permanently) break the mopping feature.
- The hardware is cut down so much that Valetudo _barely_ fits on it. This **not a good robot for Valetudo**.

Rooting instructions:
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

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

Rooting instructions:
- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)


## Cecotec<a id="cecotec"></a>

Conga is a brand that uses existing robot designs with a slightly customized cloud.<br/>
They're not a robot manufacturer.<br/>

### Conga 3290<a id="conga_3290"></a>

<img src="./img/robots/conga/conga_3290.jpg"/>

The Conga 3290 is actually a 3irobotix CRL-200S inside. It is sold as:
- Conga 3290

**Important note:**<br/>
Because Congas use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

Rooting instructions:
- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)

### Conga 3790<a id="conga_3790"></a>

<img src="./img/robots/conga/conga_3790.jpg"/>

The Conga 3790 is actually a 3irobotix CRL-200S inside. It is sold as:
- Conga 3790

**Important note:**<br/>
Because Congas use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

Rooting instructions:
- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)


## Proscenic<a id="proscenic"></a>

Proscenic is a brand that uses existing robot designs with a slightly customized cloud.<br/>
They're not a robot manufacturer.<br/>

### Proscenic M6 Pro<a id="proscenic_m6pro"></a>

<img src="./img/robots/proscenic/proscenic_m6pro.jpg"/>

The Proscenic M6 Pro is actually a 3irobotix CRL-200S inside. It is sold as:
- Proscenic M6 Pro

**Important note:**<br/>
Because Proscenic robots use a non-miio cloud implementation, getting them to work with Valetudo means reflashing them to a Viomi V6.
That's possible, because the hardware is exactly the same.

Rooting is pretty easy, only requiring a Linux Laptop and a micro USB cable.<br/>
It might be required to remove the battery but that can be done without touching any warranty seals.

Rooting instructions:
- [ADB](https://github.com/Hypfer/valetudo-crl200s-root)