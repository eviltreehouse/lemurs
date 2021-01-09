'use strict';

const colSort = (_colidxs, _sortDir) => function(a, b) {
	const colidxs = [..._colidxs];
	const sortDir = [..._sortDir];

	let result = 0;

	while (true) {
		if (colidxs.length === 0) break;
	
		const colidx = colidxs.shift();
		const coeff = sortDir.shift();

		if (a[colidx] === b[colidx]) continue;
		else {
			result = (a[colidx] > b[colidx]) ? (1 * coeff) : (-1 * coeff);
			break;
		}
	}

	return result;
};

/**
 * @param {any[]} arr 
 * @param {string[]} cols 
 * @return {Object.<string,any>}
 */
const rowToObject = (arr, cols) => {
	const o = {};
	for (let ci in cols) o[cols[ci]] = arr[ci];
	return o;
};

class LemursDataSet {
	/**
	 * Create a new data frame
	 * @param {string[][]} [rows]
	 * @param {string[]} [cols]
	 * @param {string} [primaryColumn]
	 */
	constructor(rows, cols, primaryColumn) {
		this.cols = Array.isArray(cols) ? cols : [];
		this.rows = Array.isArray(rows) ? rows : [];
		this.primaryColumn = typeof primaryColumn === 'string' ? primaryColumn : null;
		if (this.primaryColumn && !this.cols.includes(this.primaryColumn)) {
			throw new Error(`${this.primaryColumn} is not defined as a column: ${this.cols.join(', ')}`);
		}

		/** @type {Object.<string,number>} */
		this.colidx = {};

		this.mapColumns();
	}

	/**
	 * Sort in-place
	 * @param {string|string[]|[string, boolean?]} cols
	 * @param {boolean} [descending]
	 * @return {this}
	 */
	sort(cols, descending) {
		const sortCols = [];
		const sortDirs = [];

		if (typeof cols === 'string') {
			sortCols.push(cols);
			sortDirs.push(descending === true ? -1 : 1);
		} else if (Array.isArray(cols)) {
			for (let sortOp of cols) {
				if (typeof sortOp === 'string') {
					sortCols.push(sortOp);
					sortDirs.push(1);
				} else if (Array.isArray(sortOp)) {
					sortCols.push(sortOp[0]);
					sortDirs.push(sortOp[1] === true ? -1 : 1);
				}
			}
		}

		if (sortCols.some(col => this.colidx[col] === undefined)) throw new Error('No such column: ' + col);

		this.rows.sort(colSort(sortCols.map(col => this.colidx[col]), sortDirs));

		return this;
	}

	/**
	 * @param {[start: number, count: number]} range
	 * @return {LemursDataSet}
	 */
	dupe(range) {
		if (!Array.isArray(range)) range = [];
		return new LemursDataSet(
			this.rows.slice(...range).map(r => [...r]),
			[...this.cols],
			this.primaryColumn
		);
	}

	/**
	 * Ensure a component of the data frame exists
	 * @param {string} col
	 * @return {void}
	 */
	ensureColumn(col) {
		if (col in this.colidx) return;
		this.cols.push(col);
		this.mapColumns();

		const idx = this.colidx[col];
		this.rows.map(r => r[idx] = null);
	}

	/**
	 * Pluck a single row from the data frame, assuming a `primaryColumn` is set.
	 * If the column isn't actually unique, it will return the 1st matching row.
	 * @param {any} id
	 */
	inspect(id) {
		if (! this.primaryColumn) throw new Error('Cannot inspect(): No primary column set!');
		const idx = this.colidx[this.primaryColumn];

		const r = this.rows.find(_ => _[idx] === id);
		if (r) return [...r]; // clone it
		else return null;
	}

	/**
	 * Pluck one or more columns from the data set in the pre-sorted order.
	 * If a single column is requested, the result will also be an array of
	 * values vs. an array of arrays. Set a `range` to limit which rows are fetched.
	 * @param {string|string[]} cols
	 * @param {number|[start: number, num: number]} [range]
	 * @return {any[]|any[][]}
	 */
	get(cols, range) {
		let returnAs = 'o';

		if (typeof cols === 'string') {
			cols = [cols];
			returnAs = 'i';
		} else if (Array.isArray(cols) && cols.length === 1) returnAs = 'i';

		// pre-flight: ensure columns are defined.
		for (let col of cols) {
			if (this.colidx[col] === undefined) throw new Error('No such column: ' + col);
		}

		if (typeof range === 'number') range = [range, 1];
		else if (!Array.isArray(range) || range.length !== 2) range = [];

		// convert to exclusive-end param for Array#slice
		if (range.length === 2) range = [range[0], range[0] + range[1]];

		// single-col
		if (returnAs === 'i') {
			const idx = this.colidx[cols[0]];
			return this.rows.slice(...range).map(r => r[idx]);
		}

		// 2+ cols
		let ret = [];
		const idxs = cols.map(_ => this.colidx[_]);
		ret = this.rows.slice(...range).map(r => idxs.map(ci => r[ci]));

		return ret;
	}

