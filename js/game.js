/*
$(window).load(function() {
    game.init();
});
*/
var game = {

    defaultWidth: 640,
    defaultHeight: 480,
    canvasWidth: 480,
    canvasHeight: 400,

    scale: 1,

    // a control loop that runs at a fixed period of time
    animationTimeout: 100, // 100 milliseconds or 10 times a second

    // x and y panning offsets for the map
    offsetX: 0,
    offsetY: 0,

    gridSize: 20, // the map is broken into square tiles of the size (20 x 20 px)

    panningThreshold: 80, // distance from canvas's edge at which panning starts
    maximumPanDistance: 10, //the maximum distance to pan in a single drawing loop

    refreshBackground: false,

    /*
    debug: false,    
    backgroundChanged: true,
    panningSpeed: 10,
    selectionBorderColor: "rgb(255, 255, 0, 0.5)",
    selectionFillColor: "rgb(255, 215, 0, 0.2)",
    healthBarBorderColor: "rgb(0, 0, 0, 0.8)",
    healthBarHealthyFillColor: "rgb(0, 255, 0, 0.5)",
    healthBarDamagedFillColor: "rgb(255, 0, 0, 0.5)",
    lifeBarHeight: 5,
    speedAdjustmentFactor: 1 / 64,
    turnSpeedAdjustmentFactor: 1 / 8,
    */

    init: function() {
        // initialize objects
        loader.init();
        mouse.init();
        //sidebar.init();

        // initialize and store contexts for both canvases
        game.initCanvases();

        //$('.gamelayer').hide();
        game.hideScreens();        
        //$('#gamestartscreen').show();
        game.showScreen("gamestartscreen");
    },

    initCanvases: function() {
        game.backgroundCanvas = document.getElementById('gamebackgroundcanvas');
        game.backgroundContext = game.backgroundCanvas.getContext('2d');

        game.foregroundCanvas = document.getElementById('gameforegroundcanvas');
        game.foregroundContext = game.foregroundCanvas.getContext('2d');

        game.backgroundCanvas.width = game.canvasWidth;
        game.backgroundCanvas.height = game.canvasHeight;

        game.foregroundCanvas.width = game.canvasWidth;
        game.foregroundCanvas.height = game.canvasHeight;
    },

    hideScreens: function() {
        var screens = document.getElementsByClassName("gamelayer");
        for(let i = screens.length - 1; i >= 0; i--) {
            let screen = screens[i];
            screen.style.display = "none";
        }
    },

    hideScreen: function(id) {
        var screen = document.getElementById(id);
        screen.style.display = "none";
    },

    showScreen: function(id) {
        var screen = document.getElementById(id);
        screen.style.display = "block";
    },

    resize: function() {
        var maxWidth = window.innerWidth;
        var maxHeight = window.innerHeight;
        var scale = Math.min(maxWidth / game.defaultWidth, maxHeight / game.defaultHeight);

        var gameContainer = document.getElementById("gamecontainer");
        gameContainer.style.transform = "translate(-50%, -50%) " + "scale(" + scale + ")";
        game.scale = scale;

        // what is the maximum width we can set based on the current scale
        // clamp the value between 640 and 1024
        var width = Math.max(640, Math.min(1024, maxWidth / scale));
        // apply this new width to game container and game canvas
        gameContainer.style.width = width + "px";

        // subtract 160px for the sidebar
        var canvasWidth = width - 160;
        // set a flag in case the canvas was resized
        if (game.canvasWidth !== canvasWidth) {
            game.canvasWidth = canvasWidth;
            game.canvasResized = true;
        }
    },

    loadLevelData: function(level) {
        game.currentLevel = level;
        game.currentMap = maps[level.mapName];

        // load all the assets for the level starting with the map image
        game.currentMapImage = loader.loadImage("images/maps/" + maps[level.mapName].mapImage);

        // initialize all the arrays for the game
        game.resetArrays();

        // load all the assets for every entity defined in the level requirements array
        for (let type in level.requirements) {
            let requirementArray = level.requirements[type];
            requirementArray.forEach(function(name) {
                if(window[type] && typeof window[type].load === "function") {
                    window[type].load(name);
                } else {
                    console.log("Could not load type: ", type);
                }
            });
        }

        // add all the items defined in the level items array to the game
        level.items.forEach(function(itemDetails) {
            game.add(itemDetails);
        });
    },

    start: function() {
        //$('.gamelayer').hide();
        //$('#gameinterfacescreen').show();
        game.hideScreens();
        game.showScreen("gameinterfacescreen");
        game.running = true;
        game.refreshBackground = true;
        game.canvasResized = true;

        game.drawingLoop();
    },

    // the animation loop will run at a fixed interval (100ms)
    animationLoop: function() {
        // animate each of the elements within the game
        game.items.forEach(function(item) {
            item.animate();
        });

        // sort game items into a sortedItems array based on their x, y coordinates
        game.sortedItems = Object.assign([], game.items);
        game.sortedItems.sort(function(a, b) {
            return a.y - b.y + ((a.y === b.y) ? (b.x - a.x) : 0);
        });

        /*
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
        */
    },

    // run as often as the browser allows
    drawingLoop: function() {        
        // pan the map if the cursor is near the edge of the canvas
        game.handlePanning();
        
        // draw the background whenever necessary
        game.drawBackground();

        // clear the foreground canvas
        game.foregroundContext.clearRect(0, 0, game.canvasWidth, game.canvasHeight);

        // start drawing the foreground elements
        game.sortedItems.forEach(function(item) {
            item.draw();
        });

        // draw the mouse
        mouse.draw();

        // call the drawing loop for the next frame using request animation frame
        if (game.running) {
            requestAnimationFrame(game.drawingLoop);
        }
    },

    drawBackground: function() {
        /*
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
        */

        // Only redraw the background if it has changes (due to panning or resizing)
        if (game.refreshBackground || game.canvasResized) {
            if (game.canvasResized) {
                game.backgroundCanvas.width = game.canvasWidth;
                game.foregroundCanvas.width = game.canvasWidth;

                // ensure the resizing doesn't cause the map to pan out of bounds
                if (game.offsetX + game.canvasWidth > game.currentMapImage.width) {
                    game.offsetX = game.currentMapImage.width - game.canvasWidth;
                }

                if (game.offsetY + game.canvasHeight > game.currentMapImage.height) {
                    game.offsetY = game.currentMapImage.height - game.canvasHeight;
                }

                game.canvasResized = false;                
            }

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

        /*
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
        */
    },

    handlePanning: function() {
        // do not pan if mouse leaves the canvas
        if (!mouse.insideCanvas) {
            return;
        }

        if (mouse.x <= game.panningThreshold) {
            // mouse is at the left edge of the game area. pan to the left.
            let panDistance = game.offsetX;
            if (panDistance > 0) {
                game.offsetX -= Math.min(panDistance, game.maximumPanDistance);
                game.refreshBackground = true;                
            }
        } else if (mouse.x >= game.canvasWidth - game.panningThreshold) {
            // mouse is at the right edge of the game area. Pan to the right.
            let panDistance = game.currentMapImage.width - game.canvasWidth - game.offsetX;

            if (panDistance > 0) {                
                game.offsetX += Math.min(panDistance, game.maximumPanDistance);
                game.refreshBackground = true;
            }
        }

        if (mouse.y <= game.panningThreshold) {
            // mouse is at the top edge of the game area. pan upwards.
            let panDistance = game.offsetY;
            if (panDistance > 0) {                
                game.offsetY -= Math.min(panDistance, game.maximumPanDistance);
                game.refreshBackground = true;
            }
        } else if (mouse.y >= game.canvasHeight - game.panningThreshold) {
            // mouse is at the bottom edge of the game area. pan downwards.
            let panDistance = game.currentMapImage.height - game.offsetY - game.canvasHeight;
            if (panDistance > 0) {                
                game.offsetY += Math.min(panDistance, game.maximumPanDistance);
                game.refreshBackground = true;
            }
        }

        if (game.refreshBackground) {
            // update mouse game coordinates based on game offsets
            mouse.calculateGameCoordinates();
        }
    },

    resetArrays: function() {
        // count items added in game, to assign them a unique id
        game.counter = 0;

        // track all the items currently in the game
        game.items = [];
        game.buildings = [];
        game.vehicles = [];
        game.aircraft = [];
        game.terrain = [];
        game.selectedItems = [];
        
        /*
        game.triggeredEvents = [];        
        game.sortedItems = [];
        */
    },

    add: function(itemDetails) {
        // set a unique id for the item
        if (!itemDetails.uid) {
            itemDetails.uid = ++game.counter;
        }

        var item = window[itemDetails.type].add(itemDetails);

        // add the item to the items array
        game.items.push(item);
        
        // add the item to the type specific array
        game[item.type].push(item);

        /*
        if (item.type == "buildings" || item.type == "terrain") {
            game.currentMapPassableGrid = undefined;
        }
        */

        return item;
    },

    remove: function(item) {
        // unselect item if it is selected
        item.selected = false;
        for (let i = game.selectedItems.length - 1; i >= 0; i--) {
            if (game.selectedItems[i].uid === item.uid) {
                game.selectedItems.splice(i, 1);
                break;
            }

        }

        // remove item from the items array
        for (let i = game.items.length - 1; i >= 0; i--) {
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

        /*
        if (item.type == "buildings" || item.type == "terrain") {
            game.currentMapPassableGrid = undefined;
        }
        */
    },

    clearSelection: function() {
        while(game.selectedItems.length > 0) {
            // removes the item from the array
            game.selectedItems.pop().selected = false;
        }
    },

    selectItem: function(item, shiftPressed) {
        // Pressing shift and clicking on a selected item will deselect it
        if (shiftPressed && item.selected) {
            item.selected = false; // deselect item
            for (let i = game.selectedItems.length - 1; i >= 0; i--) {
                if (game.selectedItems[i].uid == item.uid) {
                    game.selectedItems.splice(i, 1);
                    break;
                }
            }

            return;
        }

        if (item.selectable && !item.selected) {
            console.log("item selected: ", item);
            item.selected = true;
            game.selectedItems.push(item);
        }
    },

    /*
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
    */
};

// initialize and resize the game once page has fully loaded
window.addEventListener("load", function() {
    game.resize();
    game.init();
}, false);

// resize the game any time the window is resized
window.addEventListener("resize", function() {
    game.resize();
});