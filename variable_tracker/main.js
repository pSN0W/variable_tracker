define(
    [
        'base/js/namespace'
    ],
    function (Jupyter) {
        let variable_to_track = null;
        let tracking_result = "";
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

        function skip_succeding_indentation(index,list) {
            index++;
            while(index<list.length && list[index].startsWith(' ')){
                index++;
            }
            return index;
        }

        function check_if_variable_is_changed(data) {
            return data.includes('=') && data.split('=')[0].includes(variable_to_track);
        }

        // function append_to_tracking_result(i, cell_data_list) {

        // }
        function load_ipython_extension() {
            Jupyter.notebook.events.on('execute.CodeCell', function(evt, data) {
                // data.cell is the cell object
                const notebook_cell = data.cell;
                console.log('EXTENSION: executing a cell');
                const cell_data = notebook_cell.get_text();
                //console.log(cell_data);
                const cell_data_list = cell_data.split('\n');
                //console.log(cell_data_list);
                let i = 0;
                while (i < cell_data_list.length) {
                    const data = cell_data_list[i];
                    //console.log(data);
                    if(data.trim().startsWith('#')){
                        // deal with track_variable(df)
                        console.log("Searching for tracking for comment line");
                        search_for_variable_to_track(data);
                        console.log(variable_to_track);
                        // deal with display_tracking_variable
                        // deal with force_track
                        // deal with skip_track
                        // deal with save_track
                        // deal with display_tracking_result
                    } else if(variable_to_track){
                        // skip a function
                        if(data.startsWith("def")) {
                            i = skip_succeding_indentation(i,cell_data_list);
                            continue;
                        }
                        // append if it makes a change to variable you are tracking
                        // put everything inside loop
                        // if (check_if_variable_is_changed(data)) {
                        //     append_to_tracking_result(i,cell_data_list);
                        // }
                        console.log(data);
                    }
                    i+=1;
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