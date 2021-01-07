'use strict';
const assert = require('assert');
const LemursDataSet = require('../index');
const simpleData = require('./fixtures/simple-data.json');


describe('Lemurs Instances', () => {
	it('Blank OK', () => {
		const df = new LemursDataSet();
		assert(df && typeof df === 'object');
		assert(df.cols.length === 0);
		assert(df.rowCount() === 0);
		assert(df.primaryColumn === null);
	});

	it('Simple OK', () => {
		const df = new LemursDataSet(simpleData, ['Name', 'Age', 'Department'], 'Name');

		assert(df && typeof df === 'object');
		assert(df.cols.length === 3);
		assert(df.rowCount() === 4);
		assert(df.primaryColumn === 'Name');

		assert.deepStrictEqual(df.get('Name'), ['Alice', 'Bob', 'Clara', 'Devon']);
		assert.deepStrictEqual(df.get('Age'), ['32', '46', '47', '29']);
		assert.deepStrictEqual(df.inspect('Alice') , ['Alice', '32', 'IT']);
		
		assert.deepStrictEqual(df.get('Name', 1) , ['Bob']);
		assert.deepStrictEqual(df.get(['Name', 'Department'], [1, 3]), 
			[ ['Bob','Finance'], ['Clara', 'Executive'], ['Devon', 'Sales'] ]
		);
	})
})