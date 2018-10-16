$(window).load(function() {
    game.init();
});

var game = {
    debug: false,

    gridSize: 20,

    refreshBackground: true,

    backgroundChanged: true,

    animationTimeout: 100, // 100 milliseconds

    offsetX: 0,

    offsetY: 0,

    panningThreshold: 60, // distance from canvas's edge at which panning starts

    panningSpeed: 10,

    selectionBorderColor: "rgb(255, 255, 0, 0.5)",

    selectionFillColor: "rgb(255, 215, 0, 0.2)",

    healthBarBorderColor: "rgb(0, 0, 0, 0.8)",

    healthBarHealthyFillColor: "rgb(0, 255, 0, 0.5)",

    healthBarDamagedFillColor: "rgb(255, 0, 0, 0.5)",

    lifeBarHeight: 5,

    speedAdjustmentFactor: 1 / 64,

    turnSpeedAdjustmentFactor: 1 / 8,

    init: function() {
        loader.init();
        mouse.init();

        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        game.backgroundCanvas = document.getElementById('gamebackgroundcanvas');
        game.backgroundContext = game.backgroundCanvas.getContext('2d');

        game.foregroundCanvas = document.getElementById('gameforegroundcanvas');
        game.foregroundContext = game.foregroundCanvas.getContext('2d');

        game.canvasWidth = game.backgroundCanvas.width;
        game.canvasHeight = game.backgroundCanvas.height;
    },

    start: function() {
        $('.gamelayer').hide();
        $('#gameinterfacescreen').show();
        game.running = true;
        game.refreshBackground = true;

        game.drawingLoop();
    },

    // the animation loop will run at a fixed interval (100ms)
    animationLoop: function() {
        // animate the sidebar
        sidebar.animate();

        // process orders for any item that handles it
        for (var i = game.items.length - 1; i >= 0; i--) {
            if (game.items[i].processOrders) {
                game.items[i].processOrders();
            }
        }

        for (var i = game.items.length - 1; i >= 0; i--) {
            game.items[i].animate();
        }

        game.sortedItems = $.extend([], game.items);
        game.sortedItems.sort(function(a, b) {
            return b.y - a.y + ((b.y == a.y) ? (a.x - b.x) : 0);
        });

        // save the time that the last animation loop completed
        game.lastAnimationTime = (new Date()).getTime();
    },

    // run as often as the browser allows
    drawingLoop: function() {
        game.handlePanning();

        // check the time since the game was animated
        // and calculate a linear interpolation factor (-1 to 0)
        // since drawing will happen mode often than animation
        game.lastDrawTime = (new Date()).getTime();
        if (game.lastAnimationTime) {
            game.drawingInterpolationFactor =
                (game.lastDrawTime - game.lastAnimationTime) / game.animationTimeout - 1;
            if (game.drawingInterpolationFactor > 0) {
                // no point interpolating beyond the next animation loop...
                // 0 means that we draw the unit at an intermediate location between the two points
                game.drawingInterpolationFactor = 0;
            }
        } else {
            // -1 indicates that we draw the unit at the previous location
            game.drawingInterpolationFactor = -1;
        }

        // Only redraw the background if it has change
        if (game.refreshBackground) {
            game.backgroundContext.drawImage(game.currentMapImage,
                game.offsetX, game.offsetY,
                game.canvasWidth, game.canvasHeight,
                0, 0,
                game.canvasWidth, game.canvasHeight);
            
            game.refreshBackground = false;
        }

        // clear the foreground canvas
        // game.foregroundContext.clearRect(
        //     0,
        //     0,
        //     game.canvasWidth,
        //     game.canvasHeight
        // );

        // fast way to clear the foreground canvas
        game.foregroundCanvas.width = game.foregroundCanvas.width;

        // start drawing the foreground elements
        for (var i = game.sortedItems.length - 1; i >= 0; i--) {
            game.sortedItems[i].draw();
        }

        // Draw the mouse
        mouse.draw();

        if (game.debug) {
            game.drawObstructedSquares();
        }

        // call the drawing loop for the next frame using request animation frame
        if (game.running) {
            requestAnimationFrame(game.drawingLoop);
        }
    },

    drawObstructedSquares: function() {
        if (!game.currentMapPassableGrid) {
            return;
        }
        
        for (var y = 0; y < game.currentMapPassableGrid.length; y++) {
            for (var x = 0; x < game.currentMapPassableGrid[y].length; x++) {
                var obstruction = game.currentMapPassableGrid[y][x];
                if (obstruction == 1) {
                    game.foregroundContext.fillStyle = "rgb(255, 0, 0, 0.3)";

                    game.foregroundContext.fillRect(
                        (x * game.gridSize) - game.offsetX,
                        (y * game.gridSize) - game.offsetY,
                        game.gridSize, game.gridSize);
                }
            }
        }
    },

    handlePanning: function() {
        if (!mouse.insideCanvas) {
            return;
        }

        if (mouse.x <= game.panningThreshold) {
            if (game.offsetX >= game.panningSpeed) {
                game.refreshBackground = true;
                game.offsetX -= game.panningSpeed;
            }
        } else if (mouse.x >= game.canvasWidth - game.panningThreshold) {
            if (game.offsetX + game.canvasWidth + game.panningSpeed <= game.currentMapImage.width) {
                game.refreshBackground = true;
                game.offsetX += game.panningSpeed;
            }
        }

        if (mouse.y <= game.panningThreshold) {
            if (game.offsetY >= game.panningSpeed) {
                game.refreshBackground = true;
                game.offsetY -= game.panningSpeed;
            }
        } else if (mouse.y >= game.canvasHeight - game.panningThreshold) {
            if (game.offsetY + game.canvasHeight + game.panningSpeed <= game.currentMapImage.height) {
                game.refreshBackground = true;
                game.offsetY += game.panningSpeed;
            }
        }

        if (game.refreshBackground) {
            // update mouse game coordinates based on game offsets
            mouse.calculateGameCoordinates();
        }
    },

    resetArrays: function() {
        game.counter = 1;
        game.items = [];
        game.sortedItems = [];
        game.buildings = [];
        game.vehicles = [];
        game.aircraft = [];
        game.terrain = [];
        game.triggeredEvents = [];
        game.selectedItems = [];
        game.sortedItems = [];
    },

    add: function(itemDetails) {
        if (!itemDetails.uid) {
            itemDetails.uid = game.counter++;
        }

        var item = window[itemDetails.type].add(itemDetails);
        game.items.push(item);
        
        // add the item to the type specific array
        game[item.type].push(item);

        if (item.type == "buildings" || item.type == "terrain") {
            game.currentMapPassableGrid = undefined;
        }

        return item;
    },

    remove: function(item) {
        // unselect item if it is selected
        item.selected = false;
        for (var i = game.selectedItems.length - i; i >= 0; i--) {
            if (game.selectedItems[i].uid == item.uid) {
                game.selectedItems.splice(i, 1);
                break;
            }

        }

        // remove item from the items array
        for (var i = game.items.length - 1; i >= 0; i--) {
            if (game.items[i].uid == item.uid) {
                game.items.splice(i, 1);
                break;
            }
        }

        // remove items from the type specific array
        for (var i = game[item.type].length - 1; i >= 0; i--) {
            if (game[item.type][i].uid == item.uid) {
                game[item.type].splice(i, 1);
                break;
            }
        }

        if (item.type == "buildings" || item.type == "terrain") {
            game.currentMapPassableGrid = undefined;
        }
    },

    clearSelection: function() {
        while(game.selectedItems.length > 0) {
            // removes the item from the array
            game.selectedItems.pop().selected = false;
        }
    },

    selectItem: function(item, shiftPressed) {
        // Presing shift and clicking on a selected item will deselect it
        if (shiftPressed && item.selected) {
            item.selected = false;
            for (var i = game.selectedItems.length - 1; i >= 0; i--) {
                if (game.selectedItems[i].uid == item.uid) {
                    game.selectedItems.splice(i, 1);
                    break;
                }
            }

            return;
        }

        if (item.selectable && !item.selected) {
            item.selected = true;
            game.selectedItems.push(item);
        }
    },

    sendCommand: function(uids, details) {
        switch (game.type) {
            case "singleplayer":
                singleplayer.sendCommand(uids, details);
                break;
            case "multiplayer":
                multiplayer.sendCommand(uids, details);
                break;
        }
    },

    getItemByUid: function(uid) {
        for (var i = game.items.length - 1; i >= 0; i--) {
            if (game.items[i].uid == uid) {
                return game.items[i];
            }
        }
    },

    processCommand: function(uids, details) {
        
        if (details.toUid) {
            details.to = game.getItemByUid(details.toUid);
            if (!details.to || details.to.lifeCode == "dead") {
                // object no longer exists. Invalid command
                return;
            }
        }

        for (var i in uids) {
            var uid = uids[i];
            var item = game.getItemByUid(uid);
            if (item) {
                item.orders = $.extend([], details);
            }
        }
    },

    rebuildPassableGrid: function() {
        game.currentMapPassableGrid = $.extend(true, [], game.currentMapTerrainGrid);
        for (var i = game.items.length - 1; i >= 0; i--) {
            var item = game.items[i];
            if (item.type == "buildings" || item.type == "terrain") {
                for (var y = item.passableGrid.length - 1; y >= 0; y--) {
                    for (var x = item.passableGrid[y].length - 1; x >= 0; x--) {
                        if (item.passableGrid[y][x]) {
                            game.currentMapPassableGrid[item.y + y][item.x + x] = 1;
                        }
                    }
                }
            }
        }
    },
}