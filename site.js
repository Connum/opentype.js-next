/**
 * Common code used on the demonstration pages
 */

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/\u0022/g, '&quot;')
         .replace(/\u0027/g, '&#039;');
}

function enableHighDPICanvas(canvas) {
    if (typeof canvas === 'string') {
        canvas = document.getElementById(canvas);
    }
    var pixelRatio = window.devicePixelRatio || 1;
    if (pixelRatio === 1) return;
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;
    canvas.width = oldWidth * pixelRatio;
    canvas.height = oldHeight * pixelRatio;
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';
    canvas.getContext('2d').scale(pixelRatio, pixelRatio);
}

function checkFileType( file ) {
    return ( ! file.type )
                || ( file.type.substring(0, 16) === 'application/font' )
                || ( file.type.substring(0, 18) === 'application/x-font' )
                || ( file.type.substring(0, 5) === 'font/' )
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener( 'dragover', function(ev) {
        ev.preventDefault();
        const draggedFont = Array.from(ev.dataTransfer?.items || []).find( file => {
            return checkFileType( file );
            ;
        } );
        console.log(draggedFont);
        if ( ! draggedFont ) {
            ev.dataTransfer.dropEffect = 'none';
        }
    });
    document.body.addEventListener( 'drop', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        const droppedFont = Array.from(ev.dataTransfer.files).find( file => {
            return checkFileType( file );
            ;
        } );
        if ( droppedFont ) {
            try {
                document.getElementById('file').files = ev.dataTransfer.files;
            } catch( e ) {}

            onReadFile && onReadFile({
                target: {
                    files: [ droppedFont ]
                }
            })
        }
    });
})