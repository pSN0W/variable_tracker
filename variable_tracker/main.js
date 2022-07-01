define(
    [
        'base/js/namespace'
    ],
    function (Jupyter) {
        let variable_to_track = null;
        function search_for_variable_to_track(s) {
            const re = /\s*#+\s*track_variable\((.*)\).*/g;
			let m;
			do {
				m = re.exec(s);
				if (m) {
					variable_to_track = m[1];
                    console.log("Found match",m[1]);
				}
			} while (m);
        }
        function load_ipython_extension() {
            Jupyter.notebook.events.on('execute.CodeCell', function(evt, data) {
                // data.cell is the cell object
                const notebook_cell = data.cell;
                console.log('EXTENSION: executing a cell');
                const cell_data = notebook_cell.get_text();
                //console.log(cell_data);
                const cell_data_list = cell_data.split('\n');
                //console.log(cell_data_list);
                for (let data of cell_data_list) {
                    //console.log(data);
                    if(data.trim().startsWith('#')){
                        console.log("Searching for tracking for comment line");
                        search_for_variable_to_track(data);
                        console.log(variable_to_track);
                    }
                }
                if(variable_to_track){
                    console.log(cell_data);
                } 
            });
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    }
)