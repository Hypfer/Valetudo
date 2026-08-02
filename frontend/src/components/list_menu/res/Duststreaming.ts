export const DuststreamingLecture = `
Hey,

Quick pause for a second.

You're about to enable a feature that is really cool, but also fundamentally changes your whole threat model.<br/>
And not just for you but **also(!)** for the people that live with you or might visit you.

Where previously a vacuum robot was just a vacuum robot, it can now act as a hidden spy cam, leaving bystanders with absolutely no way of knowing they might be recorded.

This is bad for third-parties like your partner or visiting friends, because privacy is a fundamental human right. Disregarding it - even just through lack of care - may result in loss of trust, loss of faith and all the downstream consequences that follow.
Additionally, it is simply bad for you too, because it might affect you in the same way, as any network connected device might at one point be controlled by a possibly hostile third-party.

Therefore, anyone visiting your space **needs** to be aware that someone or something may be watching them through the robot.
This is an ethical requirement, and, depending on where you live, it might also be a legal requirement.

Because you are affected in the exact same way, you need to stay aware of this too.
You will, however, eventually, forget that that is the case, and you should plan for that likely inevitable outcome.

It might make sense to play around with this feature for a while, have some fun and then just disable it again instead of letting the capability linger unused, ready to be misused.
While doing so, you will see just how inconspicuous it is, and just how much these bots can see.

In a better world, vendors would build robots with cameras that have hardwired activity LEDs. And, ideally, they would work fully offline.

<br/>

**Note**:

This feature comes with an unauthenticated remote killswitch, enabling weird internet vigilantes to do damage control while doomscrolling accidentally exposed IoT on shodan. That however only somewhat helps and only does so against outside threats, which are the far less likely failure mode here.

It should go without saying that surveillance fundamentally cannot fix a lack of trust, even though security vendors would love to make you believe otherwise.
More cameras do not make your home more secure and they certainly can't fix relationships either.

- Do not unilaterally decide to enable this in secret.
- Do not ask for consent in a way engineered so that saying yes is the only easy option.
- Do not place the burden of refusal on the other party.
- Do not take lack of complaining as consent.

Essentially, resist the defaults.<br/>
Be the antithesis to current market trends: make opting out and saying no entirely frictionless.

We do have to live in this world, but we do not have to be part of it.<br/>
Now go have some ethical™ fun.
`;

export const DuststreamingInstallInstructions = (binaryPath: string | undefined): string => {
    return `
The video capture, processing and encoding part of the camera streaming feature lives in the gstreamer-based [duststreamer](https://github.com/hypfer/duststreamer).
That is yet again another statically linked single binary to be dropped onto the robot - and also to be yeeted away to make camera streaming technically impossible again.

To complete the setup, place an executable \`duststreamer\` binary at \`${binaryPath}\` and refresh.
`;
};
