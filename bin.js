const canvas = require('canvas-api-wrapper');
const d3 = require('d3-dsv');
const fs = require('fs');

const {
    main
} = require('./main.js');

async function getInput() {
    var input;
    // Get all master courses from Canvas
    input = await canvas.get('/api/v1/accounts/1/courses?enrollment_term_id=5');
    return input;
}

async function makeOutput(output) {
    // Write a CSV report
    output = d3.csvFormat(output);
    fs.writeFileSync(`./reports/canvas-find-accordions-report-${Date.now()}.csv`, output, 'utf8');
    console.log('Report Written');
}

function handleError(error) {
    console.error(error);
    return;
}

async function start() {
    try {
        var input = await getInput();
        var output = await main(input);
        await makeOutput(output);
    } catch (error) {
        handleError(error);
    }
}

start();