	/**
	 * @param {string} col
	 * @param {any[]} vals
	 * @return {this}
	 */
	appendColumn(col, vals) {
		this.ensureColumn(col);
		const tc = this.colidx[col];

		let idx = 0;
		this.rows.map(r => {
			r[tc] = vals[idx++];
		});

		return this;
	}

	/**
	 * @param {string} col
	 * @param {function(any): any} reduceFunction
	 * @param {any} initialValue
	 * @return {any}
	 */
	columnOp(col, reduceFunction, initialValue) {
		if (! this.colidx[col]) throw new Error('No such column: ', + col);
		const idx = this.colidx[col];
		return this.rows.map(r => r[idx]).reduce(reduceFunction, initialValue);
	}

	/**
	 *
	 * @param {string[]} cols
	 * @param {function(any): any} reduceFunction
	 * @return {any[]}
	 */
	multiColumnOp(cols, reduceFunction) {
		// pre-flight: ensure columns are defined.
		if (! Array.isArray(cols)) throw new Error('Columns must be an array');
		const colidxs = [];
		for (let col of cols) {
			if (this.colidx[col] === undefined) throw new Error('No such column: ' + col);
			colidxs.push(this.colidx[col]);
		}

		const rf = reduceFunction.bind(null, colidxs);
		return this.rows.reduce(rf, []);
	}

	/**
	 * @param {string} col
	 * @return {number}
	 */
	sum(col) {
		return this.columnOp(col, (_, v) => {
			if (isNaN(v)) return _;
			return _ + Number(v);
		}, 0);
	}

	/**
	 * @param {string[]} cols
	 * @param {string} [targetCol]
	 * @return {number[]}
	 */
	sumOf(cols, targetCol) {
		const sums = this.multiColumnOp(cols, (_idxs, acc, r) => {
			let sum = 0;
			for (let col of _idxs) {
				sum += Number(r[col])
			}

			acc.push(sum);
			return acc;
		});

		if (typeof targetCol === 'string') {
			// zip the data into the new column
			this.appendColumn(targetCol, sums);
		}

		return sums;
	}

	/**
	 * Performs an audit pass on the records. By default is will remove any row that has too many or
	 * too few columns of data, but you may optionally provide column names to different secondary
	 * audit filters (see quickdocs for `opts` parameters.) Will return the number of rows that
	 * were removed from the data set.
	 * @param {{removeIfNull?: string[], removeIfNaN?: string[], removeIfBlank?: string[]}} opts
	 * @return {number}
	 */
	audit(opts) {
		if (! opts || typeof opts !== 'object') opts = {};
		let purge = [];

		const match = v => v !== null;

		const expectedCols = this.cols.length;
		purge = [].concat(purge, this.rows.map((r,i) => r.length !== expectedCols ? i : null).filter(match));

		if (Array.isArray(opts.removeIfNull)) {
			for (const id of opts.removeIfNull) {
				const idx = this.colidx[id];
				if (idx == undefined) continue;

				purge = [].concat(purge, this.rows.map((r,i) => r[idx] === null ? i : null).filter(match));
			}
		}

		if (Array.isArray(opts.removeIfNaN)) {
			for (const id of opts.removeIfNaN) {
				const idx = this.colidx[id];
				if (idx == undefined) continue;

				purge = [].concat(purge, this.rows.map((r,i) => isNaN(r[idx]) ? i : null).filter(match));
			}
		}

		if (Array.isArray(opts.removeIfBlank)) {
			for (const id of opts.removeIfBlank) {
				const idx = this.colidx[id];
				if (idx == undefined) continue;

				purge = [].concat(purge, this.rows.map((r,i) => String(r[idx]) === '' ? i : null).filter(match));
			}
		}

		//
		// Purge and report!
		purge = [...new Set(purge)];

		this.rows = this.rows.filter((v, i) => !purge.includes(i));

		return purge.length;
	}

	/**
	 * Filter _in-place_ the rows of the data set based on the operation provided.
	 * Each row coming in will be represented as an `Object.<string,any>` of column
	 * value pairs.
	 * @param {function(Object.<string,any>): boolean} filterOp
	 * @return {this}
	 */
	filter(filterOp) {
		this.rows = this.rows.filter((row) => {
			const ro = rowToObject(row, this.cols);
			return filterOp(ro);
		});

		return this;
	}

	/**
	 * Filter the rows of the data set based on the operation provided and returns
	 * a new `LemursDataSet` with the matching rows, leaving the original intact.
	 * Each row coming in will be represented as an `Object.<string,any>` of column
	 * value pairs.
	 * @param {function(Object.<string,any>): boolean} filterOp
	 * @return {LemursDataSet}
	 */
	filtered(filterOp) {
		return this.dupe().filter(filterOp);
	}

	rowCount() {
		return this.rows.length;
	}

	clearRows() {
		this.rows.length = 0;
		return this;
	}

