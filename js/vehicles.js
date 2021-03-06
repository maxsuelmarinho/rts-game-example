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
            pixelHeight: 21,
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
            var interpolatedX = this.lastMovementX * game.drawingInterpolationFactor * game.gridSize;
            var interpolatedY = this.lastMovementY * game.drawingInterpolationFactor * game.gridSize;
            var x = (this.x * game.gridSize) - game.offsetX - this.pixelOffsetX + interpolatedX;
            var y = (this.y * game.gridSize) - game.offsetY - this.pixelOffsetY + interpolatedY;

            this.drawingX = x;
            this.drawingY = y;

            if (this.selected) {
                this.drawSelection();
                this.drawLifeBar();
            }

            if (game.debug) {
                this.drawMovePath();
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

        drawMovePath: function () {
            if (this.orders.path) {
                for (var i = 0; i < this.orders.path.length; i++) {
                    console.log("Drawing path", this.orders.path[i]);
                    var x = ((this.orders.path[i].x * game.gridSize) - game.offsetX) + game.gridSize * 0.5;
                    var y = ((this.orders.path[i].y * game.gridSize) - game.offsetY) + game.gridSize * 0.5;

                    game.foregroundContext.strokeStyle = game.selectionBorderColor;
                    game.foregroundContext.beginPath();
                    game.foregroundContext.arc(x, y, 4, 0, Math.PI * 2, false);
                    game.foregroundContext.fillStyle = game.selectionFillColor;
                    game.foregroundContext.fill();
                    game.foregroundContext.stroke();
                }
            }
        },

        // Steering Behaviors for Autonomous Characters:
        // http://www.red3d.com/cwr/steer/
        processOrders: function() {
            this.lastMovementX = 0;
            this.lastMovementY = 0;
            var target;
            switch (this.orders.type) {
                case "move":
                    // move towards destination until distance from destination
                    // is less than vehicle radius
                    var distanceFromDestinationSquared =
                        Math.pow(this.orders.to.x - this.x, 2) + Math.pow(this.orders.to.y - this.y, 2);
                    if (distanceFromDestinationSquared < Math.pow(this.radius / game.gridSize, 2)) {
                        this.orders = { type: "stand" };
                        console.log("Vehicle stand:", "Stop when within one radius of the destination");
                        return;
                    } else if (this.colliding && (distanceFromDestinationSquared < Math.pow(this.radius * 3 / game.gridSize, 2))) {
                        // Stop when within 3 radius of the destination if colliding with something
                        this.orders = { type: "stand" };
                        return;
                    } else {
                        if (this.colliding && 
                            (distanceFromDestinationSquared < Math.pow(this.radius * 5 / game.gridSize, 2))) {
                            
                            // count collisions within 5 radius distance of goal
                            if (!this.orders.collisionCount) {
                                this.orders.collisionCount = 1;
                            } else {
                                this.orders.collisionCount++;
                            }

                            // stop if more than 30 collisions occur
                            if (this.orders.collisionCount > 30) {
                                this.orders = { type: "stand" };
                                return;
                            }
                        }

                        // try to move to the destination
                        var moving = this.moveTo(this.orders.to);
                        if (!moving) {
                            // pathfinding couldn't find a path so stop
                            this.orders = { type: "stand" };
                            console.log("Vehicle stand:", "pathfinding couldn't find a path so stop");
                            return;
                        }
                    }
                    break;
                case "deploy":
                    // if oilfield has been used already, then cancel order
                    if (this.orders.to.lifeCode == "dead") {
                        this.orders = { type: "stand" };
                        return;
                    }

                    // move to middle of oil field
                    var target = {
                        x: this.orders.to.x + 1,
                        y: this.orders.to.y + 0.5,
                        type: "terrain"
                    };

                    var distanceFromTargetSquared = 
                        Math.pow(target.x - this.x, 2) + Math.pow(target.y - this.y, 2);
                    if (distanceFromTargetSquared < Math.pow(this.radius * 2 / game.gridSize, 2)) {
                        // after reaching oil field, turn harvester to point towards left (direction 6)
                        var difference = angleDiff(this.direction, 6, this.directions);
                        var turnAmount = this.turnSpeed * game.turnSpeedAdjustmentFactor;
                        if (Math.abs(difference) > turnAmount) {
                            this.direction = wrapDirection(
                                this.direction + turnAmount * Math.abs(difference) / difference, this.directions);
                        } else {
                            // once it is pointing to the left, remove the harvester and oil field
                            // and deploy a harvester building
                            game.remove(this.orders.to);
                            this.orders.to.lifeCode = "dead";
                            game.remove(this);
                            this.lifeCode = "dead";
                            game.add({
                                type: "buildings",
                                name: "harvester",
                                x: this.orders.to.x,
                                y: this.orders.to.y,
                                action: "deploy",
                                team: this.team
                            });
                        }
                    } else {
                        var moving = this.moveTo(target);
                        // Pathfinding couldn't find a path, so stop
                        if (!moving) {
                            this.orders = { type: "stand" };
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
                console.log("Vehicle:", "{ path:", this.orders.path.length, " }", this.orders.path);
                if (this.orders.path.length > 1) {
                    var nextStep = { x: this.orders.path[1].x + 0.5, y: this.orders.path[1].y + 0.5 };
                    newDirection = findAngle(nextStep, this, this.directions);
                } else if (start[0] == end[0] && start[1] == end[1]) {
                    // reached destination grid
                    console.log("Vehicle", "Reached destination grid");
                    this.orders.path = [this, destination];
                    newDirection = findAngle(destination, this, this.directions);
                } else {
                    // there is no path
                    console.log("Vehicle", "There is no path");
                    return false;
                }
            }

            // check if moving along current direction might cause collision
            // if so, change newDirection
            var collisionObjects = this.checkCollisionObjects(grid);
            this.hardCollision = false;
            this.colliding = false;
            if (collisionObjects.length > 0) {
                this.colliding = true;

                // create a force vector object that adds up 
                // repulsion from all colliding objects
                var forceVector = { x: 0, y: 0 };

                // by default, the next step has a mild attraction force
                collisionObjects.push({
                    collisionType: "attraction",
                    with: {
                        x: this.orders.path[1].x + 0.5,
                        y: this.orders.path[1].y + 0.5
                    }
                });

                for (var i = collisionObjects.length - 1; i >= 0; i--) {
                    var collisionObject = collisionObjects[i];
                    var objectAngle = findAngle(collisionObject.with, this, this.directions);
                    var objectAngleRadians = -(objectAngle / this.directions) * 2 * Math.PI;
                    var forceMagnitude;
                    switch(collisionObject.collisionType) {
                        case "hard":
                            forceMagnitude = 2;
                            this.hardCollision = true;
                            break;
                        case "soft":
                            forceMagnitude = 1;
                            break;
                        case "attraction":
                            forceMagnitude = -0.25;
                            break;
                    }

                    forceVector.x += (forceMagnitude * Math.sin(objectAngleRadians));
                    forceVector.y += (forceMagnitude * Math.cos(objectAngleRadians));
                }

                // find a new direction based on the force vector
                newDirection = findAngle(forceVector, { x: 0, y: 0 }, this.directions);
            }

            // calculate turn amount for new direction
            var difference = angleDiff(this.direction, newDirection, this.directions);
            var turnAmount = this.turnSpeed * game.turnSpeedAdjustmentFactor;

            // either turn or move forward based on collision type
            if (this.hardCollision) {
                // in case of hard collision, do not move forward, just turn towards new direction
                if (Math.abs(difference) > turnAmount) {
                    this.direction = wrapDirection(
                        this.direction + turnAmount * Math.abs(difference) / difference, this.directions);
                }
            } else {
                // Otherwise, move forward, but keep turning as needed
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
            }

            return true;
        },

        // Make a list of collisions that the vehicle will have if it goes along the present path
        checkCollisionObjects: function(grid) {
            // Calculate new position on present path
            var movement = this.speed * game.speedAdjustmentFactor;
            var angleRadians = -(Math.round(this.direction) / this.directions) * 2 * Math.PI;
            var newX = this.x - (movement * Math.sin(angleRadians));
            var newY = this.y - (movement * Math.cos(angleRadians));

            // List of objects that will collide after next movement step
            var collisionObjects = [];
            var x1 = Math.max(0, Math.floor(newX) - 3);
            var x2 = Math.min(game.currentLevel.mapGridWidth - 1, Math.floor(newX) + 3);
            var y1 = Math.max(0, Math.floor(newY) - 3);
            var y2 = Math.min(game.currentLevel.mapGridHeight - 1, Math.floor(newY) + 3);

            // Test grid upto 3 squares away
            for (var j = x1; j <= x2; j++) {
                for (var i = y1; i <= y2; i++) {
                    if (grid[i][j] == 1) { // grid square is obstructed
                        var distanceFromObstructedGrid = 
                            Math.pow(j + 0.5 - newX, 2) + Math.pow(i + 0.5 - newY, 2);
                        
                        var hardCollisionThreshold = 
                            Math.pow(this.radius / game.gridSize + 0.1, 2);

                        var softCollisionThreshold = 
                            Math.pow(this.radius / game.gridSize + 0.7, 2);

                        // collisionTypes:
                        // hard: vehicles are colliding
                        // soft: vehicles are almost ready to collide
                        if (distanceFromObstructedGrid < hardCollisionThreshold) {
                            // Distance of obstructed grid from vehicle is less than hard collision threshold
                            collisionObjects.push({ collisionType: "hard", with: { type: "wall", x: j + 0.5, y: i + 0.5 } });
                        } else if (distanceFromObstructedGrid < softCollisionThreshold) {
                            // Distance of obstructed grid from vehicle is less than soft collision threshold
                            collisionObjects.push({ collisionType: "soft", with: { type: "wall", x: j + 0.5, y: i + 0.5 } });
                        }
                    }
                }
            }

            for (var i = game.vehicles.length - 1; i >= 0; i--) {
                var vehicle = game.vehicles[i];

                // Test vehicles that are less than 3 squares away for collisions
                var squaresDistance = 3;
                if (vehicle != this && Math.abs(vehicle.x - this.x) < squaresDistance &&
                    Math.abs(vehicle.y - this.y) < squaresDistance) {
                    
                    var distanceFromVehicle = 
                        Math.pow(vehicle.x - newX, 2) + Math.pow(vehicle.y - newY, 2);
                    
                    var hardCollisionThreshold = 
                        Math.pow((this.radius + vehicle.radius) / game.gridSize, 2);

                    var softCollisionThreshold =
                        Math.pow((this.radius * 1.5 + vehicle.radius) / game.gridSize, 2);

                    if (distanceFromVehicle < hardCollisionThreshold) {
                        // Distance between vehicles is less than hard collision threshold (sum of vehicles radius)
                        collisionObjects.push({ collisionType: "hard", with: vehicle });
                    } else if (distanceFromVehicle < softCollisionThreshold) {
                        // Distance between vehicles is less than soft collision threshold (1.5 times vehicles radius + colliding vehicle radius)
                        collisionObjects.push({ collisionType: "soft", with: vehicle });     
                    }
                }
            }

            return collisionObjects;
        },
    },

    load: loadItem,

    add: addItem
}