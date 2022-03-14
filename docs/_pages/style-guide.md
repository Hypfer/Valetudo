---
title: Style Guide
category: Misc
order: 33
---
# Style Guide

While I am by no means a designer, I figured that it would make sense to document some design choices for the sake
of consistency.


## General

This project is called <em style="font-weight: bold;">Valetudo</em> with a capital V.

It should always be capitalized.<br/>
There also shouldn't be any spaces in between, as "vale tudo" is a style of mixed martial arts.

## Logo

### Full Logo

This is the main logo including the full project name.


<div style="text-align: center; margin-bottom: 0.5em;">
<img src="./img/valetudo_logo_with_name.svg" alt="Valetudo Full Logo">
</div>

The font used is <a href="https://en.wikipedia.org/wiki/Ubuntu_(typeface)" rel="noopener" target="_blank">Ubuntu Medium</a>,
which nicely picks up the round-ish-ness of the Valetudo logo.


### Minimal Logo

This is the minimal variant of the logo featuring only the actual logo part.
It is usually used for icons or when the full logo is simply too large to make sense.

<div style="text-align: center; margin-bottom: 0.5em;">
<img src="./img/valetudo_logo_small.svg" width="128em" alt="Valetudo Minimal Logo">
</div>

The logo embodies both a V-shape for Valetudo and a round-ish shape to represent the roundness
of most vacuum robots. Furthermore, it features a styled reference to a LIDAR tower in the middle.


## Colors

### Logo colors

The two shades of blue used in the logo serve as the identity of the project and thus must never be altered.

<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center; margin-bottom: 1em;">
<div>
    <div style="background-color:#0076FF; height: 8em; width: 8em;"></div>
    <div style="color:#0076FF; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#0076FF</div>
</div>
    
<div>
    <div style="background-color:#52AEFF; height: 8em; width: 8em;"></div>
    <div style="color:#52AEFF; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#52AEFF</div>
</div>
</div>

### Text/Background colors

This section needs some work. There hasn't been any decision yet.

### Accent colors

Valetudo's main use of color is the map renderer with the same blue used in the logo representing floor
and additional colors being used to distinguish different segments in the map.

These colors may also be used to emphasize something or add color to other areas.
For example, the logviewer uses these to easily distinguish the different loglevels.

To better match dark themes, the 20% darkened variant that can be seen on the right may also be used.

<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center">
<div>
    <div style="background-color:#0076FF; height: 8em; width: 8em;"></div>
    <div style="color:#0076FF; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#0076FF</div>
</div>

<div>
    <div style="background-color:#005ECC; height: 8em; width: 8em;"></div>
    <div style="color:#005ECC; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#005ECC</div>
</div>
</div>


<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center; margin-top: 1em;">
<div>
    <div style="background-color:#19A1A1; height: 8em; width: 8em;"></div>
    <div style="color:#19A1A1; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#19A1A1</div>
</div>

<div>
    <div style="background-color:#148181; height: 8em; width: 8em;"></div>
    <div style="color:#148181; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#148181</div>
</div>
</div>

<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center; margin-top: 1em;">
<div>
    <div style="background-color:#7AC037; height: 8em; width: 8em;"></div>
    <div style="color:#7AC037; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#7AC037</div>
</div>

<div>
    <div style="background-color:#629A2C; height: 8em; width: 8em;"></div>
    <div style="color:#629A2C; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#629A2C</div>
</div>
</div>

<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center; margin-top: 1em;">
<div>
    <div style="background-color:#DF5618; height: 8em; width: 8em;"></div>
    <div style="color:#DF5618; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#DF5618</div>
</div>

<div>
    <div style="background-color:#B24513; height: 8em; width: 8em;"></div>
    <div style="color:#B24513; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#B24513</div>
</div>
</div>

<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center; margin-top: 1em;">
<div>
    <div style="background-color:#F7C841; height: 8em; width: 8em;"></div>
    <div style="color:#F7C841; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#F7C841</div>
</div>

<div>
    <div style="background-color:#C6A034; height: 8em; width: 8em;"></div>
    <div style="color:#C6A034; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#C6A034</div>
</div>
</div>

<div style="display:flex; flex-grow: 1; justify-content: space-evenly; text-align: center; margin-top: 1em;">
<div>
    <div style="background-color:#9966CC; height: 8em; width: 8em;"></div>
    <div style="color:#9966CC; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#9966CC</div>
</div>

<div>
    <div style="background-color:#7A52A3; height: 8em; width: 8em;"></div>
    <div style="color:#7A52A3; font-weight:bolder; font-size: 1.5em; font-family: monospace;">#7A52A3</div>
</div>
</div>

## Fonts

The font used by the full logo is <a href="https://en.wikipedia.org/wiki/Ubuntu_(typeface)" rel="noopener" target="_blank">Ubuntu Medium</a>.

Further choices of fonts are TBD.
