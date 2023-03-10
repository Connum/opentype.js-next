// The `gvar` table stores information on how to modify glyf outlines across the variation space
// https://learn.microsoft.com/en-us/typography/opentype/spec/gvar

import check from '../check.js';
import { Parser } from '../parse.js';
// import table from '../table.js';

const masks = {
    SHARED_POINT_NUMBERS: 0x8000,
    // (reserved): 0x7000,
    COUNT_MASK: 0x0FFF,

    EMBEDDED_PEAK_TUPLE: 0x8000,
    INTERMEDIATE_REGION: 0x4000,
    PRIVATE_POINT_NUMBERS: 0x2000,
    // (reserved): 0x1000,
    TUPLE_INDEX_MASK: 0x0FFF,
};

function makeGvarTable() {
    console.warn('Writing of gvar tables is not yet supported.');
}

function parseTuple(p, axesCount) {
    const tuple = [];
    for(let j = 0; j < axesCount; j++) {
        tuple.push(p.parseF2Dot14());
    }
    return tuple;
}

// @TODO: move tuple (header) parsing to parse.js
// when implementing CVAR parsing

function parseTupleVariationHeader(p, axesCount) {
    const variationDataSize = p.parseUShort();
    const tupleIndex = p.parseUShort();

    const isEmbeddeddPeakTuple = tupleIndex & masks.EMBEDDED_PEAK_TUPLE;

    let peakTuple = undefined;
    let startTuple = undefined;
    let endTuple = undefined;
    let sharedTupleRecordsIndex = undefined;

    if ( isEmbeddeddPeakTuple ) {
        peakTuple = parseTuple(p, axesCount);
    } else {
        sharedTupleRecordsIndex = tupleIndex & masks.TUPLE_INDEX_MASK;
    }

    const isIntermediateRegion = !!(tupleIndex & masks.INTERMEDIATE_REGION);
    if ( isIntermediateRegion ) {
        startTuple = parseTuple(p, axesCount);
        endTuple = parseTuple(p, axesCount);
    }

    const hasPrivatePointNumbers = !!(tupleIndex & masks.PRIVATE_POINT_NUMBERS);

    // skip serialized data for now

    return {
        sharedTupleRecordsIndex,
        peakTuple,
        startTuple,
        endTuple,
        hasPrivatePointNumbers,
        variationDataSize
    };
}

// a.k.a. Tuple Variation Store Header
// https://learn.microsoft.com/en-us/typography/opentype/spec/otvarcommonformats#tuple-variation-store-header
function parseGlyphVariationDataHeader(p, tableOffset, axesCount) {
    try {
        const offsetBefore = p.relativeOffset;

        p.relativeOffset = tableOffset;

        const tupleVariationCount = p.parseUShort();
        const dataOffset = p.parseOffset16(); 

        const sharedPointNumbers = !!(tupleVariationCount & masks.SHARED_POINT_NUMBERS);
        const tupleCount = tupleVariationCount & masks.COUNT_MASK;

        const tupleVariationHeaders = [];

        for(let i = 0; i < tupleCount; i++) {
            tupleVariationHeaders.push(parseTupleVariationHeader(p, axesCount));
        }

        for (let i = 0; i < tupleVariationHeaders.length; i++) {
            const header = tupleVariationHeaders[i];
            header.points = p.parsePackedPointNumbers(header.variationDataSize);
        }

        // const variationData = Parser.parsePackedDeltas();

        p.relativeOffset = offsetBefore;

        return {
            sharedPointNumbers,
            tupleCount,
            dataOffset,
            tupleVariationHeaders
        };
    } catch(e) {
        console.error(e);
    }
}

function parseGvarTable(data, start, font) {
    const sharedTuples = [];
    const glyphVariationDataTables = [];
    const axesCount = font.tables.fvar.axes.length;

    const p = new Parser(data, start);
    const tableVersionMajor = p.parseUShort();
    const tableVersionMinor = p.parseUShort();

    if (tableVersionMajor !== 1) {
        console.warn(`Unsupported gvar table version ${tableVersionMajor}.${tableVersionMinor}`);
    }

    const axisCount = p.parseUShort();

    try {
        
        check.argument(axisCount === font.tables.fvar.axes.length, 'avar axis count must correspond to fvar axis count');
        
        const sharedTupleCount = p.parseUShort();
        const sharedTuplesOffset = p.parseOffset32();
        const glyphCount = p.parseUShort();

        if (font.tables.maxp && glyphCount !== font.tables.maxp.numGlyphs) {
            console.error(`glyphCount in gvar table (${glyphCount}) does not equal numGlyphs in maxp table (${font.tables.maxp.numGlyph})`);
        }

        console.log({glyphCount});
        
        const flags = p.parseUShort();
        const flags0 = flags & 0x0001;

        const offsetParser = (flags0 ? 'parseULong' : 'parseUShort');

        console.log({flags0, offsetParser});

        const glyphVariationDataArrayOffset = p.parseOffset32();
        const glyphVariationDataOffsets = [];

        for (let i = 0; i < glyphCount + 1; i++) {
            const offset = p[offsetParser]() * (flags0 ? 1 : 2);
            glyphVariationDataOffsets.push(offset);
            // console.log({offsetParser, offset});
            // const tableOffset = glyphVariationDataArrayOffset + offset;
            // console.log({tableOffset});
            // const glyphVariationDataHeader = parseGlyphVariationDataHeader(p, tableOffset, axesCount);
            // console.log({glyphVariationDataHeader});
        }

        console.log({glyphVariationDataOffsets});

        for (let i = 0; i < glyphVariationDataOffsets.length; i++) {
            const tableOffset = glyphVariationDataArrayOffset + glyphVariationDataOffsets[i];
            if ( p.offset + tableOffset >= p.data.byteLength ) {
                console.error(`Illegal glyph variation data offset, glyph variation data table ${i} ignored`);
            } else {
                const glyphVariationDataHeader = parseGlyphVariationDataHeader(p, tableOffset, axesCount);
                console.log({glyphVariationDataHeader});
            }
        }


        if (sharedTupleCount > 0) {
            p.relativeOffset = sharedTuplesOffset;

            for (let i = 0; i < sharedTupleCount; i++) {
                const tuple = parseTuple(p, axesCount);
                sharedTuples.push(tuple);
            }

            console.log({sharedTuples});
        }



        // console.log({
        //     tableVersionMajor,
        //     tableVersionMinor,
        //     axisCount,
        //     sharedTupleCount,
        //     sharedTuplesOffset,
        //     glyphCount,
        //     offsetParser,
        //     glyphVariationDataTables,
        //     sharedTuples
        // });
        // throw new Error('boom');
        console.log({
            version: [tableVersionMajor, tableVersionMinor],
            axisCount,
            sharedTuples,
            glyphVariationDataTables
        });
    } catch(e) {
        console.error(e);
    }

    return {
        version: [tableVersionMajor, tableVersionMinor],
        axisCount,
        sharedTuples,
        glyphVariationDataTables
    };
}

export default { make: makeGvarTable, parse: parseGvarTable };
