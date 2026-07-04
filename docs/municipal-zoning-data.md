# Municipal Zoning Data

ADUflow can identify the live zoning district for addresses in the following builder-outreach markets without a Zoneomics key:

- Edmonton and Calgary, Alberta
- Vancouver, Surrey, and Courtenay, British Columbia
- Toronto, Ontario
- Seattle, Washington
- Portland, Oregon

Leduc, Alberta has a city-specific fallback profile because a suitable public parcel zoning API was not available during implementation. California outreach remains covered by state and major-city fallback rules; it cannot be represented accurately by one statewide zoning polygon source.

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
- Surrey: `https://services5.arcgis.com/YRpe0VKTJytZSSIB/arcgis/rest/services/Zoning%20%20Boundaries/FeatureServer/0`
- Courtenay: `https://services3.arcgis.com/PwS5hVLYsEN2U36s/arcgis/rest/services/Zoning/FeatureServer/0`
- Toronto: `https://gis.toronto.ca/arcgis/rest/services/cot_geospatial11/FeatureServer/3`
- Seattle: `https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Current_Land_Use_Zoning_Detail_2/FeatureServer/0`
- Portland: `https://www.portlandmaps.com/od/rest/services/COP_OpenData_ZoningCode/MapServer/16`

## Important boundary

The city APIs identify the zoning polygon containing the geocoded point. Setbacks, ADU size, parking, overlays, and parcel-specific constraints may require separate bylaws, overlays, survey data, and municipal review. ADUflow therefore labels every result as a first-pass feasibility screen and links to the official municipal source.

The free Nominatim geocoder is suitable for a low-volume pilot. Before high-volume public traffic, replace it with a contracted geocoder or a self-hosted geocoding service and preserve the same municipal adapter interface.
