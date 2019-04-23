/*************************************************************************
 * Module Description
 *************************************************************************/
const pMap = require('p-map');
const cheerio = require('cheerio');
const canvas = require('canvas-api-wrapper');

async function getCoursePages(course) {
    let pages = await canvas.get(`/api/v1/courses/${course.id}/pages`);
    return {
        course,
        pages
    };
}

async function getPageHTML(course, page) {
    page.body = await canvas.get(`/api/v1/courses/${course.id}/pages/${page.url}`);
    return page;
}

function loadCheerioObject(page) {
    return cheerio.load(page.body);
}

async function main(input) {
    let pageObjects = await pMap(input, getCoursePages);
    pageObjects.forEach(pageObject => {
        pageObject.pages.forEach(page => {
            page = getPageHTML(pageObject.course, page);
            let $ = loadCheerioObject(page);
            console.log($);
        });
    });
}

module.exports = {
    main
};