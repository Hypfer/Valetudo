---
title: Why not Valetudo?
category: General
order: 7
---

# Why not Valetudo?

After having read through the [Why Valetudo?](https://valetudo.cloud/pages/general/why-valetudo.html) page,
you might also be wondering why you might **not** want to use Valetudo.
To answer those questions, here's a list of a few common reasons in an attempt to reduce the amount of some incredibly exhausting discussions.

**Always remember:**<br/>
The only person forcing you to use Valetudo is yourself. Using Valetudo is **your own conscious decision**.

If the things listed here are a deal-breaker to you then that's fine. It's completely reasonable to have different
opinions and thoughts on these things. You just won't be happy with Valetudo then.<br/><br/>
Thank you for not acting entitled.

## Valetudo is opinionated software

_Opinionated software_ means that the software has a clear vision on how things should work, what it should do and also what it should not do.
Valetudo is a piece of software that you could call _opinionated software_ that is used by the developer himself on a daily basis.

Usually, this is great, as - if you follow the laid out paths - things will _just work_, because someone else not only
ran into the problems associated with those but also already fixed any issues and built strong guide rails that keep you on the path and out of any trouble.
It's smooth sailing. Set-up and forget about it. Nothing can ever majorly go wrong as it's all already planned-out.

Where this can become something frustrating however is when your vision is misaligned with the vision of the project.
You might find yourself angry because you "only want to do that one thing" but it's super hard and annoying to do so.

Keep in mind that it's possible that you might just not be the target audience.
Even if at first Valetudo sounded cool to you, it may not be a good fit.
That's fine. It doesn't have to be. Neither do you have to change nor does the project.

Sometimes it's just not working out. You should see other software.

## Valetudo replaces the Cloud

First of all, it should be noted that Valetudo is a cloud replacement, meaning that it replaces the cloud.<br/>
As it stops all connectivity to the vendor cloud, the vendor app will also stop working.

It is **not possible** to use Valetudo and the vendor app simultaneously.

## Reverting to stock might be hard or impossible

While there are some models of robots that can be easily reverted to stock firmware and cloud, for most of them, rooting
and installing Valetudo is a pretty much permanent change.

If you're looking for an experience similar to trying out a Linux Live CD, this is not it.<br/>
If you're unsure whether or not you should install Valetudo, the answer is no, you should not install Valetudo.

## Valetudo is Valetudo

Valetudo is a solution for wanting _a_ vacuum robot that works local only. It is not "$VENDOR but without the cloud".

Here's how that works:

✔ "I want to use Valetudo. This robot looks supported so I will use that."<br/>
❌ "I want to use this robot but I don't like the cloud dependency of it. Guess I'll use Valetudo."


This is _very important_ to understand as it means that **feature parity** with the vendor apps is a **non-goal** for the project.
Instead, **feature completeness** for the Valetudo project is defined as "it does what it set out to do", which in this case means "a vacuum robot that works local only".
That _can_ include new and fancy features, yes, but it doesn't _have_ to do that.

While it's certainly understandable that one would want all the features of Vendor Model XYZ but without the cloud, this is simply not the right project for that.

<details>
<summary>"Why is this so important?", you may ask. (Click here for rant)</summary>
<br/>
Good question!<br/>
<br/>
<p>
In commercial products, there are forces at play that constantly push towards adding more and more features. 
It doesn't matter if they bring something valuable to the table or even make sense at all.
What matters is that the number of features of product A is higher than the number of features of product B, as customers use that number to make their buying decisions.
</p>
<p>
The issue with that however is that that's simply not a useful metric to judge the value of a product.
In fact, a lot of products will eventually reach a point, where every additional feature makes them worse due to complexity of use, instability, 
severe security vulnerabilities and other undesirable stuff that I'm sure you've already seen and felt many times.
Usually, soon after, the product collapses under its own weight and something new comes along, repeating the same cycle again.
</p>
<p>
However, as Valetudo is <strong>not a commercial product</strong> it <strong>doesn't have to follow the same playbook</strong>.
Again, it <i>could</i> do that, yes, but that would be bad because that cycle is quite frankly just utterly insane.
</p>

</details>


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

## No multi-floor/multi-map support

Due to various major technical limitations, Valetudo does not support and will not support multiple maps.
If you need multiple maps, Valetudo likely won't be an option for you.

Not having multi-floor support actually isn't something all too terrible though, as investing in a second robot greatly improves the usefulness of the unit.
Having to manually carry the robot to another floor very much degrades the benefits of a fully automated vacuum robot.
This "fire and forget" mode of operation was why you've considered to buy a vacuum robot in the first place, remember?

As far as financial reasons are concerned, 200€ should be more than enough to buy a factory new supported one even featuring LIDAR.
If you're happy with buying a used unit, at least here in germany, supported ones usually cost around 70-125€ (2023-06-10)

Rationally, there's a need (automated cloud-free cleaning on every floor) and there's also a budget for that.
Make your buying decisions based on that and that alone instead of some arbitrary made-up additional constraint such as
"Having more than one vacuum robot is insane!!111 I mean... Two robots! Who does that?!?!".

We've been working a lot on making that buying decision easier for you by supporting more robots and enhancing the support
for existing ones so that it should be possible for everyone to afford 1-n supported robots.

<details>
<summary>"But why?" (Click here for rant)</summary>
<br/>
<p>
"Surely this must be possible." you might think.<br/>
And, well, yeah. Kinda. But also Kinda not.<br/>
</p>
<p>
If you only have one robot by one vendor with one firmware version - as you usually do if you're looking for this feature -
then you're looking at a completely different problem space than when you're a project that strives for long-term sustainability
and currently supports more than 20 robots by three vendors with likely more to come in the future.
</p>

<p>
It will appear as an easy problem to solve/easy thing to implement because it is.<br/>
Because you dropped most of the requirements.
</p>
<br/>
<p>
For the project, a non-exhaustive list of requirements looks like this:
</p>
<ul>
<li>do not build something that will only work with one vendor</li>
<li>do not break the current architecture</li>
<li>do not complicate the architecture so much that it will collapse under its own weight 18 months from now</li> 
<li>do not resort to ugly hacks that restart core OS processes and/or swap files on disk</li>
<li>do not make maintaining the code unpleasant</li>
</ul>

<p>
If you ignore all that then yes, it would be possible to implement some amount or some <i>kind</i> of multi-floor support.<br/>
However, if you do that, then you'd end up with a different software project with entirely different goals.<br/>
One that will very likely not survive long-term.
</p>

<p>

While I have spent a lot of time investigating the issue to come to this conclusion, you - the angry reader that absolutely
will not just be buying another used robot for 80€ to solve the problem in a much better way - are of course free to prove me wrong.
<br/>
I will happily admit that I misjudged the problem if someone comes along and implements proper multi-floor support
<strong>while also sticking to the requirements set out</strong> and <strong>not just dropping half of them</strong> and calling it a day.

</p>

<p>
Please <strong>only</strong> contact me about it when you're <strong>completely done</strong> with <strong>all of it</strong>.
You personally.
Not the magic invisible entity named "the community" that will just appear out of thin air and do your job for you
because you really really really want this feature.
</p>

<p>
This means
</p>
<ul>
<li>Solid and fully thought-out architecture</li>
<li>full implementation</li>
<li>no to-dos</li>
<li>tested with <strong>all supported robots</strong></li>
<li>etc.</li>

</ul>

<p>
I'll await your e-mail.
</p>

</details>

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
