/* eslint-disable */

const CHARACTERS = {
    "N": [
        [0,0],
        [0, 3],
        [3, 0],
        [3, 3],
        [3, 0]
    ],
    "O": [
        [0,0],
        [0.5,0],
        [0.5,3],
        [2.5,3],
        [2.5,0],
        [0.5,0],
        [3,0]
    ],
    "WHITESPACE": [
        [0,0]
    ],
    "M": [
        [0,0],
        [0.5,3],
        [1.5,1],
        [2.5,3],
        [3,0]
    ],
    "A": [
        [0,0],
        [1.5,3],
        [3,0],
        [2.5,1],
        [0.5,1],
        [2.5,1],
        [3,0]
    ],
    "P": [
        [0,0],
        [0,3],
        [1,3],
        [2,2],
        [1,1],
        [0,1],
        [0,0],
        [3,0]
    ],
    "D": [
        [0,0],
        [0,3],
        [2,3],
        [3,1.5],
        [2,0],
        [0,0],
        [3,0]
    ],
    "T": [
        [0,0],
        [1.5,0],
        [1.5,3],
        [0,3],
        [3,3],
        [1.5,3],
        [1.5,0],
        [3,0]
    ],
    "V": [
        [0,0],
        [1.5,0],
        [0,3],
        [1.5,0],
        [3,3],
        [1.5,0],
        [3,0]
    ],
    "L": [
        [0,0],
        [0.5,0],
        [0.5,3],
        [0.5,0],
        [0.5,3],
        [0.5,0],
        [2,0],
        [0.5,0],
        [3,0]
    ],
    "U": [
        [0,0],
        [0.5,0],
        [0.5,3],
        [0.5,0],
        [2.5,0],
        [2.5,3],
        [2.5,0],
        [0.5,0],
        [3,0]
    ],
    "E": [
        [0,0],
        [0.5,0],
        [0.5,3],
        [2.5,3],
        [0.5,3],
        [0.5,1.5],
        [2,1.5],
        [0.5,1.5],
        [0.5,0],
        [2.5,0],
        [0.5,0],
        [3,0]
    ]
};

const TEXT = [
    "WHITESPACE",
    "N",
    "O",
    "WHITESPACE",
    "M",
    "A",
    "P",
    "WHITESPACE",
    "D",
    "A",
    "T",
    "A",
    "WHITESPACE"
];

const FACTOR = 400;

const currentPos = {
    x: 25600,
    y: 25600
};

const PATH = [];

TEXT.forEach(letterId => {
    const char = CHARACTERS[letterId];

    char.forEach(nextMove => {
        PATH.push([currentPos.x + nextMove[0] * FACTOR, currentPos.y - nextMove[1] * FACTOR]);
    });


    if (letterId !== "WHITESPACE") {
        currentPos.x += 6 * (FACTOR*0.75);
    } else {
        currentPos.x += 2*FACTOR;
    }

});

const MAP_BORDERS = {
    x0: (PATH[0][0]/50) - 5,
    y0: (PATH[0][1]/50) - 5,

    x1: (PATH[PATH.length-1][0]/50) + 5,
    y1: ((PATH[PATH.length-1][1] + (3 * FACTOR))/50) + 5
};

const FLOOR = [];
const WALL = [];

for (let i = MAP_BORDERS.x0 + 1; i <= MAP_BORDERS.x1 - 1 ; i++) {
    for (let j = MAP_BORDERS.y0 + 1; j <= MAP_BORDERS.y1 - 1 ; j++) {
        FLOOR.push([i,1024-j]);
    }
}

for (let i = MAP_BORDERS.x0; i <= MAP_BORDERS.x1 ; i++) {
    WALL.push([i,1024-MAP_BORDERS.y0]);
    WALL.push([i,1024-MAP_BORDERS.y1]);
}

for (let i = MAP_BORDERS.y0; i <= MAP_BORDERS.y1 ; i++) {
    WALL.push([MAP_BORDERS.x0,1024-i]);
    WALL.push([MAP_BORDERS.x1,1024-i]);
}

console.log(JSON.stringify({
    "map_index": 0,
    "map_sequence": 0,
    "image": {
        "position": {
            "top": 0,
            "left": 0
        },
        "dimensions": {
            "height": 1024,
            "width": 1024
        },
        "pixels": {
            "floor": FLOOR,
            "obstacle_weak": [],
            "obstacle_strong": WALL
        }
    },
    "path": {
        "current_angle": 0,
        "points": PATH
    },
    "charger": PATH[0],
    "robot": PATH[PATH.length-1],
    "isDefaultMap": true
}
));