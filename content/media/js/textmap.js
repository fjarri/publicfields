var ASPECTS = ['robinson', 'A', 'golden'];
var COLORSETS = {};
var CURRENT_ASPECT = null;


function createBackends() {
    for (var i in ASPECTS) {
        var aspect = ASPECTS[i];
        var backend_id = 'map_thumbnail_backend_' + aspect;
        // $('#map_thumbnail_backend').remove();
        $('<canvas>').attr({
            type: 'hidden',
            id: backend_id,
        }).appendTo('body');
        $("#" + backend_id).hide();
    }
}

function loadImages(colors) {

    var image_load_callbacks = [];

    for (var i in ASPECTS) {
        var aspect = ASPECTS[i];

        COLORSETS[aspect] = $.extend(true, {}, colors); // deep copy

        var image = new Image();
        image.backend_id = 'map_thumbnail_backend_' + aspect;

        image_load_callbacks.push($.Deferred(function (dfd) {
            $(image).load(function () {
                var src_canvas = $("#" + this.backend_id).get(0);
                src_canvas.width = this.width;
                src_canvas.height = this.height;

                var src_ctx = src_canvas.getContext('2d');
                src_ctx.drawImage(this, 0, 0);
                dfd.resolve();
            });
        }).promise());

        image.src = "http://localhost:8080/textmap/thumbnail800-" + aspect + ".png";
    }

    $.when.apply(this, image_load_callbacks).then(function () {

        // change map colors

        setThumbnailBackend('robinson');

        // change color editing fields

        // If everything is fine,
        // unhide customization machinery and hide the error message
        $("#eps-customizer-error").hide();
        $("#eps-customizer-wrapper").show();
    });
}

function setThumbnailBackend(aspect) {
    CURRENT_ASPECT = aspect;
    var backend = $("#map_thumbnail_backend_" + aspect);
    var canvas = backend.get(0);
    $("#map_thumbnail").attr('src', canvas.toDataURL());
}

function adjustThumbnailColors(newcolors) {

    var aspect = CURRENT_ASPECT;
    var backend = $("#map_thumbnail_backend_" + aspect);

    var width = backend.width();
    var height = backend.height();
    var oldcolors = COLORSETS[aspect];
    var canvas = backend.get(0);
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;

    for (var colorname in newcolors) {
        var pos = 0;
        var newcolor = newcolors[colorname];
        var oldcolor = oldcolors[colorname];

        if (newcolor[0] == oldcolor[0] && newcolor[1] == oldcolor[1] &&
                newcolor[2] == oldcolor[2]) {
            continue;
        }

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                // set red, green, blue, and alpha:
                r = data[pos+0];
                g = data[pos+1];
                b = data[pos+2];
                if (r == oldcolor[0] && g == oldcolor[1] && b == oldcolor[2]) {
                    data[pos+0] = newcolor[0];
                    data[pos+1] = newcolor[1];
                    data[pos+2] = newcolor[2];
                }
                pos += 4;
            }
        }
    }
    COLORSETS[aspect] = $.extend(true, {}, newcolors); // deep copy

    ctx.putImageData(imageData, 0, 0, width, height);

    setThumbnailBackend(aspect);
}

function processColors(colors) {
    $(function() {
        createBackends();
        loadImages(colors);
    });
}


$(window).resize(function() {
    var width = $("#map_thumbnail").width();
    var src_width = $("#map_thumbnail_backend_robinson").width();
    var src_height = $("#map_thumbnail_backend_robinson").height();
    $("#map_thumbnail").height(width / src_width * src_height);
});


// enable/disable color fields on checkbox state change
$("#show_colors").click(function() {
    if($("#show_colors").is(":checked")) {
        $('[id^="main"]').each(function(i) {
            $(this).removeClass("disabled");
            $(this).addClass("focused");
            $(this).removeAttr("disabled");
        });
    }
    else {
        $('[id^="main"]').each(function(i) {
            $(this).removeClass("focused");
            $(this).addClass("disabled");
            $(this).attr("disabled", "");
        });
    }
});

// handlers for aspect changing radios
for (var index in ASPECTS) {
    $("#aspect_" + ASPECTS[index]).change((function(aspect) {
        return function() {
            setThumbnailBackend(aspect);
        }
    })(ASPECTS[index]));
}
