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
                    // console.log("Found match",m[1]);
				}
			} while (m);
        }

        function force_track(data,index,list){
            if(data.includes("force_track")) {
                index++;
                const current_string = list.slice(index).join('\n');
				tracking_result += current_string;
				tracking_result += '\n';
                return true;
            }
            return false;
        }

        function skip_track(data) {
            return data.includes("skip_track");
        }

        function display_tracking_result(data){
            if(data.includes("display_tracking_result")){
                Jupyter.notebook
					.insert_cell_below('markdown')
					.set_text(tracking_result);
                return true;
            }
            return false;
        }

        function save_tracking_result(data) {
			if (data.includes('save_tracking_result')) {
				Jupyter.notebook
					.insert_cell_below('code')
					.set_text(`
tracking_data = """${tracking_result}"""
with open("context.txt",'w') as f:
    f.write(tracking_data)
                    `);
				return true;
			}
			return false;
		}

        function skip_succeding_indentation(index, list) {
			index++;
			while (index < list.length && list[index].startsWith(' ')) {
				index++;
			}
			return index;
		}

		function add_preceding_comment(index, list) {
			index--;
			while (index > 0 && list[index].startsWith('#')) {
				index--;
			}
			return index + 1;
		}

		function add_preceding_indentation_and_comment(index, list) {
			index--;
			while (
				index > 0 &&
				(list[index].startsWith(' ') || list[index].startsWith('#'))
			) {
				index--;
			}
			return add_preceding_comment(index, list);
		}

		function check_if_variable_is_changed(data) {
			return (
				data.includes('=') &&
				data.split('=')[0].includes(variable_to_track)
			);
		}

		function append_to_tracking_result(index, list) {
			let end;
			let start;
			if (list[index].startsWith(' ')) {
				start = add_preceding_indentation_and_comment(index, list);
				end = skip_succeding_indentation(index, list);
			} else {
				start = add_preceding_comment(index, list);
				end = index + 1;
			}
			const current_string = list.slice(start, end).join('\n');
			tracking_result += current_string;
            tracking_result += '\n';
			return end;
		}

        function load_ipython_extension() {
            Jupyter.notebook.events.on('execute.CodeCell', function(evt, data) {
                // data.cell is the cell object
                const notebook_cell = data.cell;
                // console.log('EXTENSION: executing a cell');
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
                        // console.log("Searching for tracking for comment line");
                        search_for_variable_to_track(data);
                        // console.log(variable_to_track);
                        // deal with display_tracking_variable
                        // deal with force_track
                        if(force_track(data,i,cell_data_list)) {
                            break;
                        }
                        // deal with skip_track
                        if(skip_track(data)){
                            break;
                        }
                        // deal with save_tracking_result
                        if(save_tracking_result(data)){
                            break;
                        }
                        // deal with display_tracking_result
                        if(display_tracking_result(data)){
                            break;
                        }
                    } else if(variable_to_track){
                        // skip a function
                        if(data.startsWith("def")) {
                            i = skip_succeding_indentation(i,cell_data_list);
                            continue;
                        }
                        // append if it makes a change to variable you are tracking
                        // put everything inside loop
                        if (check_if_variable_is_changed(data)) {
                            i = append_to_tracking_result(i,cell_data_list);
                            continue;
                        }
                        console.log(data);
                    }
                    i+=1;
                }
                // if(variable_to_track){
                //     console.log(cell_data);
                // } 
                console.log(tracking_result);
            });
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    }
)