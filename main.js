define(['base/js/namespace'], function (Jupyter) {
	let variable_to_track = [];
	let tracking_result = '';

	function search_for_variable_to_track(s) {
		const re = /\s*#+\s*track_variable\((.*)\).*/g;
		let m;
		do {
			m = re.exec(s);
			if (m) {
				variable_to_track = m[1];
				variable_to_track = variable_to_track.trim().split(',');
				variable_to_track = variable_to_track.filter(
					(x) => x.length > 0
				);
				Jupyter.notebook
					.insert_cell_below('markdown')
					.set_text(`Tracking Variable : ${variable_to_track}`);
			}
		} while (m);
	}

	function add_variables(s) {
		const re = /\s*#+\s*track_variable_add\((.*)\).*/g;
		let m;
		do {
			m = re.exec(s);
			if (m) {
				let provided_variable = m[1];
				provided_variable = provided_variable.trim().split(',');
				provided_variable = provided_variable.filter(
					(x) => x.length > 0
				);
				variable_to_track = [
					...new Set([...variable_to_track, ...provided_variable])
				];
				Jupyter.notebook
					.insert_cell_below('markdown')
					.set_text(`Tracking Variable : ${variable_to_track}`);
			}
		} while (m);
	}

	function remove_variables(s) {
		const re = /\s*#+\s*track_variable_remove\((.*)\).*/g;
		let m;
		do {
			m = re.exec(s);
			if (m) {
				let provided_variable = m[1];
				provided_variable = provided_variable.trim().split(',');
				provided_variable = provided_variable.filter(
					(x) => x.length > 0
				);
				variable_to_track = variable_to_track.filter(
					(v) => !provided_variable.includes(v)
				);
				Jupyter.notebook
					.insert_cell_below('markdown')
					.set_text(`Tracking Variable : ${variable_to_track}`);
			}
		} while (m);
	}

	function display_tracking_variable(data) {
		if (data.includes('display_tracking_variable')) {
			Jupyter.notebook
				.insert_cell_below('markdown')
				.set_text(`Tracking Variable : ${variable_to_track}`);
		}
	}

	function end_track(data) {
		if (data.includes('end_track')) {
			variable_to_track = [];
			Jupyter.notebook
				.insert_cell_below('markdown')
				.set_text(`Tracking Variable : ${variable_to_track}`);
		}
	}

	function force_track(data, index, list) {
		if (data.includes('force_track')) {
			index++;
			const current_string = list.slice(index).join('\n');
			tracking_result += current_string;
			tracking_result += '\n';
			return true;
		}
		return false;
	}

	function skip_track(data) {
		return data.includes('skip_track');
	}

	function display_tracking_result(data) {
		if (data.includes('display_tracking_result')) {
			Jupyter.notebook
				.insert_cell_below('markdown')
				.set_text(tracking_result);
			return true;
		}
		return false;
	}

	function save_tracking_result(data) {
		if (data.includes('save_tracking_result')) {
			Jupyter.notebook.insert_cell_below('code').set_text(`
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
		while (index >= 0 && list[index].startsWith('#')) {
			index--;
		}
		return index + 1;
	}

	function add_preceding_indentation_and_comment(index, list) {
		index--;
		while (
			index >= 0 &&
			(list[index].startsWith(' ') || list[index].startsWith('#'))
		) {
			index--;
		}
		return add_preceding_comment(index, list);
	}

	function check_if_variable_is_changed(data) {
		if (!data.includes('=')) {
			return false;
		}
		function get_variables(s) {
			const re = /([^+\-*/%]*)[+\-*/%]*=.*/g;
			let m;
			do {
				m = re.exec(s);
				if (m) {
					return m[1];
				}
			} while (m);
		}

		let all_variables = get_variables(data)
			.split(',')
			.map((x) => x.trim());
		function check_for_equality(k, v) {
			if (k.length < v.length) {
				return false;
			} else if (k.length === v.length) {
				return k === v;
			} else {
				return k.slice(0, v.length) === v && '.['.includes(k[v.length]);
			}
		}
		return variable_to_track.some((v) =>
			all_variables.some((k) => check_for_equality(k, v))
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
		Jupyter.notebook.events.on(
			'finished_execute.CodeCell',
			function (evt, data) {
				// data.cell is the cell object
				const notebook_cell = data.cell;

				if (
					notebook_cell.output_area.outputs.length > 0 &&
					notebook_cell.output_area.outputs[0].output_type === 'error'
				) {
					return;
				}
				const cell_data = notebook_cell.get_text();
				const cell_data_list = cell_data.split('\n');
				let i = 0;
				while (i < cell_data_list.length) {
					const data = cell_data_list[i];
					if (data.trim().startsWith('#')) {
						// deal with track_variable(df)
						search_for_variable_to_track(data);

						// deal with track_variable_add(df_col)
						add_variables(data);

						// deal with track_variable_remove(df)
						remove_variables(data);

						// deal with display_tracking_variable
						display_tracking_variable(data);

						// deal with force_track
						if (force_track(data, i, cell_data_list)) {
							break;
						}

						// deal with skip_track
						if (skip_track(data)) {
							break;
						}

						// deal with save_tracking_result
						if (save_tracking_result(data)) {
							break;
						}

						// deal with display_tracking_result
						if (display_tracking_result(data)) {
							break;
						}

						// deals with end_track
						end_track(data);
					} else if (variable_to_track.length > 0) {
						// skip a function
						if (data.startsWith('def')) {
							i = skip_succeding_indentation(i, cell_data_list);
							continue;
						}

						// append if it makes a change to variable you are tracking
						// put everything inside loop
						if (check_if_variable_is_changed(data)) {
							i = append_to_tracking_result(i, cell_data_list);
							continue;
						}
					}
					i += 1;
				}
			}
		);
	}

	return {
		load_ipython_extension: load_ipython_extension
	};
});
