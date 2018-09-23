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

    click: function(event, rightClick) {},

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
    }

}