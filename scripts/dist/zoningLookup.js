"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupZoning = lookupZoning;
const municipalZoningProviders_1 = require("./municipalZoningProviders");
const MUNICIPAL_RULES = [
    // British Columbia
    {
        match: ["vancouver, bc", "vancouver, british columbia", "east vancouver", "west vancouver", "north vancouver"],
        zoneCode: "RS-1 / RS-2", zoneDescription: "Single-family — laneway and garden suite permitted",
        maxAduSqFt: 861, maxStories: 1, maxHeightFt: null,
        frontSetback: null, sideSetback: "4.9 ft (1.5 m)", rearSetback: "4.9 ft (1.5 m)",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU review — City of Vancouver",
    },
    {
        match: ["burnaby, bc", "burnaby, british columbia"],
        zoneCode: "R1 / R2", zoneDescription: "Single-family — secondary suite and garden suite permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard zoning review — City of Burnaby",
    },
    {
        match: ["surrey, bc", "surrey, british columbia"],
        zoneCode: "RF / RF-9", zoneDescription: "Single-family — coach house and secondary suite permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "6 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development permit — City of Surrey",
    },
    {
        match: ["victoria, bc", "victoria, british columbia", "saanich, bc"],
        zoneCode: "R1-B / R2", zoneDescription: "Single-family — garden suite and secondary suite permitted",
        maxAduSqFt: 968, maxStories: 1, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "6 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU review — City of Victoria",
    },
    {
        match: ["kelowna, bc", "kelowna, british columbia"],
        zoneCode: "RU1 / MF1", zoneDescription: "Urban residential — carriage house permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Kelowna",
    },
    {
        match: ["courtenay, bc", "courtenay, british columbia", "comox valley, bc"],
        zoneCode: "Residential district", zoneDescription: "Courtenay residential zone - secondary residence eligibility requires district review",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "Confirm with City of Courtenay", rearSetback: "Confirm with City of Courtenay",
        parkingRequired: "Confirm with City of Courtenay", overlayRisks: ["Confirm parcel-specific zoning requirements"],
        aduPermitted: null, reviewRisk: "Medium", permitPath: "Zoning and building permit review - City of Courtenay",
    },
    // Alberta
    {
        match: ["calgary, ab", "calgary, alberta"],
        zoneCode: "R-CG / R-G", zoneDescription: "Grade-oriented infill — garage and garden suites permitted. $35K incentive available.",
        maxAduSqFt: 1076, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "3.9 ft", rearSetback: "6.6 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Calgary",
    },
    {
        match: ["edmonton, ab", "edmonton, alberta"],
        zoneCode: "RF1 / RSL", zoneDescription: "Low-density residential — secondary and garden suites permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "3.9 ft", rearSetback: "6.6 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Edmonton",
    },
    {
        match: ["leduc, ab", "leduc, alberta"],
        zoneCode: "Residential district", zoneDescription: "Leduc residential zoning - secondary suite eligibility requires district review",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "Confirm with City of Leduc", rearSetback: "Confirm with City of Leduc",
        parkingRequired: "Confirm with City of Leduc", overlayRisks: ["No live municipal polygon source configured"],
        aduPermitted: null, reviewRisk: "Medium", permitPath: "Development permit review - City of Leduc",
    },
    // Ontario
    {
        match: ["toronto, on", "toronto, ontario", "north york", "scarborough", "etobicoke"],
        zoneCode: "RD / RS", zoneDescription: "Residential detached — garden suite and laneway suite permitted",
        maxAduSqFt: 1076, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5.9 ft", rearSetback: "15 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — City of Toronto",
    },
    {
        match: ["mississauga, on", "mississauga, ontario"],
        zoneCode: "R1 / R2", zoneDescription: "Residential — additional dwelling unit permitted",
        maxAduSqFt: 968, maxStories: 1, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "20 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Medium", permitPath: "Building permit — City of Mississauga",
    },
    {
        match: ["ottawa, on", "ottawa, ontario"],
        zoneCode: "R1 / R2", zoneDescription: "Residential — secondary dwelling unit permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "19.7 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — City of Ottawa",
    },
    // Washington
    {
        match: ["seattle, wa", "seattle, washington"],
        zoneCode: "SF 5000 / SF 7200", zoneDescription: "Single-family — DADU and AADU permitted by right",
        maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard permit — City of Seattle DCI",
    },
    {
        match: ["bellevue, wa", "redmond, wa", "kirkland, wa", "renton, wa"],
        zoneCode: "R-1 / R-4", zoneDescription: "Single-family — ADU permitted under Washington HB 1337",
        maxAduSqFt: 900, maxStories: 1, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Eastside municipalities",
    },
    // Oregon
    {
        match: ["portland, or", "portland, oregon"],
        zoneCode: "R2 / R2.5 / R5", zoneDescription: "Standard residential — ADU permitted by right. SDC fees waived.",
        maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development review — Portland BDS",
    },
    // California
    {
        match: ["los angeles, ca", "los angeles, california"],
        zoneCode: "R1 / R2", zoneDescription: "Single-family — ADU permitted by state law. Pre-approved plans available.",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Standard ADU permit — LADBS",
    },
    {
        match: ["san francisco, ca", "san francisco, california"],
        zoneCode: "RH-1 / RH-2", zoneDescription: "Residential house — ADU permitted by state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Medium", permitPath: "ADU permit — SF DBI",
    },
    {
        match: ["san diego, ca", "san diego, california"],
        zoneCode: "RS-1-7 / RS-1-4", zoneDescription: "Single-family — ADU permitted by state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — City of San Diego",
    },
    {
        match: ["san jose, ca", "san jose, california"],
        zoneCode: "R1-8 / R1-6", zoneDescription: "Single-family — ADU permitted by state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Over-the-counter permit — City of San Jose",
    },
    {
        match: ["sacramento, ca", "sacramento, california"],
        zoneCode: "R-1 / R-1B", zoneDescription: "Single-family — ADU and JADU permitted",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial permit — City of Sacramento",
    },
    {
        match: ["richmond, bc", "richmond, british columbia"],
        zoneCode: "Single Family (RS)", zoneDescription: "Richmond residential — coach house or secondary suite permitted under Bill 44",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft (1.2 m)", rearSetback: "4.9 ft (1.5 m)",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Zoning review & building permit — City of Richmond",
    },
    {
        match: ["coquitlam, bc", "coquitlam, british columbia"],
        zoneCode: "One-Family Residential (RS)", zoneDescription: "Coquitlam residential — detached accessory dwelling unit (DADU) permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Coquitlam",
    },
    {
        match: ["delta, bc", "delta, british columbia"],
        zoneCode: "Single Family Residential", zoneDescription: "Delta residential — coach house and secondary suite permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit review — City of Delta",
    },
    {
        match: ["langley, bc", "langley, british columbia"],
        zoneCode: "Residential Zone", zoneDescription: "Langley residential — secondary suite and coach house permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City/Township of Langley",
    },
    {
        match: ["abbotsford, bc", "abbotsford, british columbia"],
        zoneCode: "Urban Residential (RS)", zoneDescription: "Abbotsford residential — coach house and secondary suite permitted by right",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Abbotsford",
    },
    {
        match: ["brampton, on", "brampton, ontario"],
        zoneCode: "Residential Detached (R1)", zoneDescription: "Brampton residential — additional residential unit (ARU) permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "13 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "ARU registration & building permit — City of Brampton",
    },
    {
        match: ["vaughan, on", "vaughan, ontario"],
        zoneCode: "Residential (R1)", zoneDescription: "Vaughan residential — additional residential unit (ARU) permitted by right",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "15 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Vaughan",
    },
    {
        match: ["markham, on", "markham, ontario"],
        zoneCode: "Residential (R1)", zoneDescription: "Markham residential — secondary suites and accessory units permitted by right",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "15 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Markham",
    },
    {
        match: ["hamilton, on", "hamilton, ontario"],
        zoneCode: "Residential (R1 / R2)", zoneDescription: "Hamilton residential — accessory apartments and laneway suites permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "13 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Hamilton",
    },
    {
        match: ["airdrie, ab", "airdrie, alberta"],
        zoneCode: "Residential (R-1)", zoneDescription: "Airdrie residential — secondary suites permitted in designated districts",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — City of Airdrie",
    },
    {
        match: ["st. albert, ab", "st albert, ab", "st. albert, alberta", "st albert, alberta"],
        zoneCode: "Residential (R1)", zoneDescription: "St. Albert residential — secondary suite and garden suite permitted",
        maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit review — City of St. Albert",
    },
    {
        match: ["tacoma, wa", "tacoma, washington"],
        zoneCode: "R-2 / R-3", zoneDescription: "Tacoma residential — ADU/DADU permitted by right",
        maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Tacoma",
    },
    {
        match: ["everett, wa", "everett, washington"],
        zoneCode: "R-1 / R-2", zoneDescription: "Everett residential — ADU/DADU permitted under HB 1337",
        maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Everett",
    },
    {
        match: ["olympia, wa", "olympia, washington"],
        zoneCode: "R 4-8 / R 6-12", zoneDescription: "Olympia residential — ADU permitted by right",
        maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Olympia",
    },
    {
        match: ["beaverton, or", "beaverton, oregon"],
        zoneCode: "R5 / R7", zoneDescription: "Beaverton residential — ADU permitted by right under HB 2001",
        maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Beaverton",
    },
    {
        match: ["eugene, or", "eugene, oregon"],
        zoneCode: "R-1", zoneDescription: "Eugene residential — ADU permitted by right",
        maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Eugene",
    },
    {
        match: ["salem, or", "salem, oregon"],
        zoneCode: "RS", zoneDescription: "Salem single-family — ADU permitted by right",
        maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "5 ft", rearSetback: "5 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Salem",
    },
    {
        match: ["oakland, ca", "oakland, california"],
        zoneCode: "RD / RU", zoneDescription: "Oakland residential — ADU permitted under California state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — City of Oakland",
    },
    {
        match: ["berkeley, ca", "berkeley, california"],
        zoneCode: "R-1 / R-2", zoneDescription: "Berkeley residential — ADU permitted under state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — City of Berkeley",
    },
    {
        match: ["pasadena, ca", "pasadena, california"],
        zoneCode: "RS / RM", zoneDescription: "Pasadena residential — ADU permitted under state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit review — City of Pasadena",
    },
    {
        match: ["long beach, ca", "long beach, california"],
        zoneCode: "R-1-N", zoneDescription: "Long Beach residential — ADU permitted under state law",
        maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
        frontSetback: null, sideSetback: "4 ft", rearSetback: "4 ft",
        parkingRequired: null, overlayRisks: [],
        aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial permit review — City of Long Beach",
    },
];
const REGION_FALLBACKS = [
    {
        match: [", bc", ", british columbia"],
        result: {
            zoneCode: "Residential", zoneDescription: "BC residential — ADU permitted under Bill 44 (2023)",
            maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
            frontSetback: null, sideSetback: "Confirm with municipality", rearSetback: "Confirm with municipality",
            parkingRequired: null, overlayRisks: [],
            aduPermitted: true, reviewRisk: "Low", permitPath: "Standard development permit — BC municipality",
        },
    },
    {
        match: [", ab", ", alberta"],
        result: {
            zoneCode: "Residential", zoneDescription: "Alberta residential — secondary suite broadly permitted",
            maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
            frontSetback: null, sideSetback: "Confirm with municipality", rearSetback: "Confirm with municipality",
            parkingRequired: null, overlayRisks: [],
            aduPermitted: true, reviewRisk: "Low", permitPath: "Development permit — Alberta municipality",
        },
    },
    {
        match: [", on", ", ontario"],
        result: {
            zoneCode: "Residential", zoneDescription: "Ontario residential — ADU permitted under More Homes Built Faster Act",
            maxAduSqFt: 968, maxStories: 2, maxHeightFt: null,
            frontSetback: null, sideSetback: "Confirm with municipality", rearSetback: "Confirm with municipality",
            parkingRequired: null, overlayRisks: [],
            aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Ontario municipality",
        },
    },
    {
        match: [", ca", ", california"],
        result: {
            zoneCode: "Residential", zoneDescription: "California residential — ADU permitted by state law",
            maxAduSqFt: 1200, maxStories: 2, maxHeightFt: null,
            frontSetback: null, sideSetback: "4 ft minimum (state law)", rearSetback: "4 ft minimum (state law)",
            parkingRequired: null, overlayRisks: [],
            aduPermitted: true, reviewRisk: "Low", permitPath: "Ministerial ADU permit — California jurisdiction",
        },
    },
    {
        match: [", wa", ", washington"],
        result: {
            zoneCode: "Residential", zoneDescription: "Washington State — ADU permitted under HB 1337",
            maxAduSqFt: 1000, maxStories: 2, maxHeightFt: null,
            frontSetback: null, sideSetback: "5 ft typical", rearSetback: "5 ft typical",
            parkingRequired: null, overlayRisks: [],
            aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Washington municipality",
        },
    },
    {
        match: [", or", ", oregon"],
        result: {
            zoneCode: "Residential", zoneDescription: "Oregon — ADU permitted under HB 2001",
            maxAduSqFt: 800, maxStories: 2, maxHeightFt: null,
            frontSetback: null, sideSetback: "5 ft typical", rearSetback: "5 ft typical",
            parkingRequired: null, overlayRisks: [],
            aduPermitted: true, reviewRisk: "Low", permitPath: "Building permit — Oregon municipality",
        },
    },
];
// ── Helpers ───────────────────────────────────────────────────────────────
function normalizeAddress(value) {
    return value.toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
}
/**
 * Token-boundary match: returns true only when every token of `fragment`
 * appears as a contiguous run of whole tokens inside `address`.
 *
 * This replaces a naive `String.includes` test which produced false
 * positives (e.g. the fragment "bc" matched the substring inside
 * "abcdef"). Matching on whole-token boundaries prevents that (BUG-07).
 */
