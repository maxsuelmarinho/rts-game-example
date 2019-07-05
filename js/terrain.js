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
                { name: "stand", count: 1 }
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
                { name: "stand", count: 1 }
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
                { name: "stand", count: 1 }
            ],
        },
    },

    defaults: {
        type: "terrain",
        selectable: false,

        animate: function() {
            // no need to do a health check for terrain. Just call processActions
            this.processActions();
        },

        processActions: function() {
            // since there is no animation or special handling, just set imageList based on action
            this.imageList = this.spriteArray[this.action];
            this.imageOffset = this.imageList.offset;
        },

        drawSprite: function() {
            let x = this.drawingX;
            let y = this.drawingY;

            var colorOffset = 0; // no team based colors for terrain
            game.foregroundContext.drawImage(this.spriteSheet,
                this.imageOffset * this.pixelWidth, colorOffset, 
                this.pixelWidth, this.pixelHeight,
                x, y,
                this.pixelWidth, this.pixelHeight);
        },

        /*
        animationIndex: 0,
        action: "default",
        selected: false,
        
        
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
        */
    },

    load: loadItem,

    add: addItem
}