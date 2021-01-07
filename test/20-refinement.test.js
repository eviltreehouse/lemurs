'use strict';
const assert = require('assert');
const LemursDataSet = require('../index');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const raw = readFileSync(resolve(__dirname, 'fixtures', 'demo.csv'), 'utf8');

describe("Data Refinement", () => {
	/** @type {LemursDataSet} */
	let df;

	beforeEach(() => {
		df = LemursDataSet.FromCSV(raw, 'CustomerID');
		assert(df.rowCount() === 544);
	});

	afterEach(() => {
		df = null;
	});

	it('Purging rows with bad data', () => {
		const audit = {
			'removeIfNull': ['CustomerID'],
			'removeIfBlank': ['Gender'],
			'removeIfNaN': ['Tenure'],
		};

		const startingCount = df.rowCount();

		for (const i of [0,1,6,9,11,54,78]) {
			df.rows[i][df.colidx['Gender']] = '';
		}

		for (const i of [161,168,154,134,199]) {
			df.rows[i][df.colidx['Tenure']] = 'asdfg';
		}

		for (const i of [261,268,254,234,299]) {
			df.rows[i][df.colidx['CustomerID']] = null;
		}		


		const removals = df.audit(audit);
		assert(removals === 17);
		assert(df.rowCount() === (startingCount - removals));
	});

	it('Data Conversion per schema', () => {
		const StrBool = v => Boolean(Number(v))
		const YNBool = v => String(v) === 'Yes'

		const sch = {
			'Senior Citizen': StrBool,
			'Partner': YNBool,
			'Dependents': YNBool,
			'Tenure': Number,
			'Paperless Billing': StrBool,
			'Monthly Charges': Number,
			'Total Charges': Number,
		};

		df.convert(sch);
		for (const v of df.get('Senior Citizen')) assert(typeof v === 'boolean');
		for (const v of df.get('Partner')) assert(typeof v === 'boolean');
		for (const v of df.get('Tenure')) assert(typeof v === 'number');
	});

	xit('Sorting', () => {
		
	});
});