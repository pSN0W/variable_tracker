define(
    [
        'base/js/namespace'
    ],
    function (Jupyter) {
        function load_ipython_extension() {
            Jupyter.notebook.events.on('execute.CodeCell', function(evt, data) {
                // data.cell is the cell object
                notebook_cell = data.cell;
                console.log('EXTENSION: executing a cell');
                console.log(notebook_cell);
            });
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    }
)