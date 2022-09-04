/* eslint-disable */
const fs = require("fs");
const path = require("path");

const Robots = require("../backend/lib/robots");
const Configuration = require("../backend/lib/Configuration");
const ValetudoEventStore = require("valetudo-backend/lib/ValetudoEventStore");

function generateAnchor(str) {
    return str.replace(/[^0-9a-z-A-Z]/g, "").toLowerCase()
}

function generateCapabilityLink(capability) {
    return "[" + capability + "](https://valetudo.cloud/pages/general/capabilities-overview.html#" + capability + ")";
}

function generateTable(models, tableData) {
    let ret = "## Overview<a id='Overview'></a>\n\nCapability | ";
    ret += models.map((m) => {
        return "<a href='#" + m[1] + "'>" + m[0] + "</a>";
    }).join(" | ");
    ret += "\n----";
    models.forEach(() => {
        ret += " | ----";
    })
    ret += "\n";
    Object.keys(tableData).sort().forEach(capability => {
        ret += generateCapabilityLink(capability);
        models.forEach(m => {
            ret += " | ";
            if (tableData[capability].indexOf(m[0]) !== -1) {
                ret += "<span style=\"color:green;\">Yes</span>";
            } else {
                ret += "<span style=\"color:red\;\">No</span>";
            }
        });
        ret += "\n";
    });

    return ret;
}

process.on("uncaughtException", function(err) {
    if (err.errno === "EADDRINUSE") {
        //lol
    } else {
        console.log(err);
        process.exit(1);
    }
});

const VALETUDO_SUPPORT_GRADES = {
    GREAT: "great",
    GOOD: "good",
    OKAY: "okay",
    MEH: "meh",
    BAD: "bad"
}

const DEVELOPER_SUPPORT_GRADES = {
    YES: "yes",
    BEST_EFFORT: "best effort",
    SOME_EFFORT: "some effort",
    NONE: "none"
}

const BUY_GRADES = {
    GET_IT_RIGHT_NOW: "get it right now!",
    OKAY: "Can't go wrong with this model",
    OKAY_ISH: "This model is okay but has some issues that keep it from being fully recommendable",
    NOT_OKAY: "This model has issues and therefore isn't recommended (see comment)",
    OUTDATED_OKAY: "outdated but still okay-ish",
    OUTDATED_NOT_OKAY: "outdated. not recommended (anymore)"
}

const VALETUDO_ARCHITECTURES = {
    ARM: "armv7",
    ARM_LOWMEM: "armv7-lowmem",
    AARCH64: "aarch64",
}

