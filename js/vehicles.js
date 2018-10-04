var vehicles = {
    list: {
        "transport": {
            name: "transport",
            pixelWidth: 31,
            pixelHeight: 30,
            pixelOffsetX: 15,
            pixelOffsetY: 15,
            radius: 15,
            speed: 15,
            sight: 3,
            cost: 400,
            hitPoints: 100,
            turnSpeed: 2,
            spriteImages: [
                { name: "stand", count: 1, directions: 8 }
            ],
        },

        "harvester": {
            name: "harvester",
            pixelWidth: 21,
            pixelHeight: 20,
            pixelOffsetX: 10,
            pixelOffsetY: 10,
            radius: 10,
            speed: 10,
            sight: 3,
            cost: 1600,
            hitPoints: 50,
            turnSpeed: 2,
            spriteImages: [
                { name: "stand", count: 1, directions: 8 }
            ]
        },

        "scout-tank": {
            name: "scout-tank",
            pixelWidth: 21,
            pixelHeight: 20,
            pixelOffsetX: 10,
            pixelOffsetY: 10,
            radius: 11,
            speed: 20,
            sight: 3,
            cost: 500,
            hitPoints: 50,
            turnSpeed: 4,
            canAttack: true,
            canAttackLand: true,
            canAttackAir: false,
            weaponType: "bullet",
            spriteImages: [
                { name: "stand", count: 1, directions: 8 }
            ]
        },

        "heavy-tank": {
            name: "heavy-tank",
            pixelWidth: 30,
            pixelHeight: 30,
            pixelOffsetX: 15,
            pixelOffsetY: 15,
            radius: 13,
            speed: 15,
            sight: 4,
            cost: 1200,
            hitPoints: 50,
            turnSpeed: 4,
            canAttack: true,
            canAttackLand: true,
            canAttackAir: false,
            weaponType: "cannon-ball",
            spriteImages: [
                { name: "stand", count: 1, directions: 8 }
            ]
        },
    },

    "defaults": {
        type: "vehicles",
        animationIndex: 0,
        direction: 0,
        action: "stand",
        orders: { type: "stand" },
        selected: false,
        selectable: true,
        directions: 8,

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
                case "stand":
                    var direction = wrapDirection(Math.round(this.direction), this.directions);
                    this.imageList = this.spriteArray["stand-" + direction];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                    }
            }
        },
        
        draw: function() {
            var x = (this.x * game.gridSize) - game.offsetX - this.pixelOffsetX;
            var y = (this.y * game.gridSize) - game.offsetY - this.pixelOffsetY;

            this.drawingX = x;
            this.drawingY = y;

            if (this.selected) {
                this.drawSelection();
                this.drawLifeBar();
            }

            var colorIndex = (this.team == "blue") ? 0 : 1;
            var colorOffset = colorIndex * this.pixelHeight;

            game.foregroundContext.drawImage(
                this.spriteSheet,
                this.imageOffset * this.pixelWidth,
                colorOffset,
                this.pixelWidth, this.pixelHeight,
                x, y,
                this.pixelWidth, this.pixelHeight
            );
        },

        drawLifeBar: function () {
            var x = this.drawingX;
            var y = this.drawingY - 2 * game.lifeBarHeight;

            game.foregroundContext.fillStyle = (this.lifeCode == "healthy") ?
                game.healthBarHealthyFillColor : game.healthBarDamagedFillColor;

            game.foregroundContext.fillRect(
                x, y, 
                this.pixelWidth * this.life / this.hitPoints, game.lifeBarHeight);
            game.foregroundContext.strokeStyle = game.healthBarBorderColor;
            game.foregroundContext.lineWidth = 1;
            game.foregroundContext.strokeRect(x, y, this.baseWidth, game.lifeBarHeight);
        },

        drawSelection: function () {
            var x = this.drawingX + this.pixelOffsetX;
            var y = this.drawingY + this.pixelOffsetY;

            game.foregroundContext.strokeStyle = game.selectionBorderColor;
            game.foregroundContext.lineWidth = 1;
            game.foregroundContext.beginPath();
            game.foregroundContext.arc(x, y, this.radius, 0, Math.PI * 2, false);
            game.foregroundContext.fillStyle = game.selectionFillColor;
            game.foregroundContext.fill();
            game.foregroundContext.stroke();
        },

        processOrders: function() {
            this.lastMovementX = 0;
            this.lastMovementY = 0;
            switch (this.orders.type) {
                case "move":
                    // move towards destination until distance from destination
                    // is less than vehicle radius
                    var distanceFromDestinationSquared = 
                        (Math.pow(this.orders.to.x - this.x, 2) + Math.pow(this.orders.to.y - this.x, 2));
                    if (distanceFromDestinationSquared < Math.pow(this.radius / game.gridSize, 2)) {
                        this.orders = { type: "stand" };
                        return;
                    } else {
                        // try to move to the destination
                        var moving = this.moveTo(this.orders.to);
                        if (!moving) {
                            // pathfinding couldn't find a path so stop
                            this.orders = { type: "stand" };
                            return;
                        }
                    }
                    break;
            }
        },

        moveTo: function(destination) {
            if (!game.currentMapPassableGrid) {
                game.rebuildPassableGrid();
            }

            // first find path to destination
            var start = [Math.floor(this.x), Math.floor(this.y)];
            var end = [Math.floor(destination.x), Math.floor(destination.y)];

            var grid = $.extend(true, [], game.currentMapPassableGrid);
            // Allow destination to be "movable" so that algorithm can find a path
            if (destination.type == "buildings" || destination.type == "terrain") {
                grid[Math.floor(destination.y)][Math.floor(destination.x)] = 0;
            }

            var newDirection;
            // if vehicle is outside map bounds, just go straight towards goal
            if (start[1] < 0 || start[1] >= game.currentLevel.mapGridHeight || 
                start[0] < 0 || start[0] >= game.currentLevel.mapGridWidth) {
                
                this.orders.path = [this, destination];
                newDirection = findAngle(destination, this, this.directions);
            } else {
                // use A* algorithm to try and find a path to the destination
                this.orders.path = AStar(grid, start, end, 'Euclidean');
                if (this.orders.path.length > 1) {
                    var nextStep = { x: this.orders.path[1].x + 0.5, y: this.orders.path[1].y + 0.5 };
                    newDirection = findAngle(nextStep, this, this.directions);
                } else if (start[0] == end[0] && start[1] == end[1]) {
                    // reached destination grid
                    this.orders.path = [this, destination];
                    newDirection = findAngle(destination, this, this.directions);
                } else {
                    // there is no path
                    return false;
                }
            }

            // calculate turn amount for new direction
            var difference = angleDiff(this.direction, newDirection, this.directions);
            var turnAmount = this.turnSpeed * game.turnSpeedAdjustmentFactor;

            // move forward, but keep turning as needed
            var movement = this.speed * game.speedAdjustmentFactor;
            var angleRadians = -(Math.round(this.direction) / this.directions) * 2 * Math.PI;
            this.lastMovementX = -(movement * Math.sin(angleRadians));
            this.lastMovementY = -(movement * Math.cos(angleRadians));
            this.x = (this.x + this.lastMovementX);
            this.y = (this.y + this.lastMovementY);

            if (Math.abs(difference) > turnAmount) {
                this.direction = wrapDirection(
                    this.direction + turnAmount * Math.abs(difference) / difference, 
                    this.directions);
            }

            return true;
        },
    },

    load: loadItem,

    add: addItem
}