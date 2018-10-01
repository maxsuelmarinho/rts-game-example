$(window).load(function() {
    game.init();
});

var game = {
    gridSize: 20,

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
    },

    // run as often as the browser allows
    drawingLoop: function() {
        game.handlePanning();

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
        game.foregroundContext.clearRect(
            0,
            0,
            game.canvasWidth,
            game.canvasHeight
        );

        // start drawing the foreground elements
        for (var i = game.sortedItems.length - 1; i >= 0; i--) {
            game.sortedItems[i].draw();
        }

        // Draw the mouse
        mouse.draw();

        // call the drawing loop for the next frame using request animation frame
        if (game.running) {
            requestAnimationFrame(game.drawingLoop);
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
        if (game.type == "singleplayer") {
            singleplayer.sendCommand(uids, details);
        } else {
            multiplayer.sendCommand(uids, details);
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
        var toObject;
        if (details.toUid) {
            toObject = game.getItemByUid(details.toUid);
            if (!toObject || toObject.lifeCode == "dead") {
                // object no longer exists. Invalid command
                return;
            }
        }

        for (var i in uids) {
            var uid = uids[i];
            var item = game.getItemByUid(uid);
            if (item) {
                item.orders = $.extend([], details);
                if (toObject) {
                    item.orders.to = toObject;
                }
            }
        }
    }
}