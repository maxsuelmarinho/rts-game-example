var mouse = {
    DRAG_THRESHOLD: 4,
    // mouse's coordinates relative to top left corner of canvas
    x: 0,
    y: 0,
    // mouse's coordinates relative to top left corner of game map
    gameX: 0,
    gameY: 0,
    // game grid coordinates of mouse
    gridX: 0,
    gridY: 0,

    buttonPressed: false,

    dragSelect: false,

    insideCanvas: false,

    click: function(event, rightClick) {
        var clickedItem = this.itemUnderMouse();
        var shiftPressed = event.shiftKey;

        if (!rightClick) { // Left Click
            if (clickedItem) {
                if (!shiftPressed) {
                    game.clearSelection();
                }

                game.selectItem(clickedItem, shiftPressed);
            }
        } else { // Right Click
            var uids = [];
            if (clickedItem) {
                console.log("clicked item:", clickedItem.name);
                if (clickedItem.type != "terrain") {
                    if (clickedItem.team != game.team) { // player right-clicked on enemy item
                        uids = this.filterSelectedItems(this.canAttack);    

                        if (uids.length > 0) {
                            console.log("selected items:", uids.length);
                            console.log("Sending attack command");
                            game.sendCommand(uids, { type: "attack", toUid: clickedItem.uid });
                        }
                    } else { // player right-clicked on a friendly item
                        uids = this.filterSelectedItems(this.isFriendlyItem);    

                        if (uids.length > 0) {
                            console.log("selected items:", uids.length);
                            console.log("Sending guard command");
                            game.sendCommand(uids, { type: "guard", toUid: clickedItem.uid });
                        }
                    }
                } else if (clickedItem.name == "oilfield") {
                    // identify the first selected harvester from players team (since only one can be deploy at a time)
                    uids = this.filterSelectedItems(this.isHarvesterVehicle);

                    if (uids.length > 0) {
                        console.log("selected items:", uids.length);
                        console.log("Sending deploy command");
                        game.sendCommand(uids, { type: "deploy", toUid: clickedItem.uid });
                    }
                }
            } else { // player clicked on the ground
                uids = this.filterSelectedItems(this.itemCanMove);

                if (uids.length > 0) {
                    console.log("selected items:", uids.length);
                    console.log("Sending move command");
                    game.sendCommand(uids, { type: "move", to: { x: mouse.gameX / game.gridSize, y: mouse.gameY / game.gridSize } });
                }
            }
        }
    },

    filterSelectedItems: function(predicate) {
        var uids = [];
        for (var i = game.selectedItems.length - 1; i >= 0; i--) {
            var item = game.selectedItems[i];
            if (predicate(item)) {
                uids.push(item.uid);
            }
        }

        return uids;
    },

    itemCanMove: function(item) {
        return item.team == game.team && (item.type == "vehicles" || item.type == "aircraft");
    },

    isHarvesterVehicle: function(item) {
        return item.team == game.team && (item.type == "vehicles" || item.name == "harvester");
    },

    isFriendlyItem: function(item) {
        return item.team == game.team && (item.type == "vehicles" || item.type == "aircraft");
    },

    canAttack: function(item) {
        return item.team == game.team && item.canAttack;
    },

    draw: function() {
        if (this.dragSelect) {
            var x = Math.min(this.gameX, this.dragX);
            var y = Math.min(this.gameY, this.dragY);
            var width = Math.abs(this.gameX - this.dragX);
            var height = Math.abs(this.gameY - this.dragY);
            game.foregroundContext.strokeStyle = 'white';
            game.foregroundContext.strokeRect(
                x - game.offsetX,
                y - game.offsetY,
                width,
                height
            );
        }
    },

    calculateGameCoordinates: function() {
        mouse.gameX = mouse.x + game.offsetX;
        mouse.gameY = mouse.y + game.offsetY;

        mouse.gridX = Math.floor(mouse.gameX / game.gridSize);
        mouse.gridY = Math.floor(mouse.gameY / game.gridSize);
    },

    init: function() {
        var $mouseCanvas = $("#gameforegroundcanvas");
        $mouseCanvas.mousemove(function(event) {
            var offset = $mouseCanvas.offset();
            mouse.x = event.pageX - offset.left;
            mouse.y = event.pageY - offset.top;

            mouse.calculateGameCoordinates();

            if (mouse.buttonPressed) {
                if (Math.abs(mouse.dragX - mouse.gameX) > mouse.DRAG_THRESHOLD || 
                    Math.abs(mouse.dragY - mouse.gameY) > mouse.DRAG_THRESHOLD) {
                    mouse.dragSelect = true;
                }
            } else {
                mouse.dragSelect = false;
            }
        });

        $mouseCanvas.click(function(event) {
            mouse.click(event, false);
            mouse.dragSelect = false;
            return false;
        });

        $mouseCanvas.mousedown(function(event) {
            if (event.which == 1) {
                mouse.buttonPressed = true;
                mouse.dragX = mouse.gameX;
                mouse.dragY = mouse.gameY;
                event.preventDefault();
            }

            return false;
        });

        $mouseCanvas.bind('contextmenu', function(event) {
            mouse.click(event, true);
            return false;
        });

        $mouseCanvas.mouseup(function(event) {
            var shiftPressed = event.shiftKey;
            if (event.which == 1) {
                // left key was released
                if (mouse.dragSelect) {
                    if (!shiftPressed) {
                        game.clearSelection();
                    }

                    var x1 = Math.min(mouse.gameX, mouse.dragX) / game.gridSize;
                    var y1 = Math.min(mouse.gameY, mouse.dragY) / game.gridSize;
                    var x2 = Math.max(mouse.gameX, mouse.dragX) / game.gridSize;
                    var y2 = Math.max(mouse.gameY, mouse.dragY) / game.gridSize;

                    for (var i = game.items.length - 1; i >= 0; i--) {
                        var item = game.items[i];
                        if (item.type != "buildings" && 
                            item.selectable && 
                            item.team == game.team &&
                            x1 <= item.x &&
                            x2 >= item.x) {
                            
                            if ((item.type == "vehicles" && y1 <= item.y && y2 >= item.y) ||
                                (item.type == "aircraft" && 
                                    (y1 <= item.y - item.pixelShadowHeight / game.gridSize) && 
                                    (y2 >= item.y - item.pixelShadowHeight / game.gridSize))) {
                                
                                game.selectItem(item, shiftPressed);
                            }
                        }
                    }
                }
                mouse.buttonPressed = false;
                mouse.dragSelect = false;
            }

            return false;
        });

        $mouseCanvas.mouseleave(function(event) {
            mouse.insideCanvas = false;
        });

        $mouseCanvas.mouseenter(function(event) {
            mouse.buttonPressed = false;
            mouse.insideCanvas = true;
        });
    },

    itemUnderMouse: function() {
        for (var i = game.items.length - 1; i >= 0; i--) {
            var item = game.items[i];

            if (item.type == "buildings" || item.type == "terrain") {
                if (item.lifeCode != "dead" && 
                    item.x <= mouse.gameX / game.gridSize &&
                    item.x >= (mouse.gameX - item.baseWidth) / game.gridSize &&
                    item.y <= mouse.gameY / game.gridSize &&
                    item.y >= (mouse.gameY - item.baseHeight) / game.gridSize)  {
                    
                    return item;
                }
            } else if (item.type == "aircraft") {
                if (item.lifeCode != "dead" &&
                    Math.pow(item.x - mouse.gameX / game.gridSize, 2) + 
                    Math.pow(item.y - (mouse.gameY + item.pixelShadowHeight) / game.gridSize, 2) < Math.pow(item.radius / game.gridSize, 2)) {
                    
                    return item;
                }
            } else {
                if (item.lifeCode != "dead" && 
                    Math.pow(item.x - mouse.gameX / game.gridSize, 2) +
                    Math.pow(item.y - mouse.gameY / game.gridSize, 2) < Math.pow(item.radius / game.gridSize, 2)) {
                    
                    return item;
                }
            }
        }
    }

}