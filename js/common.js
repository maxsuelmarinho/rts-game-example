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