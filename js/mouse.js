var mouse = {    
    // mouse's coordinates relative to top left corner of canvas
    x: 0,
    y: 0,
    // mouse's coordinates relative to top left corner of game map
    gameX: 0,
    gameY: 0,
    // game grid coordinates of mouse
    gridX: 0,
    gridY: 0,

    // is the mouse inside the canvas region
    insideCanvas: false,

    // is the left mouse button currently pressed
    buttonPressed: false,
    
    // is the player dragging and selecting with the left mouse button pressed
    dragSelect: false,

    // if the mouse is dragged more than this, assume the player is trying to select somethin
    dragSelectThreshold: 5,

    init: function() {
        // listen for mouse events on the game foreground canvas
        let canvas = document.getElementById("gameforegroundcanvas");

        canvas.addEventListener("mousemove", mouse.mousemovehandler, false);
        canvas.addEventListener("mouseenter", mouse.mouseenterhandler, false);
        canvas.addEventListener("mouseout", mouse.mouseouthandler, false);
        canvas.addEventListener("mousedown", mouse.mousedownhandler, false);
        canvas.addEventListener("mouseup", mouse.mouseuphandler, false);
        canvas.addEventListener("contextmenu", mouse.mouserightclickhandler, false);

        mouse.canvas = canvas;

        /*
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
                            
                            if ((item.type != "aircraft" && y1 <= item.y && y2 >= item.y) ||
                                ((y1 <= item.y - item.pixelShadowHeight / game.gridSize) && 
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
        */
    },

    calculateGameCoordinates: function() {
        mouse.gameX = mouse.x + game.offsetX;
        mouse.gameY = mouse.y + game.offsetY;

        mouse.gridX = Math.floor(mouse.gameX / game.gridSize);
        mouse.gridY = Math.floor(mouse.gameY / game.gridSize);
    },

    setCoordinates: function(clientX, clientY) {
        let offset = mouse.canvas.getBoundingClientRect();
        mouse.x = (clientX - offset.left) / game.scale;
        mouse.y = (clientY - offset.top) / game.scale;

        mouse.calculateGameCoordinates();
    },

    mousemovehandler: function(ev) {
        mouse.insideCanvas = true;
        mouse.setCoordinates(ev.clientX, ev.clientY);
        mouse.checkIfDragging();
    },

    mouseenterhandler: function() {
        mouse.insideCanvas = true;
    },

    mouseouthandler: function() {
        mouse.insideCanvas = false;
    },

    mousedownhandler: function(ev) {
        mouse.insideCanvas = true;
        mouse.setCoordinates(ev.clientX, ev.clientY);

        if (ev.button === 0) { // left mouse button was pressed
            mouse.buttonPressed = true;
            mouse.dragX = mouse.gameX;
            mouse.dragY = mouse.gameY;
        }
    },

    mouseuphandler: function(ev) {
        mouse.setCoordinates(ev.clientX, ev.clientY);
        let shiftPressed = ev.shiftPressed;

        if (ev.button === 0) { // left mouse button was released
            if (mouse.dragSelect) {
                // if currently drag-selection, attempt to select items with the selection rectangle
                mouse.finishDragSelection(shiftPressed);
            } else {
                // if not dragging, treat this as a normal click once the mouse is released
                mouse.leftClick(shiftPressed);
            }

            mouse.buttonPressed = false;
        }
    },

    mouserightclickhandler: function(ev) {
        mouse.rightClick(ev, true);

        // prevent the browser from showing the context menu
        ev.preventDefault(true);
    },

    // called whenevet player completes a right-click on the game canvas
    rightClick: function() {
        let clickedItem = mouse.itemUnderMouse();

        // Handle actions like attacking and movement of selected units
        if (clickedItem) { // player right-clicked on something
            if (clickedItem.type !== "terrain") {
                if (clickedItem.team !== game.team) { // player right-clicked on an enemy item
                    let uids = [];

                    // identify selected units from player's team that can attack
                    game.selectedItems.forEach(function(item) {
                        if (item.team === game.team && item.canAttack) {
                            uids.push(item.uid);
                        }
                    }, this);

                    // command units to attack the clicked item
                    if (uids.length > 0) {
                        game.sendCommand(uids, { type: "attack", toUid: clickedItem.uid });
                    }
                } else { // player right-clicked a friendly item
                    let uids = [];

                    // identify selected units from player's team that can move
                    game.selectedItems.forEach(function(item) {
                        if (item.team === game.team && item.canAttack && item.canMove) {
                            uids.push(item.uid);
                        }
                    }, this);

                    // command units to guard the clicked item
                    if (uids.length > 0) {
                        game.sendCommand(uids, { type: "guard", toUid: clickedItem.uid });
                    }
                }
            } else if (clickedItem.name === "oilfield") { // player right-clicked on an oilfield
                let uids = [];

                // identify the first selected harvester (since only one can deploy at a time)
                for (let i = game.selectedItems.length - 1; i >= 0; i--) {
                    let item = game.selectedItems[i];

                    if (item.team === game.team && item.type === "vehicles" && item.name === "harvester") {
                        uids.push(item.uid);
                        break;
                    }
                }

                // command it to deploy on the oil field
                if (uids.length > 0) {
                    game.sendCommand(uids, { type: "deploy", toUid: clickedItem.uid });
                }
            }
        } else { // player right-clicked the ground
            let uids = [];

            // identify selected units from player's team that can move
            game.selectedItems.forEach(function(item) {
                if (item.team === game.team && item.canMove) {
                    uids.push(item.uid);
                }
            }, this);

            // command units to move to the clicked location
            if (uids.length > 0) {
                game.sendCommand(uids, { type: "move", to: { x: mouse.gameX / game.gridSize, y: mouse.gameY / game.gridSize } });
            }
        }
    },

    finishDragSelection: function(shiftPressed) {
        if (!shiftPressed) {
            // if shift key is not pressed, clear any reviously selected item
            game.clearSelection();
        }

        // calculate the bounds of the selection rectangle
        let x1 = Math.min(mouse.gameX, mouse.dragX);
        let y1 = Math.min(mouse.gameY, mouse.dragY);
        let x2 = Math.max(mouse.gameX, mouse.dragX);
        let y2 = Math.max(mouse.gameY, mouse.dragY);

        game.items.forEach(function(item) {
            // unselectable items, dead items, opponent team items, and buildings are not drag-selectable
            if (!item.selectable || item.lifeCode === "dead" || item.team != game.team || item.type === "buildings") {
                return;
            }

            let x = item.x * game.gridSize;
            let y = item.y * game.gridSize;
            if (x1 <= x && x2 >= x) {
                if ((item.type === "vehicles" && y1 <= y && y2 >= y) ||
                    // in case of aircraft, adjust for pixelShadowHeight
                    (item.type === "aircraft" && (y1 <= y - item.pixelShadowHeight) &&
                    (y2 >= y - item.pixelShadowHeight))) {

                    game.selectItem(item, shiftPressed);
                }
            }
        });

        mouse.dragSelect = false;
    },

    // called whenever player completes a left-click on the game canvas
    leftClick: function(shiftPressed) {
        let clickedItem = mouse.itemUnderMouse();
        if (clickedItem) {
            console.log("item clicked: ", clickedItem);
            // pressing shift adds to existing selection. If shift is not pressed, clear existing selection
            if (!shiftPressed) {
                game.clearSelection();
            }

            game.selectItem(clickedItem, shiftPressed);
        }
    },

    // return the first item detected under the mouse
    itemUnderMouse: function() {
        for (let i = game.items.length - 1; i >= 0; i--) {
            let item  = game.items[i];

            // dead items will not be detected
            if (item.lifeCode === "dead") {
                continue;
            }

            let x = item.x * game.gridSize;
            let y = item.y * game.gridSize;

            if (item.type === "buildings" || item.type === "terrain") {
                // if mouse coordinates are within rectangular area of building or terrain
                if (x <= mouse.gameX && x >= (mouse.gameX - item.baseWidth) && y <= mouse.gameY && y >= (mouse.gameY - item.baseHeight)) {
                    return item;
                }
                // TODO: should this have a return?
            } else if (item.type === "aircraft") {
                // if mouse coordinates are within radius of aircraft (adjusted for pixelShadowHeight)
                if (Math.pow(x - mouse.gameX, 2) + Math.pow(y - mouse.gameY - item.pixelShadowHeight, 2) < Math.pow(item.radius, 2)) {
                    return item;
                }
                // TODO: should this have a return?
            } else if (item.type === "vehicles") {
                // if mouse coordinates are within radius of item
                if (Math.pow(x - mouse.gameX, 2) + Math.pow(y - mouse.gameY, 2) < Math.pow(item.radius, 2)) {
                    return item;
                }
                // TODO: should this have a return?
            }
        }
    },

    checkIfDragging: function() {
        if (mouse.buttonPressed) {
            // if the mouse has been dragged more than threshold, treat it as a drag
            if (Math.abs(mouse.dragX - mouse.gameX) > mouse.dragSelectThreshold && 
                Math.abs(mouse.dragY - mouse.gameY) > mouse.dragSelectThreshold) {
                mouse.dragSelect = true;
            }
            // TODO: otherwise it should be false?
        } else {
            mouse.dragSelect = false;
        }
    },

    draw: function() {
        // if the player is dragging and selecting,
        // draw a white box to mark the selection area
        if (this.dragSelect) {
            let x = Math.min(this.gameX, this.dragX);
            let y = Math.min(this.gameY, this.dragY);
            let width = Math.abs(this.gameX - this.dragX);
            let height = Math.abs(this.gameY - this.dragY);

            game.foregroundContext.strokeStyle = 'white';
            game.foregroundContext.strokeRect(
                x - game.offsetX, y - game.offsetY,
                width, height
            );
        }
    },


    /*
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
    */
}