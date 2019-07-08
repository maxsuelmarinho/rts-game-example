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
            canConstruct: true,
            hitPoints: 50,
            turnSpeed: 4,
            spriteImages: [
                { name: "stand", count: 4, directions: 8 }
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
            canConstruct: true,
            hitPoints: 50,
            turnSpeed: 4,
            spriteImages: [
                { name: "stand", count: 1, directions: 8 }
            ],
            weaponType: "fireball",
            canAttack: true,
            canAttackLand: false,
            canAttackAir: true,
            pixelShadowHeight: 40,
        },
    },

    defaults: {
        type: "aircraft",
        directions: 8,
        canMove: true,
        // how slow should unit move while turning
        speedAdjustmentWhileTurningFactor: 0.4,

        processActions: function() {
            let direction = Math.round(this.direction) % this.directions;
            //console.log("aircraft - ", "direction:", direction)
            switch(this.action) {
                case "stand":
                    this.imageList = this.spriteArray["stand-" + direction];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                    }

                    break;
            }
        },

        drawSprite: function() {
            let x = this.drawingX;
            let y = this.drawingY;
            let colorIndex = this.team === "blue" ? 0 : 1;
            let colorOffset = colorIndex * this.pixelHeight;

            // the aircraft shadow is on the third row of the sprite sheet
            let shadowOffset = this.pixelHeight * 2;

            // draw the aircraft pixelShadowHeight pixels above its position
            game.foregroundContext.drawImage(this.spriteSheet, 
                this.imageOffset * this.pixelWidth, colorOffset,
                this.pixelWidth, this.pixelHeight,
                x, y - this.pixelShadowHeight,
                this.pixelWidth, this.pixelHeight);

            // draw the shadow at aircraft position
            game.foregroundContext.drawImage(this.spriteSheet, 
                this.imageOffset * this.pixelWidth, shadowOffset,
                this.pixelWidth, this.pixelHeight,
                x, y,
                this.pixelWidth, this.pixelHeight);
        },

        drawLifeBar: function () {
            var x = this.drawingX;
            var y = this.drawingY - 2 * this.lifeBarHeight - this.pixelShadowHeight;

            game.foregroundContext.fillStyle = (this.lifeCode == "healthy") ?
                this.lifeBarHealthyFillColor :
                this.lifeBarDamagedFillColor;

            game.foregroundContext.fillRect(
                x, y,
                this.pixelWidth * this.life / this.hitPoints, this.lifeBarHeight);

            game.foregroundContext.strokeStyle = this.lifeBarBorderColor;
            game.foregroundContext.lineWidth = 1;
            game.foregroundContext.strokeRect(
                x, y,
                this.pixelWidth, this.lifeBarHeight);
        },

        drawSelection: function () {
            let x = this.drawingX + this.pixelOffsetX;
            let y = this.drawingY + this.pixelOffsetY - this.pixelShadowHeight;

            game.foregroundContext.strokeStyle = this.selectionBorderColor;
            game.foregroundContext.fillStyle = this.selectionFillColor;
            game.foregroundContext.lineWidth = 2;

            // draw a filled circle around the aircraft
            game.foregroundContext.beginPath();
            game.foregroundContext.arc(x, y, this.radius, 0, Math.PI * 2, false);
            game.foregroundContext.stroke();            
            game.foregroundContext.fill();

            // draw a circle around the aircraft shadow
            game.foregroundContext.beginPath();
            game.foregroundContext.arc(x, y + this.pixelShadowHeight, 4, 0, Math.PI * 2, false);
            game.foregroundContext.stroke();

            // join the center of the two circles with a line
            game.foregroundContext.beginPath();
            game.foregroundContext.moveTo(x, y);
            game.foregroundContext.lineTo(x, y + this.pixelShadowHeight);
            game.foregroundContext.stroke();
        },

        processOrders: function() {
            this.lastMovementX = 0;
            this.lastMovementY = 0;

            if (this.orders.to) {
                var distanceFromDestinationSquared = 
                        Math.pow(this.orders.to.x - this.x, 2) + Math.pow(this.orders.to.y - this.y, 2);
                var distanceFromDestination = Math.pow(distanceFromDestinationSquared, 0.5);
                var radius = this.radius / game.gridSize;
            }

            switch (this.orders.type) {
                case "move":
                    // move towards destination until distance from destination
                    // is less than aircraft radius
                    if (distanceFromDestination < radius) {
                        this.orders = { type: "stand" };
                    } else {
                        this.moveTo(this.orders.to, distanceFromDestination);
                    }
                    break;
            }
        },

        moveTo: function(destination, distanceFromDestination) {
            // find out where we need to turn to get to destination
            let newDirection = this.findAngle(destination);

            // turn toward new direction if necessary
            this.turnTo(newDirection);

            // calculate maximum distance that aircraft can move per animation cycle
            let maximumMovement = this.speed * this.speedAdjustmentFactor * 
                (this.turning ? this.speedAdjustmentWhileTurningFactor : 1);
            
            let movement = Math.min(maximumMovement, distanceFromDestination);

            // calculate x and y components of the movement
            let angleRadians = -(this.direction / this.directions) * 2 * Math.PI;
            this.lastMovementX = -(movement * Math.sin(angleRadians));
            this.lastMovementY = -(movement * Math.cos(angleRadians));
            this.x = this.x + this.lastMovementX;
            this.y = this.y + this.lastMovementY;
        }
        
        /*
        animationIndex: 0,
        direction: 0,        
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
                    var direction = wrapDirection(Math.round(this.direction), this.directions);
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
            var interpolationX = this.lastMovementX * game.drawingInterpolationFactor * game.gridSize;
            var interpolationY = this.lastMovementY * game.drawingInterpolationFactor * game.gridSize;
            var x = (this.x * game.gridSize) - game.offsetX - this.pixelOffsetX + interpolationX;
            var y = (this.y * game.gridSize) - game.offsetY - this.pixelOffsetY - this.pixelShadowHeight + interpolationY;

            this.drawingX = x;
            this.drawingY = y;

            if (this.selected) {
                this.drawSelection();
                this.drawLifeBar();
            }

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
        },        
        */
    },

    load: loadItem,

    add: addItem

}