function matchesFragment(normalizedAddress, fragment) {
    const fragTokens = normalizeAddress(fragment).split(" ").filter(Boolean);
    if (fragTokens.length === 0)
        return false;
    const addrTokens = normalizedAddress.split(" ").filter(Boolean);
    if (fragTokens.length > addrTokens.length)
        return false;
    for (let i = 0; i + fragTokens.length <= addrTokens.length; i += 1) {
        let allMatch = true;
        for (let j = 0; j < fragTokens.length; j += 1) {
            if (addrTokens[i + j] !== fragTokens[j]) {
                allMatch = false;
                break;
            }
        }
        if (allMatch)
            return true;
    }
    return false;
}
/** Convert reviewRisk to a 0–1 confidence score for municipal fallback results. */
function confidenceFromRisk(risk) {
    if (risk === "Low")
        return 0.70;
    if (risk === "Medium")
        return 0.50;
    return 0.30;
}
/** Derive a human-readable jurisdiction from the first match fragment. */
function jurisdictionFromMatch(fragment) {
    return fragment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
        // Two-letter province/state codes are upper-cased (e.g. "bc" -> "BC").
        if (/^[a-z]{2}$/.test(part))
            return part.toUpperCase();
        // Everything else is title-cased word-by-word (e.g. "north york" -> "North York").
        return part
            .split(" ")
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(" ");
    })
        .join(", ");
}
// ── Municipal fallback lookup ─────────────────────────────────────────────
function lookupZoningMock(address) {
    const normalized = normalizeAddress(address);
    const checkedAt = new Date().toISOString();
    for (const rule of MUNICIPAL_RULES) {
        for (const fragment of rule.match) {
            if (matchesFragment(normalized, fragment)) {
                const { match: _match, reviewRisk, permitPath, ...fields } = rule;
                return {
                    source: "municipal_fallback",
                    jurisdiction: jurisdictionFromMatch(fragment),
                    confidence: confidenceFromRisk(reviewRisk),
                    checkedAt,
                    rawData: null,
                    reviewRisk,
                    permitPath,
                    ...fields,
                };
            }
        }
    }
    for (const region of REGION_FALLBACKS) {
        for (const fragment of region.match) {
            if (matchesFragment(normalized, fragment)) {
                const { reviewRisk, permitPath, ...fields } = region.result;
                return {
                    source: "municipal_fallback",
                    jurisdiction: jurisdictionFromMatch(fragment),
                    confidence: confidenceFromRisk(reviewRisk),
                    checkedAt,
                    rawData: null,
                    reviewRisk,
                    permitPath,
                    ...fields,
                };
            }
        }
    }
    return null;
}
// ── Main export ───────────────────────────────────────────────────────────
async function lookupZoning(address) {
    const apiKey = process.env.ZONEOMICS_API_KEY;
    try {
        const municipalMatch = await (0, municipalZoningProviders_1.lookupMunicipalOpenData)(address);
        if (municipalMatch)
            return mergeMunicipalOpenData(address, municipalMatch);
    }
    catch {
        // Continue to the optional commercial provider or curated fallback.
    }
    if (apiKey)
        try {
            const encoded = encodeURIComponent(address);
            const response = await fetch(`https://app.zoneomics.com/api/v2/properties/?address=${encoded}`, {
                headers: {
                    Authorization: `Token ${apiKey}`,
                    Accept: "application/json",
                },
                signal: AbortSignal.timeout(6000),
            });
            if (!response.ok) {
                return lookupZoningMock(address);
            }
            const data = (await response.json());
            return parseZoneomicsResponse(address, data) ?? lookupZoningMock(address);
        }
        catch {
            // Continue to the curated fallback.
        }
    return lookupZoningMock(address);
}
function mergeMunicipalOpenData(address, match) {
    const fallback = lookupZoningMock(address);
    const residential = /residential|small scale|housing|rowhouse|r[- ]?[a-z0-9]/i.test(`${match.zoneCode} ${match.zoneDescription}`);
    const overlayRisks = [...(fallback?.overlayRisks ?? [])];
    if (!residential)
        overlayRisks.push("Confirm ADU eligibility for this zoning district");
    return {
        source: "municipal_open_data",
        jurisdiction: match.jurisdiction,
        zoneCode: match.zoneCode,
        zoneDescription: match.zoneDescription,
        aduPermitted: residential ? fallback?.aduPermitted ?? null : null,
        maxAduSqFt: fallback?.maxAduSqFt ?? null,
        maxStories: fallback?.maxStories ?? null,
        maxHeightFt: fallback?.maxHeightFt ?? null,
        frontSetback: fallback?.frontSetback ?? null,
        sideSetback: fallback?.sideSetback ?? null,
        rearSetback: fallback?.rearSetback ?? null,
        parkingRequired: fallback?.parkingRequired ?? null,
        overlayRisks,
        confidence: residential ? 0.78 : 0.68,
        checkedAt: new Date().toISOString(),
        sourceUrl: match.sourceUrl,
        dataUpdatedAt: match.dataUpdatedAt,
        rawData: {
            provider: match.provider,
            geocodedAddress: match.geocodedAddress,
            zoningRecord: match.rawData,
            ruleBasis: "Municipal zoning polygon plus curated city-level ADU assumptions",
        },
        reviewRisk: residential ? fallback?.reviewRisk ?? "Medium" : "Medium",
        permitPath: fallback?.permitPath ?? `Municipal zoning review - ${match.jurisdiction}`,
    };
}
// ── Zoneomics response parser ─────────────────────────────────────────────
function parseZoneomicsResponse(address, data) {
    // Zoneomics returns a `properties` array or a single property object
    const property = Array.isArray(data.properties)
        ? data.properties[0]
        : data;
    if (!property)
        return null;
    const zoneCode = (property.zoning ?? property.zone_code ?? "");
    const desc = (property.zone_description ?? property.zoning_description ?? zoneCode);
    const rawSetbacks = property.setbacks;
    const landUse = (property.land_use ?? property.use_description ?? "").toLowerCase();
    // ADU / residential indicator
    const isResidential = /residential|single.?family|r-|rs-|rf-|rs1|rl|rm/.test((zoneCode + desc + landUse).toLowerCase());
    // Extract setbacks
    const frontSetback = rawSetbacks?.front ? `${rawSetbacks.front} ft` : null;
    const sideSetback = rawSetbacks?.side ? `${rawSetbacks.side} ft` : null;
    const rearSetback = rawSetbacks?.rear ? `${rawSetbacks.rear} ft` : null;
    // Max ADU size — Zoneomics may return max_adu_sqft or we infer from lot coverage
    const maxAduSqFt = property.max_adu_sqft
        ? Number(property.max_adu_sqft)
        : inferMaxAduSize(property);
    // Stories
    const maxStories = property.max_stories
        ? Number(property.max_stories)
        : property.max_height
            ? Math.max(1, Math.floor(Number(property.max_height) / 10))
            : null;
    // Height
    const maxHeightFt = property.max_height ? Number(property.max_height) : null;
    // Lot area
    const lotAreaSqFt = property.lot_area_sqft ? Number(property.lot_area_sqft) : undefined;
    // Parcel ID
    const parcelId = property.parcel_id
        ? String(property.parcel_id)
        : property.apn
            ? String(property.apn)
            : undefined;
    // Jurisdiction
    const jurisdiction = (property.jurisdiction ?? property.city ?? property.municipality ?? address);
    // Overlay risks + review risk
    const { reviewRisk, overlayRisks } = deriveReviewRisk(zoneCode, desc, property);
    const permitPath = reviewRisk === "High"
        ? "Enhanced site review"
        : reviewRisk === "Medium"
            ? "Municipal plus design review"
            : "Standard ADU review";
    return {
        source: "zoneomics",
        jurisdiction: String(jurisdiction),
        zoneCode,
        zoneDescription: desc,
        parcelId,
        lotAreaSqFt,
        aduPermitted: isResidential,
        maxAduSqFt,
        maxStories,
        maxHeightFt,
        frontSetback,
        sideSetback,
        rearSetback,
        parkingRequired: null,
        overlayRisks,
        confidence: 0.85,
        checkedAt: new Date().toISOString(),
        rawData: property,
        reviewRisk,
        permitPath,
    };
}
function inferMaxAduSize(property) {
    // Some responses include lot area — typical ADU allowance is ~15% of lot or 1000 sqft cap
    const lotArea = property.lot_area_sqft ? Number(property.lot_area_sqft) : null;
    if (lotArea && lotArea > 0) {
        return Math.min(1000, Math.round(lotArea * 0.15));
    }
    return null;
}
function deriveReviewRisk(zone, desc, property) {
    const combined = (zone + desc + JSON.stringify(property)).toLowerCase();
    const overlayRisks = [];
    if (combined.includes("flood"))
        overlayRisks.push("flood zone");
    if (combined.includes("hazard"))
        overlayRisks.push("hazard overlay");
    if (combined.includes("heritage"))
        overlayRisks.push("heritage designation");
    if (combined.includes("sensitive"))
        overlayRisks.push("sensitive area");
    if (combined.includes("overlay") && overlayRisks.length === 0)
        overlayRisks.push("overlay zone");
    if (overlayRisks.length > 0) {
        return { reviewRisk: "High", overlayRisks };
    }
    if (combined.includes("design review") ||
        combined.includes("hoa") ||
        combined.includes("corner") ||
        combined.includes("historic")) {
        return { reviewRisk: "Medium", overlayRisks };
    }
    return { reviewRisk: "Low", overlayRisks };
}
