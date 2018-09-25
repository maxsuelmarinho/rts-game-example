var aircraft = {
    list: {
        "chopper": {
            name: "chopper",
            pixelWidth: 40,
            pixelHeight: 40,
            pixelOffsetX: 20,
            pixelOffsetY: 20,
            radius: 18,
            speed: 25,
            sight: 6,
            cost: 900,
            hitPoints: 50,
            turnSpeed: 4,
            spriteImages: [
                { name: "fly", count: 1, directions: 8 }
            ],
            weaponType: "heatseeker",
            canAttack: true,
            canAttackLand: true,
            canAttackAir: true,
            pixelShadowHeight: 40,
        },
        "wraith": {
            name: "wraith",
            pixelWidth: 30,
            pixelHeight: 30,
            pixelOffsetX: 15,
            pixelOffsetY: 15,
            radius: 15,
            speed: 40,
            sight: 8,
            cost: 600,
            hitPoints: 50,
            turnSpeed: 4,
            spriteImages: [
                { name: "fly", count: 1, directions: 8 }
            ],
            weaponType: "fireball",
            canAttack: true,
            canAttackLand: false,
            canAttackAir: true,
            pixelShadowHeight: 40,
        },
    },

    "defaults": {
        type: "aircraft",
        animationIndex: 0,
        direction: 0,
        directions: 8,
        action: "fly",
        selected: false,
        selectable: true,
        orders: { type: "float" },

        animate: function() {
            if (this.life > this.hitPoints * 0.4) {
                this.lifeCode = "healthy";
            } else if (this.life <= 0) {
                this.lifeCode = "dead";
                game.remove(this);
                return;
            } else {
                this.lifeCode = "damaged";
            }

            switch (this.action) {
                case "fly":
                    var direction = this.direction;
                    this.imageList = this.spriteArray["fly-" + direction];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                    }
                    break;
            }
        },

        draw: function() {
            var x = (this.x * game.gridSize) - game.offsetX - this.pixelOffsetX;
            var y = (this.y * game.gridSize) - game.offsetY - this.pixelOffsetY - this.pixelShadowHeight;

            var colorIndex = (this.team == "blue") ? 0 : 1;
            var colorOffset = colorIndex * this.pixelHeight;
            var shadowOffset = this.pixelHeight * 2;

            game.foregroundContext.drawImage(
                this.spriteSheet,
                this.imageOffset * this.pixelWidth,
                colorOffset,
                this.pixelWidth, this.pixelHeight,
                x, y,
                this.pixelWidth, this.pixelHeight
            );

            game.foregroundContext.drawImage(
                this.spriteSheet,
                this.imageOffset * this.pixelWidth,
                shadowOffset,
                this.pixelWidth, this.pixelHeight,
                x, y + this.pixelShadowHeight,
                this.pixelWidth, this.pixelHeight
            );
        }
    },

    load: loadItem,

    add: addItem

}