const ModelDescriptions = {
    "Dreame": {
        "1C": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.BEST_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "vSLAM and a small battery, though there are persistent maps and everything seems to work",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "1T": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.BEST_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: [
                "vSLAM + ToF offers a huge upgrade over only vSLAM, however it is still inferior to Lidar-based mapping.",
                "On initial root, it might be required to do a factory reset so that the device.conf gets regenerated."
            ].join("\n"),
            architecture: VALETUDO_ARCHITECTURES.AARCH64,
        },
        "D9": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "256 MB RAM are problematic when dealing with large floorplans",
            architecture: VALETUDO_ARCHITECTURES.ARM_LOWMEM,
        },
        "D9 Pro": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "256 MB RAM are problematic when dealing with large floorplans\n\nBasically the same as the D9",
            architecture: VALETUDO_ARCHITECTURES.ARM_LOWMEM,
        },
        "F9": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.BEST_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "vSLAM :(",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "L10 Pro": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY,
            comment: "None",
            architecture: VALETUDO_ARCHITECTURES.AARCH64,
        },
        "MOVA Z500": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.BEST_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "vSLAM :(",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "Z10 Pro": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.GET_IT_RIGHT_NOW,
            comment: "The auto-empty-dock is a neat addition",
            architecture: VALETUDO_ARCHITECTURES.AARCH64,
        },
        "P2148": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.GOOD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: [
                "With its 5.5cm height and 32.3cm diameter, this robot offers a solution for some tricky homes.",
                "As it is china exclusive, spare parts may be hard to find in the rest of the world.",
                "",
                "On initial root, it might be required to do a factory reset so that the device.conf gets regenerated.",
                "",
                "There is no reset button on this robot. Instead, press and hold the two buttons for",
                "- <1s for the UART shell spawn",
                "- >3s for Wi-Fi reset",
                "- >5s for full factory reset"
            ].join("\n"),
            architecture: VALETUDO_ARCHITECTURES.AARCH64,
        },
    },
    "Roborock": {
        "S4 Max": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.SOME_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "Root requires full disassembly and soldering. \n\nAlso, 256 MB RAM and NAND are pretty bad HW specs, which can cause issues.",
            architecture: VALETUDO_ARCHITECTURES.ARM_LOWMEM,
        },
        "S4": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.SOME_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "Root requires full disassembly and soldering.",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "S5 Max": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.SOME_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "Root requires full disassembly and soldering. \n\nAlso, 256 MB RAM and NAND are pretty bad HW specs, which can cause issues.",
            architecture: VALETUDO_ARCHITECTURES.ARM_LOWMEM,
        },
        "S5": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.OUTDATED_OKAY,
            comment: "Still works finefor most use-cases",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "S6 MaxV": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.BAD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.NONE,
            testedWorking: true,
            recommended: BUY_GRADES.NOT_OKAY,
            comment: "It's basically impossible to root this thing.",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "S6 Pure": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.SOME_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OKAY_ISH,
            comment: "Root requires full disassembly and soldering. \n\nAlso, 256 MB RAM and NAND are pretty bad HW specs, which can cause issues.",
            architecture: VALETUDO_ARCHITECTURES.ARM_LOWMEM,
        },
        "S6": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.YES,
            testedWorking: true,
            recommended: BUY_GRADES.OUTDATED_OKAY,
            comment: "Still works fine for most use-cases",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        },
        "S7": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.BAD,
            developerSupport: DEVELOPER_SUPPORT_GRADES.NONE,
            testedWorking: true,
            recommended: BUY_GRADES.NOT_OKAY,
            comment: "Rooting requires full disassembly and soldering. \n\nFurthermore, 256 MB RAM and NAND are pretty bad HW specs, which can cause issues and are frankly unacceptable considering the price of this robot. It's simply not worth it.",
            architecture: VALETUDO_ARCHITECTURES.ARM_LOWMEM,
        },
        "V1": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.OKAY,
            developerSupport: DEVELOPER_SUPPORT_GRADES.SOME_EFFORT,
            testedWorking: true,
            recommended: BUY_GRADES.OUTDATED_NOT_OKAY,
            comment: "Unfortunately, this model is lacking basic features such as a persistent map which is insufficient in 2021+",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        }
    },
    "Viomi": {
        "V7": {
            valetudoSupport: VALETUDO_SUPPORT_GRADES.MEH,
            developerSupport: DEVELOPER_SUPPORT_GRADES.NONE,
            testedWorking: true,
            recommended: BUY_GRADES.NOT_OKAY,
            comment: "This model is actually just a White-Label Product with a custom Miio Software stack which is EOL and therefore doesn't receive any meaningful software updates.\n\nOverall, it's just weird and annoying.",
            architecture: VALETUDO_ARCHITECTURES.ARM,
        }
    }
}

function getModelDescription(vendor, model) {
    const description = ModelDescriptions[vendor]?.[model];

    if (!description) {
        throw new Error(`Missing description for ${vendor} ${model}`)
    }

    return [
        `#### Valetudo Support\n\n${description.valetudoSupport}\n\n`,
        `#### Developer Support\n\n${description.developerSupport}\n\n`,
        "#### Tested Working\n\n" + (description.testedWorking ? "✔" : "❌") + "\n\n",
        `#### Recommended\n\n${description.recommended}\n\n`,
        `#### Recommended Valetudo binary to use\n\n${description.architecture}\n\n`,
        `#### Comment\n\n${description.comment}\n\n`
    ]
}

/**
 * We're hiding implementations that aren't ready to be used by people casually checking the docs
 * They might never be ready to be used and just exist as a test etc.
 *
 * Don't get your hopes up just because there's an implementation
 *
 * @type {string[]}
 */
const HIDDEN_IMPLEMENTATIONS = [
    "ViomiV7ValetudoRobot",
    "RoborockM1SValetudoRobot",
    "RoborockS6MaxVValetudoRobot",
    "RoborockS7ValetudoRobot",
    "DreameP2149ValetudoRobot"
];


const vendors = {};

