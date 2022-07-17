---
title: Why not Valetudo?
category: General
order: 7
---

# Why not Valetudo?

After having read through the [Why Valetudo?](https://valetudo.cloud/pages/general/why-valetudo.html) page,
you might also be wondering why you might **not** want to use Valetudo.
To answer those questions, here's a list of a few common reasons in an attempt to reduce the amount of some incredibly exhausting discussions.


## No multi-floor/multi-map support

Due to technical limitations, Valetudo does not support multiple maps.
If you need multiple maps, Valetudo likely won't be an option for you.

The topic has been evaluated many times already, however unfortunately it's not technically feasible with the currently
supported robot models and firmwares. (2022-07-17)

If you need multiple floors vacuumed and want to use Valetudo, you may want to invest in a second robot.
With the current (2022-07-17) market (in Germany), 200€ should be more than enough to buy a factory new supported one even featuring LIDAR.

Investing in a second robot also improves the usefulness of the unit, as having to manually carry the robot to another
floor very much degrades the benefits of a fully automated vacuum robot.

If investing in a second robot is not possible in your situation, you'll likely be very unhappy with Valetudo.

## You may not be the target audience

While Valetudo may be used by anyone, five years of user interactions have shown that it works better for some demographics than others.

One such demographic that seems to often run into trouble when using Valetudo is apple users. (I know, right?)
Specifically, those fully invested into the Apple Ecosystem and way of life.

It should be clearly stated that of course there is no active effort to lock out people using apple products going on.
However, it seems that the "think different"-way of interaction with and understanding of the world is simply incompatible
with how Valetudo is built, supported and maintained. Thus, if you're a member of that group, you'll likely be very unhappy with Valetudo.


Another demographic that seems to struggle hard with usage of Valetudo are people suffering from an exceptionally short
attention span. As rooting a vacuum robot is an advanced topic, it will always require careful and mindful reading of
information available to get an understanding of how things work and need to be done.

If you're a person that prefers jump-cutted videotutorials featuring little understanding and lots of no-thinking-required
copy-paste commands, you'll likely be very unhappy with Valetudo.


In conclusion, it should be noted that, being a passion project, there is no incentive for Valetudo to cater to
the needs of demographics that are usually only catered to to make money. If Valetudo was aimed at those demographics,
there would be ads, data collection, licensing fees and many more undesirable things built in.


## Only supported robots are supported

While this may sound incredibly dumb, it unfortunately needs saying nonetheless.

Only supported robots are supported.
Unsupported robots are not supported.

If you have an unsupported robot, it is not supported.
There is no support for it because it is not supported.

While there might be code in Valetudo that enables operation of a specific robot, it doesn't mean that it is also supported.
Support can only be provided for supported robots.

To receive support, you will need a supported robot.
It is impossible to support an unsupported robot as - due to it being not supported - there simply is no knowledge available
that could be utilized to provide support.

It is possible to use Valetudo on unsupported robots or in unsupported ways.
Just note that there will be no support for these unsupported scenarios.


## Valetudo is only available in english

Valetudo does not feature any localization. Let me explain the reasoning behind this with a few examples.

First, consider this car radio in a car made for the german market:

![Bosch Car Radio](./img/car_radio.jpg)

In fact, the radio is engineered by Bosch in Hildesheim. Still, the button isn't labeled `Karte`.

Now, let's take a look at the Valetudo UI (Version 0.6.1):

![Valetudo 0.6.1 UI](./img/valetudo-ui.png)

Regarding overall complexity, it's comparable to the buttons on the radio.
It's even easier to understand, because there are a lot more icons. <br/>
Considering that people do in fact manage to use their car radios even if their english skills may be lacking,
I'd say that **accessibility** isn't a problem here.


As a matter of fact, Internationalization isn't free. It always introduces more work, more complexity etc.<br/>
Of course **accessibility** is often worth the effort, however since we've already established that this factor isn't relevant here,
we can take a look at a non-exhaustive list of downsides of i18n:

* Getting support is harder when screenshots/error messages are in a language that isn't english, because supporters may not speak it
* Development of new features, refactoring etc. is always blocked by having to translate everything new to all languages
* Increased codebase complexity
    * Harder to read
    * Harder to work with
* Lots of initial work to translate everything
    * Time/effort that could be spent better elsewhere

Now, let us look at another real-world example of i18n.

![Apple Shortcuts Example](./img/apple_shortcuts_example.png)

This is a screenshot of Apple Shortcuts running on an iPhone set to the German locale.
It is just a basic HTTP PUT with a JSON payload.
For some reason however, "Header" as in "HTTP Header" was translated to "Überschrift" which means "Headline".
Even worse, "Request body" became "Haupttext anfordern" which translated back to english means "(to) request the main text"???

![Visual Studio 2017 Example](./img/visual_studio_2017_example.png)

This is another example. Here we have the Integrated Development Environment Visual Studio 2017 made by Microsoft
attempting to open a project file that was created in an older version of Visual Studio.

Instead of asking us if we want to change the target SDK of the project file - which is called solution in Visual Studio -
it is showing us a dialog titled "Lösungsaktionen prüfen" which translates back to "check actions to solve something".
Then there's a sub-header labelled "Projekte neu ausrichten" which translates to "realign projects" (plural).

The only way I was able to decipher what that dialog even means was by opening the same project on a different system
with the locale being set to en-US.


In both examples, the actual meaning got lost in translation, which is a common issue.
Even with german being a common language and understanding of the HTTP protocol being fairly common as well.

Preventing this is hard, because you will need someone who understands the project from a technical standpoint as well as speaks the language it should be translated to.
This is also required even if the translation is done by someone else, because you still have to validate what they did.

As even huge corporations known for being user-friendly and also paired with insane budgets fail to do this all the time,
I don't think that it is actually a feasible task.
