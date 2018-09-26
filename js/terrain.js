var terrain = {
    list: {
        "oilfield": {
            name: "oilfield",
            pixelWidth: 40,
            pixelHeight: 60,
            pixelOffsetX: 0,
            pixelOffsetY: 40,
            baseWidth: 40,
            baseHeight: 20,

            buildableGrid: [
                [1, 1]
            ],

            passableGrid: [
                [1, 1]
            ],
            
            spriteImages: [
                { name: "hint", count: 1 },
                { name: "default", count: 1 }
            ],
        },

        "bigrocks": {
            name: "bigrocks",
            pixelWidth: 40,
            pixelHeight: 70,
            pixelOffsetX: 0,
            pixelOffsetY: 30,
            baseWidth: 40,
            baseHeight: 40,

            buildableGrid: [
                [1, 1],
                [0, 1]
            ],

            passableGrid: [
                [1, 1],
                [0, 1]
            ],

            spriteImages: [
                { name: "default", count: 1 }
            ],
        },

        "smallrocks": {
            name: "smallrocks",
            pixelWidth: 20,
            pixelHeight: 35,
            pixelOffsetX: 0,
            pixelOffsetY: 15,
            baseWidth: 20,
            baseHeight: 20,

            buildableGrid: [
                [1]
            ],

            passableGrid: [
                [1]
            ],

            spriteImages: [
                { name: "default", count: 1 }
            ],
        },
    },

    defaults: {
        type: "terrain",
        animationIndex: 0,
        action: "default",
        selected: false,
        selectable: false,
        
        animate: function() {
            // action: ['hint', 'default']
            this.imageList = this.spriteArray[this.action];
            this.imageOffset = this.imageList.offset + this.animationIndex;
            this.animationIndex++;

            if (this.animationIndex >= this.imageList.count) {
                this.animationIndex = 0;
            }
        },

        draw: function() {
            var x = (this.x * game.gridSize) - game.offsetX - this.pixelOffsetX;
            var y = (this.y * game.gridSize) - game.offsetY - this.pixelOffsetY;

            var colorOffset = 0; // no team based colors
            game.foregroundContext.drawImage(
                this.spriteSheet,
                this.imageOffset * this.pixelWidth,
                colorOffset,
                this.pixelWidth, this.pixelHeight,
                x, y,
                this.pixelWidth, this.pixelHeight

            );
        }
    },

    load: loadItem,

    add: addItem
}