var maps = {
    "singleplayer": [
        {
            "name": "Introduction",
            "briefing": "In this level you will learn how to pan across the map.\n\nDon't worry! We will be implementing mode features soon.",
            "mapImage": "images/maps/level-one-debug-grid.png",
            "startX": 4,
            "startY": 4,

            "requirements": {
                "buildings": ["base"],
                "vehicles": [],
                "aircraft": [],
                "terrain": [],
            },

            "items": [
                {
                    "type": "buildings",
                    "name": "base",
                    "x": 11,
                    "y": 14,
                    "team": "blue"
                },
                {
                    "type": "buildings",
                    "name": "base",
                    "x": 12,
                    "y": 16,
                    "team": "green"
                },
                {
                    "type": "buildings",
                    "name": "base",
                    "x": 15,
                    "y": 15,
                    "team": "green",
                    "life": 50
                }
            ]
        },
    ]
};