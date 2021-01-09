'use strict';
const assert = require('assert');
const LemursDataSet = require('../index');

describe('Data Operations', () => {
	/** @type {LemursDataSet} */
	let df;
	
	const cols = ['Trial', 'Successes', 'Failures'];

	const data = [
		['0001', 948, 627 ],
		['0002', 596, 462 ],
		['0003', 821, 263 ],
		['0004', 586, 138 ],
		['0005', 74, 937 ],
		['0006', 216, 841 ],
		['0007', 426, 252 ],
		['0008', 303, 577 ],
		['0009', 974, 949 ],
		['0010', 745, 11 ],
		['0011', 391, 469 ],
		['0012', 998, 225 ],
		['0013', 180, 27 ],
		['0014', 897, 695 ],
		['0015', 824, 409 ],
	]

	beforeEach(() => {
		df = new LemursDataSet(data, cols, 'Trial');
	});

	afterEach(() => {
		df = null;
	});

	it('mean', () => {
		const success = df.mean('Successes');
		const fail = df.mean('Failures');

		assert(parseInt(success) === 598);
		assert(parseInt(fail) === 458);
	});	

	it('median', () => {
		const success = df.median('Successes');
		const fail = df.median('Failures');

		assert(success === 745);
		assert(fail === 469);
	});		

	it('sum', () => {
		const success = df.sum('Successes');
		const fail = df.sum('Failures');

		assert(success === 8979);
		assert(fail === 6882);
	});

	it('sumOf', () => {
		const iterations = df.sumOf(['Successes', 'Failures'], 'Iterations');
		assert(iterations.length === 15);
		assert.deepStrictEqual(iterations, df.get('Iterations'));

		const row = df.inspect('0001', true);
		assert(row.Iterations === (row.Successes + row.Failures));
	});

	it('diffOf', () => {
		const posits = df.diffOf(['Successes', 'Failures'], 'Positivity');
		assert(posits.length === 15);
		assert.deepStrictEqual(posits, df.get('Positivity'));

		const row = df.inspect('0001', true);
		assert(row.Positivity === (row.Successes - row.Failures));
	});

	it('sma', () => {
		const sma = df.sma('Successes', 3, 'SuccSMA');
		assert(sma.length === 15);
		assert.deepStrictEqual(sma.slice(0, 3).map(v => v !== null ? parseInt(v) : null), [null, null, 788]);
		assert.deepStrictEqual(parseInt(sma[14]), 633);
	});

	it('ema', () => {
		const ema = df.ema('Successes', 3, 'SuccEMA');

		assert(ema.length === 15);
		assert.deepStrictEqual(ema.slice(0, 3).map(v => v !== null ? parseInt(v) : null), [948, 772, 796]);
		assert.deepStrictEqual(parseInt(ema[14]), 755);
	});	
});