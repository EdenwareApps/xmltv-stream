const fs = require('fs');
const path = require('path');
const test = require('tape');
const xmltv = require('../');

/**
 * Starts reading and parsing the file from the test folder. Returns the xmltv
 * parser. Also appends all the programmes data to the given array
 */
function createParser(xmlName, programmeArray) {
    var input = fs.createReadStream(path.join(__dirname, xmlName));
    var parser = new xmltv.Parser();
    input.pipe(parser);

    parser.on('programme', function (programme) {
        programmeArray.push(programme);
    });

    return parser;
}

test('XMLTV Additional Methods', function (t) {
    var parser = new xmltv.Parser();

    // Parse date with timezone offset
    t.deepEqual(
        parser.parseDate('20150506120043 +0200'),
        new Date(Date.UTC(2015, 4, 6, 10, 0, 43)),  // Adjusted to UTC
        'default parseDate full format'
    );

    // Missing seconds in date format
    t.deepEqual(
        parser.parseDate('201505061200 +0200'),
        new Date(Date.UTC(2015, 4, 6, 10, 0, 0)),
        'default parseDate missing seconds'
    );

    t.end();
});

test('XMLTV Parsing', function (t) {
    t.plan(20);
    var euProgrammes = [];
    var guideProgrammes = [];
    var itProgrammes = [];
    var euParser = createParser('eu_listings.xml', euProgrammes);
    var guideParser = createParser('tvguide.xml', guideProgrammes);
    var itParser = createParser('it_listings.xml', itProgrammes);

    euParser.on('end', function () {
        t.equal(euProgrammes.length, 87, 'Parsed all the programme tags');
        var firstProgramme = euProgrammes[0];
        t.equal(firstProgramme.channel, '3sat.de', 'Parsed channel');
        
        t.equal(firstProgramme.getSeason('0.1/3.'), 1, 'getSeason with data');
        t.equal(firstProgramme.getSeason('.4.0'), null, 'getSeason empty');
        t.equal(firstProgramme.getSeason('4.2'), null, 'getSeason bad format');
        t.equal(euProgrammes[30].getSeason(), null, 'getSeason method with no xmltv_ns');

        t.deepEqual(firstProgramme.start,
            new Date(Date.UTC(2015, 5, 3, 0, 50, 0)),  // Adjusted to UTC
            'Parsed start'
        );
        t.deepEqual(
            firstProgramme.end,
            new Date(Date.UTC(2015, 5, 3, 2, 45, 0)),  // Adjusted to UTC
            'Parsed end'
        );
        t.deepEqual(firstProgramme.title,
            ['Dünkirchen, 2. Juni 1940'],
            'Parsed title'
        );
        t.deepEqual(euProgrammes[3].secondaryTitle,
            ['Die gleißende Welt   Siri Hustvedts Roman über den entgleisten Kunstbetrieb'],
            'Parsed sub-title'
        );
        t.deepEqual(euProgrammes[3].desc,
            ['"Kulturzeit" ist das werktägliche Kulturmagazin von 3sat. "Kulturzeit" mischt sich in kulturelle und gesellschaftspolitische Fragen ein. Das Magazin bietet ergänzende Hintergrundinformationen, Porträts und Gespräche zu aktuellen und brisanten Fragen.'],
            'Parsed desc'
        );
        t.deepEqual(euProgrammes[1].category,
            ['movie', 'Documentary'],
            'Parsed category'
        );
    });

    guideParser.on('end', function () {
        t.equal(guideProgrammes[0].length, 85 * 60, 'Parsed length - minutes');
        t.equal(guideProgrammes[1].length, 35, 'Parsed length - seconds');
        t.equal(guideProgrammes[2].length, 60 * 60 * 60, 'Parsed length - hours');
        t.equal(guideProgrammes[3].length, null, 'Parsed length - bad units is null');
        t.deepEqual(guideProgrammes[17].episodeNum,
            [{ system: 'xmltv_ns', value: '.8/12.'}],
            'Parsed episode-num'
        );
        t.equal(guideProgrammes[21].getSeason(), 5, 'getSeason method works');
    });

    itParser.on('end', function () {
        t.deepEqual(itProgrammes[1533].country,
            ['ITALIA'],
            'Parsed country'
        );
        t.deepEqual(itProgrammes[1533].rating,
            [{ system: 'it', value: '1' }],
            'Parsed ratings'
        );
    });
});

test('XMLTV Error Handling', function (t) {
    var numOfErrors = 0;
    var parser = new xmltv.Parser({silent: false});
    parser.on('error', function (err) {
            t.ok(err instanceof Error, 'Got error');
            numOfErrors++;
        })
        .on('end', function () {
            t.equal(numOfErrors, 3, 'Got expected number of errors');
            t.end();
        });
    parser.end('<Bla>Invalid XML</bli>');
});
