/*************************************************************************
 * Module Description
 *************************************************************************/
const pMap = require('p-map');
const cheerio = require('cheerio');
const canvas = require('canvas-api-wrapper');

async function getCourseInfo(course) {
    let pages = await canvas.get(`/api/v1/courses/${course.id}/pages`);
    let assignments = await canvas.get(`api/v1/courses/${course.id}/assignments`);
    console.log(`All Pages and Assignments Retrieved for course: ${course.id}`);
    return {
        course,
        pages,
        assignments
    };
}

function loadCheerioObject(html) {
    if (html) {
        return cheerio.load(html);
    } else {
        return undefined;
    }
}

async function getPageBodies(pageObject) {
    pageObject.pages = await pMap(pageObject.pages, async page => await canvas.get(`/api/v1/courses/${pageObject.course.id}/pages/${page.url}`));
    return pageObject;
}

function doAssignment(assignment) {
    let $ = loadCheerioObject(assignment.description);
    if ($) {
        if ($('div.accordion').attr('class')) {
            assignment.class_name = $('div.accordion').attr('class');
            return assignment;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

function doPage(page) {
    let $ = loadCheerioObject(page.body);
    if ($) {
        if ($('div.accordion').attr('class')) {
            page.class_name = $('div.accordion').attr('class');
            return page;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

async function loopOverCourseItems(pageObject) {
    pageObject = await getPageBodies(pageObject);
    pageObject.bad_pages = pageObject.pages.map(doPage).filter(badPage => !!badPage);
    pageObject.bad_assignments = pageObject.assignments.map(doAssignment).filter(badAssignment => !!badAssignment);
    if (pageObject.bad_pages.length > 0 || pageObject.bad_assignments.length > 0) {
        console.log(`Accordions found! Pages: ${pageObject.bad_pages.length}; Assignments: ${pageObject.bad_assignments.length}`);
        return pageObject;
    } else {
        console.log(`No accordions found in course: ${pageObject.course.id}`);
        return undefined;
    }
}

async function main(input) {
    let pageObjects = await pMap(input, getCourseInfo);
    let badCourseObjects = await pMap(pageObjects, loopOverCourseItems);
    badCourseObjects = badCourseObjects.filter(badPageObject => !!badPageObject);
    let output = [];
    badCourseObjects.forEach(badCourseObject => {
        badCourseObject.bad_pages.forEach(badPage => {
            output.push({
                course_id: badCourseObject.course.id,
                type: 'Page',
                bad_url: badPage.url,
                class_name: badPage.class_name
            });
        });
        badCourseObject.bad_assignments.forEach(badAssignment => {
            output.push({
                course_id: badCourseObject.course.id,
                type: 'Assignment',
                bad_url: badAssignment.html_url,
                class_name: badAssignment.class_name
            });
        });
    });
    return output;
}

module.exports = {
    main
};