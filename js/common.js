(function() {
    var lastTime = 0;
    var vendors = ['ms', ';', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || 
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currentTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currentTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currentTime + timeToCall);
            }, timeToCall);

            lastTime = currentTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());

var loader = {
    loaded: true,
    loadedCount: 0,
    totalCount: 0,

    init: function() {
        var mp3Support, oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
        } else {
            mp3Support = false;
            oggSupport = false;
        }

        loader.soundFileExtention = oggSupport ? ".ogg" : mp3Support ? ".mp3" : undefined;
    },

    loadImage: function(url) {
        this.totalCount++;
        this.loaded = false;

        $('#loadingscreen').show();

        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    
    soundFileExtention: ".ogg",

    loadSound: function(url) {
        this.totalCount++;
        this.loaded = false;

        $('#loadingscreen').show();

        var audio = new Audio();
        audio.src = url + loader.soundFileExtention;
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;
    },

    itemLoaded: function() {
        loader.loadedCount++;

        $('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);

        if (loader.loadedCount === loader.totalCount) {
            loader.loaded = true;

            $('#loadingscreen').hide();

            if (loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    },
};

function loadItem(name) {
    console.log("loadItem", name);
    var item = this.list[name];

    if (item.spriteArray) {
        return;
    }

    item.spriteSheet = loader.loadImage('images/' + this.defaults.type + '/' + name + '.png');
    item.spriteArray = [];
    item.spriteCount = 0;

    for (var i = 0; i < item.spriteImages.length; i++) {
        var constructImageCount = item.spriteImages[i].count;
        var constructDirectionCount = item.spriteImages[i].directions;

        if (constructDirectionCount) {
            for (var j = 0; j < constructDirectionCount; j++) {
                var constructImageName = item.spriteImages[i].name + '-' + j;
                item.spriteArray[constructImageName] = {
                    name: constructImageName,
                    count: constructImageCount,
                    offset: item.spriteCount
                };

                item.spriteCount += constructImageCount;
            }
        } else {
            var constructImageName = item.spriteImages[i].name;
            item.spriteArray[constructImageName] = {
                name: constructImageName,
                count: constructImageCount,
                offset: item.spriteCount
            };

            item.spriteCount += constructImageCount;
        }
    }
}

function addItem(details) {
    var item = {};
    var name = details.name;
    $.extend(item, this.defaults);
    $.extend(item, this.list[name]);
    item.life = item.hitPoints;
    $.extend(item, details);
    
    return item;
}

// finds the angle between two objects in terms of a direction
// where 0 <= angle < directions
function findAngle(object, unit, directions) {
    var dx = object.x - unit.x;
    var dy = object.y - unit.y;

    // convert Arctan to value between 0 - directions
    var angle = 
        wrapDirection(directions / 2 -(Math.atan2(dx, dy) * directions / (2 * Math.PI)), directions);

    return angle;
}

// returns the smallest difference
// value ranging between -directions / 2 to +directions / 2
function angleDiff(angle1, angle2, directions) {
    if (angle1 >= directions / 2) {
        angle1 = angle1 - directions;
    }

    if (angle2 >= directions / 2) {
        angle2 = angle2 - directions;
    }

    diff = angle2 - angle1;

    if (diff < -directions / 2) {
        diff += directions;
    }

    if (diff > directions / 2) {
        diff -= directions;
    }

    return diff;
}

// wrap value of direction so that it lies between 0 and directions - 1
function wrapDirection(direction, directions) {
    if (direction < 0) {
        direction += directions;
    }

    if (direction >= directions) {
        direction -= directions;
    }

    return direction;
}