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
}