	/**
	 *
	 * @param  {...string[]} newRows
	 */
	add(...newRows) {
		this.rows.push(...newRows);
		return this;
	}

	mapColumns() {
		let idx = 0;
		for (let col of this.cols) this.colidx[col] = idx++;
	}

	/**
	 * Performs numerous conversions on columns per `id: mutator` definition
	 * of the passed object.
	 * @param {Object.<string,function>} conversionDef
	 * @return {this}
	 */
	convert(conversionDef) {
		for (const [id, mut] of Object.entries(conversionDef)) this.convertColumn(id, mut);
		return this;
	}

	/**
	 * Performs global column conversion on a column, effectively similar to running
	 * `.map` vertically on the row set.
	 * @param {string} id
	 * @param {function(any): any} mutator
	 * @return {this}
	 */
	convertColumn(id, mutator) {
		if (! this.cols.includes(id)) throw new Error(`Cannot convert ${id}: column not defined`);
		const col = this.colidx[id];
		this.rows.map(r => r[col] = mutator(r[col]));

		return this;
	}

	/**
	 *
	 * @param {string[]} cols
	 * @return {this}
	 */
	setColumns(cols) {
		if (! Array.isArray(cols)) throw new Error('setColumns expects an array of strings');
		if (! cols.every(v => typeof v === 'string' && v.length > 0)) throw new Error('setColumns expects an array of strings');
		this.cols = cols;

		return this;
	}

	/**
	 * @param {string} id
	 * @return {this}
	 */
	setPrimaryColumn(id) {
		if (!this.cols.includes(id)) {
			throw new Error(`${id} is not defined as a column: ${this.cols.join(', ')}`);
		}

		this.primaryColumn = id;
		return this;
	}


	/*
	=================================================================
	=== Builders
	=================================================================
	*/

	/**
	 * Spawn from loaded CSV-foramtted text. If you dont' specify `manualColumns`, it will
	 * pull them from the first row of the CSV.
	 * @param {Buffer|string} csvRaw
	 * @param {string} [primaryColumn]
	 * @param {string[]} [manualColumns]
	 * @return {LemursDataSet}
	 */
	static FromCSV(csvRaw, primaryColumn, manualColumns) {
		let rawRows = blobParse(csvRaw, ',');
		let rawCols = Array.isArray(manualColumns) ? manualColumns : (rawRows.length ? rawRows.shift() : []);

		return new LemursDataSet(rawRows.filter(r => r !== null), rawCols, primaryColumn);
	}

	/**
	 * Spawn from loaded TSV-foramtted text. If you dont' specify `manualColumns`, it will
	 * pull them from the first row of the TSV.
	 * @param {Buffer|string} csvRaw
	 * @param {string} [primaryColumn]
	 * @param {string[]} [manualColumns]
	 * @return {LemursDataSet}
	 */
	static FromTSV(tsvRaw, primaryColumn, manualColumns) {
		let rawRows = blobParse(tsvRaw, '\t');
		let rawCols = Array.isArray(manualColumns) ? manualColumns : (rawRows.length ? rawRows.shift() : []);

		return new LemursDataSet(rawRows.filter(r => r !== null), rawCols, primaryColumn);
	}
}


//
//
// Utility Methods

const charIsQuote = (ch) => ['"',"'"].includes(ch);
const charIsEsc = (ch) => ch === '\\';

/**
 * Handle quoted values in CSV/TSVs
 * @param {string} delimiter
 * @param {string} v
 * @return {string[]|null}
 */
function rowParse(delimiter, v) {
	const initSt = { 't': [], 'cur': '', 'esc': false, 'q': null };

	// blank
	if (! v.length) return null;

	const parsed = v.split('').reduce((st, ch) => {
		// console.log(JSON.stringify(st));
		if (st.esc) return { ...st, 'cur': cur + ch, 'esc': false };
		if (charIsEsc(ch)) return { ...st, 'esc': true };
		if (charIsQuote(ch) && st.q === ch) return { ...st, 'q': null };
		else if (charIsQuote(ch) && !st.q) {
			return { ...st, 'q': ch };
		}
		if (ch === delimiter && !st.q) return { ...st, 'cur': '', 't': [].concat(st.t, [st.cur]) };

		// ignore leading unquoted whitespace
		if ([' ', '\t'].includes(ch) && !st.cur && !st.q) return st;

		return {
			...st,
			'cur': st.cur + ch,
		};
	}, initSt);

	// we used to check for cur.length > 0, but it seems some exported CSVs
	// have dangling commas..
	parsed.t.push(parsed.cur);

	return parsed.t;
}

/**
 *
 * @param {string|Buffer} raw
 * @param {string} delimiter
 * @return {string[][]}
 */
function blobParse(raw, delimiter) {
	if (raw instanceof Buffer) raw = raw.toString('utf8');

	return raw.replace(/\r/g, '').split(/\n/)
		.map(rowParse.bind(this, delimiter));
}

module.exports = LemursDataSet;