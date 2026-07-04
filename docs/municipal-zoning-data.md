# Municipal Zoning Data

ADUflow can identify the live zoning district for addresses in Edmonton, Calgary, and Vancouver without a Zoneomics key.

## Lookup order

1. Geocode a Canadian address through OpenStreetMap Nominatim.
2. Query the matching municipality's official zoning polygon API.
3. Combine the official zone code with ADUflow's curated city-level ADU assumptions.
4. Use Zoneomics when configured and no municipal adapter returned a result.
5. Use the clearly labelled municipal fallback when neither live source returns a result.

## Official sources

- Edmonton: `https://data.edmonton.ca/resource/fixa-tstc.json`
- Calgary: `https://data.calgary.ca/resource/qe6k-p9nh.json`
- Vancouver: `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/zoning-districts-and-labels/records`

## Important boundary

The city APIs identify the zoning polygon containing the geocoded point. Setbacks, ADU size, parking, overlays, and parcel-specific constraints may require separate bylaws, overlays, survey data, and municipal review. ADUflow therefore labels every result as a first-pass feasibility screen and links to the official municipal source.

The free Nominatim geocoder is suitable for a low-volume pilot. Before high-volume public traffic, replace it with a contracted geocoder or a self-hosted geocoding service and preserve the same municipal adapter interface.
