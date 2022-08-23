const CapabilityRouter = require("./CapabilityRouter");
const crypto = require("crypto");
const Logger = require("../../Logger");
const ValetudoWifiConfiguration = require("../../entities/core/ValetudoWifiConfiguration");

class WifiConfigurationCapabilityRouter extends CapabilityRouter {
    constructor(options) {
        super(options);

        this.keyPair = {
            type: "rsa",
            privateKey: undefined,
            publicKey: undefined
        };
    }
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getWifiStatus());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        /*
            Because I have known the internet for a while, I expect that this feature may raise eyebrows for some,
            which usually leads to less-than-productive online discussions.
            
            To combat that, I have prepared this extensive comment to explain what we're doing and why
            You can delete that "omg omg they roll their own crypto they're soooo dumb haha" tweet now

            
            The situation is as follows:
            1. Provisioning of the robot is usually done over an unencrypted Wi-Fi Access Point provided by the robot.
            2. Sending your Wi-Fi password over HTTP REST over that unencrypted Wi-Fi AP allows a passively sniffing
               attacker to capture that provisioning request and thus gain access to your home network
            3. Provisioning is usually only done once, takes very little time and usually happens at home/in a residential
               area instead of a public space like a starbucks or an airport, where it would be likely to encounter
               a malicious actor
               
               
            Due to 3, the attack surface is actually pretty limited. It is highly unlikely that someone would actually
            sniff your Wi-Fi traffic at your house at the exact moment you're provisioning your new robot.
            
            Furthermore, due to HTTPS currently (2022-08-20) not accounting for setups in which a service doesn't have
            a globally unique identity proven by their domain name, just using HTTPS for the provisioning process is not
            reasonably possible, as self-signed certificates are annoying to deal with, raise warnings in the browser etc.
            Stuff that simply isn't worth the trouble when the risk is as low as it is here to begin with.
            
            But do we need HTTPS to improve security of this process? I'd argue no.
            
            What do we get from using HTTPS?
            A. Encryption of the transmitted data
            B. A way to ensure that whoever we're talking to is actually who we expected them to be
            
            Given that someone MITM'ing the communication between your robot and the device used to provision it
            on the Wi-Fi network provided by the robot is exceptionally unlikely, we don't need B.
            
            It would surely be nice to have B by utilizing HTTPS, however not only would that come with a worse UX due
            to the user having to click through warnings in their browser etc. but it also would not solve B in our
            scenario(!), as there is no way of knowing if the certificate presented to you is actually the one issued by
            the webserver and wasn't created by someone MITM'ing the connection.
            
            Therefore, we can solely focus on A:
            By harnessing the power of asymmetric cryptography, the user can encrypt their Wi-Fi credentials in a way
            that can't be decrypted just by passively sniffing Wi-Fi traffic in the area.
            As soon as the robot is provisioned, the encryption of the Wi-Fi network then provides some layer of
            protection against that passive sniffing scenario.
            
            As you can see, this approach offers a real benefit for the user without impacting the UX at all.
            It doesn't achieve 100% of what using HTTPS would achieve, however that was never the goal to begin with nor
            would've HTTPS worked in this scenario as explained above.
            
            By understanding that life has nuances and therefore looking at the context and details of a problem at hand
            instead of just repeating dogmatic truths over and over again, one can make an informed decision to do 
            something slightly different from the established best-practices.
            
            If you're still unhappy and want to do something about this heresy against the gods of cryptography,
            consider rallying for an extension of the HTTPS spec to allow for some way of ensuring the identity of
            something without requiring a global domain name so that we may one day have proper HTTPS in non-cloud places.
            
            
            Side-note:
            Valve does it too ;-)
            https://web.archive.org/web/20210108003523/https://owlspace.xyz/cybersec/steam-login/
         */
        this.router.get("/getPublicKeyForProvisioning", async (req, res) => {
            const keyPair = await this.getKeyPair();

            if (keyPair !== null) {
                res.json({
                    type: keyPair.type,
                    publicKey: keyPair.publicKey.export({
                        type: "spki",
                        format: "pem"
                    })
                });
            } else {
                res.sendStatus(500);
            }
        });

        // Decrypting inside this middleware allows us to continue using the validator middleware further down the chain
        this.router.use(async (req, res, next) => {
            if (req.body?.encryption === "rsa" && typeof req.body.payload === "string") {
                const decryptedPayload = await this.decryptPayload(req.body.payload);

                if (decryptedPayload !== null) {
                    req.body = decryptedPayload;

                    next();
                } else {
                    res.sendStatus(400);

                    return;
                }
            } else {
                next();
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            try {
                await this.capability.setWifiConfiguration(new ValetudoWifiConfiguration(req.body));
                res.sendStatus(200);
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });
    }

    /**
     * @private
     * @returns {Promise<{privateKey: crypto.KeyObject, publicKey: crypto.KeyObject, type: string}|null>}
     */
    async getKeyPair() {
        if (!this.keyPair.publicKey) {
            try {
                this.keyPair = await new Promise((resolve, reject) => {
                    crypto.generateKeyPair(
                        "rsa",
                        {
                            modulusLength: 2048
                        },
                        (err, publicKey, privateKey) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    type: "rsa",
                                    publicKey: publicKey,
                                    privateKey: privateKey
                                });
                            }
                        }
                    );
                });
            } catch (err) {
                Logger.error("Error while generating KeyPair for WiFi Provisioning", err);

                return null;
            }
        }

        return this.keyPair;
    }

    /**
     * @private
     * @param {string} payload base64
     * @returns {Promise<null|object>}
     */
    async decryptPayload(payload) {
        const keypair = await this.getKeyPair();

        if (keypair === null) {
            return null;
        }

        try {
            const decryptedPayload = crypto.privateDecrypt(
                {
                    key: this.keyPair.privateKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING
                },
                Buffer.from(payload, "base64")
            ).toString("utf-8");

            return JSON.parse(decryptedPayload);
        } catch (err) {
            Logger.error("Error while decrypting encrypted wifi provisioning payload", err);

            return null;
        }
    }
}

module.exports = WifiConfigurationCapabilityRouter;
