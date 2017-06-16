(function(){
    const _canvas = new Canvas('canvas');
    const restartButton = document.getElementById('restart-button');
    const game = new Game(_canvas, 7, 7, restartButton);
})();