Object.values(Robots).forEach(robotClass => {
    if (HIDDEN_IMPLEMENTATIONS.includes(robotClass.name)) {
        return;
    }

    const config = new Configuration();
    config.set("embedded", false);
    const eventStore = new ValetudoEventStore();

    try {
        const instance = new robotClass({
            config: config,
            valetudoEventStore: eventStore
        });

        vendors[instance.getManufacturer()] = vendors[instance.getManufacturer()] ? vendors[instance.getManufacturer()] : {};

        vendors[instance.getManufacturer()][instance.constructor.name] = {
            vendorName: instance.getManufacturer(),
            modelName: instance.getModelName(),
            capabilities: Object.keys(instance.capabilities).sort()
        }
    } catch (e) {
        console.error(e);
    }
});

const header = `---
title: Supported Robots
category: General
order: 9
---

# Supported Robots

This page features an autogenerated overview of all robots supported by Valetudo including their supported capabilities.<br/>
To find out what those do, check out the [capabilities overview](https://valetudo.cloud/pages/general/capabilities-overview.html) section of the docs.

You also might want to take a look at the [Buying supported robots](https://valetudo.cloud/pages/general/buying-supported-robots.html) page.

This is just the autogenerated overview because it's hard to write documentation for everything and keep that up to date. <br/>
Keep in mind that rooting instructions will differ for each of these **or might not even be available at all**.
Just because the code would - in theory - support a Robot doesn't necessarily mean that you can simply buy it and put Valetudo on it.<br/>

To find out if you can install Valetudo on your robot, check out the [Rooting Instructions](https://valetudo.cloud/pages/general/rooting-instructions.html).
If you can't find it there, it's most likely not possible (yet?).
Another source is [https://dontvacuum.me/robotinfo/](https://dontvacuum.me/robotinfo/). Search for "Root method public?".
If it's listed as "no", then it's certainly not possible for you to run Valetudo on it.

There's also some more information regarding whether or not you should buy a specific robot below the table.

The recommended Valetudo binary architectures armv7, armv7-lowmem and aarch64 are also listed for every robot. Even though
armv7 binaries work on aarch64 robots, using the correct binary for your robot is recommended.

Again:<br/>
This is just an autogenerated overview based on the codebase at the time of generation.<br/>
Don't take this as "Everything listed here will be 100% available and work all the time".<br/>

`;

const ToC = [
    "## Table of Contents",
    "1. [Overview](#Overview)"
];
const VendorSections = [];

const SummaryTable = {};
const RobotModels = [];

Object.keys(vendors).filter(v => v !== "Valetudo").sort().forEach((vendor, i) => {
    let vendorTocEntry = [
        (i+2) + ". [" + vendor +"](#" + generateAnchor(vendor) + ")"
    ];

    // noinspection JSMismatchedCollectionQueryUpdate
    let vendorSection = [
        "## " + vendor + '<a id="'+generateAnchor(vendor)+'"></a>',
        ""
    ]


    const vendorRobots = vendors[vendor];

    Object.keys(vendorRobots).sort().forEach((robotImplName, i) => {
        const robot = vendorRobots[robotImplName];
        const robotAnchor = generateAnchor(vendor) + "_" + generateAnchor(robot.modelName);

        RobotModels.push([robot.modelName, robotAnchor]);

        vendorTocEntry.push("    " + (i+1) + ". [" + robot.modelName + "](#" + robotAnchor + ")");

        vendorSection.push(
            "### " + robot.modelName + '<a id="'+robotAnchor+'"></a>',
            "",
            getModelDescription(robot.vendorName, robot.modelName).join("\n\n"),
            "",
            "#### This model supports the following capabilities:"
        );

        robot.capabilities.forEach(capability => {
            vendorSection.push("  - " + generateCapabilityLink(capability));
            if (!SummaryTable.hasOwnProperty(capability)) {
                SummaryTable[capability] = [robot.modelName]
            } else {
                SummaryTable[capability].push(robot.modelName);
            }
        });

        vendorSection.push("", "");
    })


    ToC.push(vendorTocEntry.join("\n"));
    VendorSections.push(vendorSection.join("\n"));
});



const page = [
    header,
    ToC.join("\n"),
    "\n<br/>\n",
    generateTable(RobotModels, SummaryTable),
    "\n<br/>\n",
    VendorSections.join("\n"),
    "<br/><br/><br/><br/><br/>",
    "This page has been autogenerated.<br/>",
    "Autogeneration timestamp: " + new Date().toISOString()
]

fs.writeFileSync(path.join(__dirname, "../docs/_pages/general/supported-robots.md"), page.join("\n") + "\n")
process.exit(0);
