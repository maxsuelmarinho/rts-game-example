var buildings = {
  list: {
    base: {
      name: "base",
      // properties for drawing the object
      // dimensions of the individual sprite
      pixelWidth: 60,
      pixelHeight: 60,
      // dimensions of the base area
      baseWidth: 40,
      baseHeight: 40,
      // offset of the base area from the top-left corner of the sprite
      pixelOffsetX: 0,
      pixelOffsetY: 20,

      // grid squares necessary for constructing the building
      buildableGrid: [
        [1, 1],
        [1, 1]
      ],

      // grid squares that are passable or obstructured for pathfinding
      passableGrid: [
        [1, 1],
        [1, 1]
      ],
      // how far the building can "see" through fog of war
      sight: 3,
      // maximum possible life
      hitPoints: 500,
      cost: 5000,
      spriteImages: [
        { name: "healthy", count: 4 },
        { name: "damaged", count: 1 },
        { name: "constructing", count: 3 }
      ]
    },

    starport: {
      name: "starport",
      pixelWidth: 40,
      pixelHeight: 60,
      baseWidth: 40,
      baseHeight: 55,
      pixelOffsetX: 1,
      pixelOffsetY: 5,
      buildableGrid: [
        [1, 1],
        [1, 1],
        [1, 1]
      ],
      passableGrid: [
        [1, 1],
        [0, 0],
        [0, 0]
      ],
      sight: 3,
      cost: 2000,
      canConstruct: true,
      hitPoints: 300,
      spriteImages: [
        { name: "teleport", count: 9 },
        { name: "closing", count: 18 },
        { name: "healthy", count: 4 },
        { name: "damaged", count: 1 }
      ]

      /*
            processOrders: function() {
                switch (this.orders.type) {
                    case "construct-unit":
                        if (this.lifeCode != "healthy") {
                            return;
                        }

                        // first make sure there is no unit standing on top of the building
                        var unitOnTop = false;
                        for (var i = game.items.length - 1; i >= 0; i--) {
                            var item = game.items[i];
                            if (item.type == "vehicles" || item.type == "aircraft") {
                                if (item.x > this.x && item.x < this.x + 2 &&
                                    item.y > this.y && item.y < this.y + 3) {

                                    unitOnTop = true;
                                    break;
                                }
                            }
                        }

                        var cost = window[this.orders.details.type].list[this.orders.details.name].cost;
                        if (unitOnTop) {
                            if (this.team == game.team) {
                                game.showMessage("system", "Warning! Cannot teleport unit while landing bay is occupied.");
                            }
                        } else if (game.cash[this.team] < cost) {
                            if (this.team == game.team) {
                                game.showMessage("system", "Warning! Insufficient Funds. Need " + cost + " credits.");
                            }
                        } else {
                            this.action = "open";
                            this.animationIndex = 0;
                            // position new unit above center of starport
                            var itemDetails = this.orders.details;
                            itemDetails.x = this.x + 0.5 * this.pixelWidth / game.gridSize;
                            itemDetails.y = this.y + 0.5 * this.pixelHeight / game.gridSize;

                            // teleport in unit and subtract the cost from player cash
                            itemDetails.action = "teleport";
                            itemDetails.team = this.team;
                            game.cash[this.team] -= cost;
                            this.constructUnit = $.extend(true, [], itemDetails);
                        }

                        this.orders = { type: "stand" };
                        break;
                }
            },
            */
    },

    harvester: {
      name: "harvester",
      pixelWidth: 40,
      pixelHeight: 60,
      baseWidth: 40,
      baseHeight: 20,
      pixelOffsetX: -2,
      pixelOffsetY: 40,
      buildableGrid: [[1, 1]],
      passableGrid: [[1, 1]],
      sight: 3,
      cost: 5000,
      hitPoints: 300,
      spriteImages: [
        { name: "deploy", count: 17 },
        { name: "healthy", count: 3 },
        { name: "damaged", count: 1 }
      ]
    },

    "ground-turret": {
      name: "ground-turret",
      canAttack: true,
      canAttackLand: true,
      canAttackAir: false,
      weaponType: "cannon-ball",
      action: "stand",
      direction: 0, // 0: face upward
      directions: 8, // total of 8 turret directions allowed (0-7)
      orders: { type: "guard" },
      pixelWidth: 38,
      pixelHeight: 32,
      baseWidth: 20,
      baseHeight: 18,
      cost: 1500,
      canConstruct: true,
      pixelOffsetX: 9,
      pixelOffsetY: 12,
      buildableGrid: [[1]],
      passableGrid: [[1]],
      sight: 5,
      hitPoints: 200,
      spriteImages: [
        { name: "teleport", count: 9 },
        { name: "healthy", count: 1, directions: 8 },
        { name: "damaged", count: 1 }
      ]
    }
  },

  defaults: {
    type: "buildings",

    processActions: function() {
      switch (this.action) {
        case "stand":
          if (this.name === "ground-turret" && this.lifeCode === "healthy") {
            // for a healthy turret, use direction to choose image list
            let direction = Math.round(this.direction) % this.directions;
            this.imageList = this.spriteArray[this.lifeCode + "-" + direction];
          } else {
            // in all other cases, use lifeCode
            this.imageList = this.spriteArray[this.lifeCode];
          }

          this.imageOffset = this.imageList.offset + this.animationIndex;
          this.animationIndex++;
          if (this.animationIndex >= this.imageList.count) {
            this.animationIndex = 0;
          }
          break;
        case "construct":
          this.imageList = this.spriteArray["constructing"];
          this.imageOffset = this.imageList.offset + this.animationIndex;
          this.animationIndex++;

          // once constructing is complete go back to standing
          if (this.animationIndex >= this.imageList.count) {
            this.animationIndex = 0;
            this.action = "stand";
          }
          break;
        case "teleport":
          this.imageList = this.spriteArray["teleport"];
          this.imageOffset = this.imageList.offset + this.animationIndex;
          this.animationIndex++;

          // once teleporting is complete, move to stand mode
          if (this.animationIndex >= this.imageList.count) {
            this.animationIndex = 0;
            this.action = "stand";
          }
          break;
        case "close":
          this.imageList = this.spriteArray["closing"];
          this.imageOffset = this.imageList.offset + this.animationIndex;
          this.animationIndex++;

          // once closing is complete, go back to standing
          if (this.animationIndex >= this.imageList.count) {
            this.animationIndex = 0;
            this.action = "stand";
          }
          break;
        case "open":
          this.imageList = this.spriteArray["closing"];
          // opening is just the closing sprites running backward
          this.imageOffset =
            this.imageList.offset + this.imageList.count - this.animationIndex;
          this.animationIndex++;

          // once opening is complete, go back to close
          if (this.animationIndex >= this.imageList.count) {
            this.animationIndex = 0;
            this.action = "close";
          }
          break;
        case "deploy":
          this.imageList = this.spriteArray["deploy"];
          this.imageOffset = this.imageList.offset + this.animationIndex;
          this.animationIndex++;

          // once deploying is complete, go to stand
          if (this.animationIndex >= this.imageList.count) {
            this.animationIndex = 0;
            this.action = "stand";
          }

          break;
      }
    },

    // default function for drawing a building
    drawSprite: function() {
      let x = this.drawingX;
      let y = this.drawingY;
      // all sprite sheets will have blue in the first row and green in the second row
      let colorIndex = this.team === "blue" ? 0 : 1;
      let colorOffset = colorIndex * this.pixelHeight;

      // draw the sprite at x, y
      game.foregroundContext.drawImage(
        this.spriteSheet,
        this.imageOffset * this.pixelWidth,
        colorOffset,
        this.pixelWidth,
        this.pixelHeight,
        x,
        y,
        this.pixelWidth,
        this.pixelHeight
      );
    },

    drawLifeBar: function() {
      let x = this.drawingX + this.pixelOffsetX;
      let y = this.drawingY - 2 * this.lifeBarHeight;

      game.foregroundContext.fillStyle =
        this.lifeCode === "healthy"
          ? this.lifeBarHealthyFillColor
          : this.lifeBarDamagedFillColor;

      game.foregroundContext.fillRect(
        x,
        y,
        (this.baseWidth * this.life) / this.hitPoints,
        this.lifeBarHeight
      );

      game.foregroundContext.strokeStyle = this.lifeBarBorderColor;
      game.foregroundContext.lineWidth = 1;
      game.foregroundContext.strokeRect(
        x,
        y,
        this.baseWidth,
        this.lifeBarHeight
      );
    },

    drawSelection: function() {
      let x = this.drawingX + this.pixelOffsetX;
      let y = this.drawingY + this.pixelOffsetY;

      game.foregroundContext.strokeStyle = this.selectionBorderColor;
      game.foregroundContext.lineWidth = 1;
      game.foregroundContext.fillStyle = this.selectionFillColor;

      // draw a filled rectangle around the building
      game.foregroundContext.fillRect(
        x - 1,
        y - 1,
        this.baseWidth + 2,
        this.baseHeight + 2
      );
      game.foregroundContext.strokeRect(
        x - 1,
        y - 1,
        this.baseWidth + 2,
        this.baseHeight + 2
      );
    }

    /*
        animationIndex: 0,
        direction: 0,
        orders: { type: "stand" },
        action: "stand",
        selected: false,
        selectable: true,

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
                    this.imageList = this.spriteArray[this.lifeCode];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                    }
                    break;
                case "construct":
                    this.imageList = this.spriteArray["constructing"];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                        this.action = "stand";
                    }
                    break;
                case "teleport":
                    this.imageList = this.spriteArray["teleport"];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    // once teleporting is complete, move to either guard or stand mode
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                        if (this.canAttack) {
                            this.action = "guard";
                        } else {
                            this.action = "stand";
                        }
                    }
                    break;
                case "close":
                    this.imageList = this.spriteArray["closing"];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    // onde closing is complete go back to standing
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                        this.action = "stand";
                    }
                    break;
                case "open":
                    this.imageList = this.spriteArray["closing"];
                    // opening is just the closing sprites running backwards
                    this.imageOffset = this.imageList.offset + this.imageList.count - this.animationIndex;
                    this.animationIndex++;
                    // once opening is complete, go back to close
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                        this.action = "close";

                        // if constructUnit has been set, add the new unit to the game
                        if (this.constructUnit) {
                            game.add(this.constructUnit);
                            this.constructUnit = undefined;
                        }
                    }
                    break;
                case "deploy":
                    this.imageList = this.spriteArray["deploy"];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    // once deploying is complete, go to harvest now
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                        this.action = "harvest";
                    }
                    break;
                case "guard":
                    if (this.lifeCode == "damaged") {
                        this.imageList = this.spriteArray[this.lifeCode];
                    } else {
                        this.imageList = this.spriteArray[this.lifeCode + "-" + this.direction];
                    }
                    this.imageOffset = this.imageList.offset;
                    break;
                case "harvest":
                    this.imageList = this.spriteArray[this.lifeCode];
                    this.imageOffset = this.imageList.offset + this.animationIndex;
                    this.animationIndex++;
                    if (this.animationIndex >= this.imageList.count) {
                        this.animationIndex = 0;
                        if (this.lifeCode == "healthy") {
                            // harvesters mine 2 credits of cash per animation cycle
                            game.cash[this.team] += 2;
                        }
                    }
                    break;
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
                this.pixelWidth, this.pixelHeight);
        },        
        */
  },

  load: loadItem,

  add: addItem
};
