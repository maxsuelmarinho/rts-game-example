$(window).load(function() {
    game.init();
});

var game = {
    gridSize: 20,

    backgroundChanged: true,

    animationTimeout: 100, // 100 milliseconds

    offsetX: 0,

    offsetY: 0,

    init: function() {
        loader.init();

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
        // Only redraw the background if it has change
        if (game.refreshBackground) {
            game.backgroundContext.drawImage(game.currentMapImage,
                game.offsetX, game.offsetY,
                game.canvasWidth, game.canvasHeight,
                0, 0,
                game.canvasWidth, game.canvasHeight);
            
            game.refreshBackground = false;
        }

        // call the drawing loop for the next frame using request animation frame
        if (game.running) {
            requestAnimationFrame(game.drawingLoop);
        }
    }
}