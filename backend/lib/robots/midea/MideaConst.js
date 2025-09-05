
/*
openssl req -x509 -newkey rsa:2048 -nodes -keyout dummy_client.key -out dummy_client.crt -sha256 -days 36500 -subj "/CN=ValetudoDummyClient"
 */
const DUMMY_CLIENT_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcTZAsDj4J2iVy
VJFEtz6xAZOLoAzAI02MRDgRhOb5Abbwg3GJ2nfM9GHBXGSyC1X5UPLFMSe4TI/C
Woajcf67Ru7xlPkDwb1i5QkzmVenJmflWH/vmvlKU421asFsvUXO2T80EPxoQ5B5
viffA6dujcPFmvu4IN+oKp+TcdXXI/fAleiT3UMKOubD8drWXSVWTDNMpN5BNE1j
sPYN14rSCMCbcoPSa8tGzK1khMiClVWYRGXPz0Xk2D+4b1/fuFEunQ259pnneoa4
ohe44NYfSo/iu92RLYHIia1SXQaU9MwqrsD5APT7zo+y9dMqVrLJSAXRJqCCCrsP
DT1BQ4TNAgMBAAECggEAD38dPxwZXRQNQkeUmGLTdBwKRu4RN4rEL7O0xfa1UJrA
RZbZa7sEZlRic/mN08BcYddB3IEirCImkqNPiTvBkWbh8/hos8zzB3vY89o7gjR/
ZnCdPzuFgaby9un1hTKjMHOzsHPpbWQjS40GvPdC1dH/DW1je4ZEdU3aP8LoKePq
Y6QEI3Wb6LqG/qM7x2TiFgsRbChkJeZNo8c5rl5puLd4cxjyLifeERTxtAoM6mCJ
mD8gindVThFWxUY+O92DIX7T9JUwM059dBZfe9wSCXX84a5blMiBeq9Q7ilEwPUi
jwpudJwJJ/7Q/9FjgRrSyPr/L7aeVFG2Uw11C4N0eQKBgQDnaR5vREUveFlAKTyy
cttDo4jPriPpIjtG9OHSeyg5K/gQJ7X94IngroxW2qkKXR8hbStdTNRt0Rg7DQpS
HFJwGnD21SWE7FBT30p1XyVpABAmyOL3MhfW+hEMOw3vxc/1k8mzBcjg7YY1zNl7
KLMyAaiKWiOknemirXVcqqgMywKBgQDztkq6T9SHnKFcWYBEyTRHDBrTR8Yh+WiO
0EY6eXfkvos86kYrlutYKT5LmYgroXA1PEW/dHAHM3pyQSmNJXsJcyIfz8Mn1ZZU
6coNg2fNN6kfClc4KVNK5KO+N/NM4l0sithPa1yhjFctqR2aZQWT5LvLR5k/663j
I75Mta1ZxwKBgGrZCohtiVRlyS/q2m+6wKr2c1ERItueRqh4oVxCKUxclOlArLNQ
Xdk0PvBLfgme/aS9d2xY8SzTgtChMMbA9P919frCZ9R8GIrhasvO5sMYmFyQHNvu
cTt9sylmiwTO3TqSxmq2nQ3eHj3xG+nV3QeV5HAdNp/nmdzXIn1q/rUJAoGAVPfs
S9LDVViNhYYKy3Ce0lptC9aNRJERHCGPKpno7A5muyEuv8nJWZ5fgroPmK6bUWQn
KR3uZQRUn3sKgpRbtiq27gJglwXHeOldsaJr0UejphfT2tfFm2nlkM8u+1I8i+gI
jH/w9r3YMyowEQFBlZN8yd23l2qS4Is4sMPyoUcCgYEAi4ukkRVRM/PsM2v+MW0U
uu0nXu44Lcq05RoO93f+LdcUibNRIBIpNDU7vH6RuPdmRVFRQCBvmhzslszusm4V
lxTSqhOpa5h/S+cFspmPbgIOq1mwM1VEGU6KLrcl5mnz60VkBsVDFfKE0Ni9sN2T
THzNXxIdC+dgFxqRGL6BELk=
-----END PRIVATE KEY-----
`;

const DUMMY_CLIENT_CERT = `-----BEGIN CERTIFICATE-----
MIIDHzCCAgegAwIBAgIUVboURMYBW4WYeT/IQhL2uf9bomUwDQYJKoZIhvcNAQEL
BQAwHjEcMBoGA1UEAwwTVmFsZXR1ZG9EdW1teUNsaWVudDAgFw0yNTA3MDkxODM2
MjJaGA8yMTI1MDYxNTE4MzYyMlowHjEcMBoGA1UEAwwTVmFsZXR1ZG9EdW1teUNs
aWVudDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANxNkCwOPgnaJXJU
kUS3PrEBk4ugDMAjTYxEOBGE5vkBtvCDcYnad8z0YcFcZLILVflQ8sUxJ7hMj8Ja
hqNx/rtG7vGU+QPBvWLlCTOZV6cmZ+VYf++a+UpTjbVqwWy9Rc7ZPzQQ/GhDkHm+
J98Dp26Nw8Wa+7gg36gqn5Nx1dcj98CV6JPdQwo65sPx2tZdJVZMM0yk3kE0TWOw
9g3XitIIwJtyg9Jry0bMrWSEyIKVVZhEZc/PReTYP7hvX9+4US6dDbn2med6hrii
F7jg1h9Kj+K73ZEtgciJrVJdBpT0zCquwPkA9PvOj7L10ypWsslIBdEmoIIKuw8N
PUFDhM0CAwEAAaNTMFEwHQYDVR0OBBYEFG0w3IIqzW+Wm8Eul+uwm96t1fNHMB8G
A1UdIwQYMBaAFG0w3IIqzW+Wm8Eul+uwm96t1fNHMA8GA1UdEwEB/wQFMAMBAf8w
DQYJKoZIhvcNAQELBQADggEBANJ4ejxINHp6Say0Q92ytpkHz27fwWWeCq1FRR2i
X2MCPaSl6djg+AdoQ/LOXuOJ516OofCNxyGlTDCfOxguD6CV8ttA8jh4EGo+Jmen
ezfmGR4I6DzMKTiOdu2Qd6EVajVXLMZZfBJUNNs1tmtWhtUk2P4IJqn/lqeib7un
zzq/W47Y0MGPL4UmGyp0mwaVjj9LMN0NL8EEQhhG6SkLGE4SUXfeiqAfzrYP/PdB
tkciowVpUEiXK0tg/t8EgHj+sW9vUqX6ovKDx5Hy2nczd2CruRxHUieSQKX+zajv
8REhl/azGTE4XmSqFfs5sdm2dWIFudNMZoT+tkxR/pQB1ts=
-----END CERTIFICATE-----
`;

const AI_OBSTACLE_IDS = Object.freeze({
    "1": "Shoes",
    "2": "Trash can",
    "3": "Pet bowl",
    "4": "Weighing scale",
    "5": "Textiles",
    "6": "Entrapping furniture",
    "7": "Electric wire",
    "8": "Charging base",
    "9": "Feces",
    "11": "Liquid Stain",
    "12": "Solid Stain",
    "13": "Mixed Solid and Liquid Stain",
    "16": "Pet",
    "17": "Pet",
    "18": "Pedestal",
    "19": "Fall Hazard",
    "20": "Floor mirror",
    "22": "Stuck Hazard / Base",
    "24": "Power strip",
    "25": "Obstacle",
    "30": "Obstacle",
    "31": "Obstacle",
    "32": "Pet supplies",
    "33": "Obstacle",

    "99": "Unknown Obstacle",

    "4001": "Grain Stain",
    "4002": "Dust Stain",
    "4003": "Liquid Stain",
    "4004": "Mixed Solid and Liquid Stain",

    "65534": "Socks",
});

module.exports = {
    DUMMY_CLIENT_CERT: DUMMY_CLIENT_CERT,
    DUMMY_CLIENT_KEY: DUMMY_CLIENT_KEY,
    AI_OBSTACLE_IDS: AI_OBSTACLE_IDS
};

