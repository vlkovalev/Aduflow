# ADUflow Catalog Import Guide

Use the builder setup import tool when a builder already has model pricing or option pricing in a spreadsheet.

## Where To Import

1. Open `/builder/login`.
2. Select the builder profile.
3. Open `/builder/setup`.
4. Choose the `Import` tab.
5. Select `Models` or `Options`.
6. Download the CSV template, or prepare an Excel workbook with the same columns.
7. Fill the template from the builder's current price sheet.
8. Upload the CSV or XLSX file and click `Preview import`.
9. Fix any validation errors.
10. Click `Confirm import`.

The import updates the builder-specific catalog. Imported models and options flow into the customer configurator, proposal, and lender package.

## Model CSV Format

Required columns:

| Column | Required | Example | Notes |
| --- | --- | --- | --- |
| `model_name` | Yes | `Garden Suite 624` | Customer-facing model name. |
| `square_feet` | Yes | `624` | Whole number preferred. |
| `base_price` | Yes | `154000` | Do not include currency symbols if possible. |
| `model_code` | No | `garden-suite-624` | Stable URL/configurator code. Auto-generated if blank. |
| `is_active` | No | `true` | Accepts `true`, `yes`, `1`, or `active`. Blank defaults to active. |
| `sort_order` | No | `2` | Display order in the configurator. |

Sample:

```csv
model_name,model_code,square_feet,base_price,is_active,sort_order
Backyard Studio 312,backyard-studio-312,312,72000,true,1
Garden Suite 624,garden-suite-624,624,154000,true,2
```

## Option CSV Format

Required columns:

| Column | Required | Example | Notes |
| --- | --- | --- | --- |
| `option_category` | Yes | `foundation` | Must be `finish`, `foundation`, `utilities`, or `site`. |
| `option_name` | Yes | `Screw Piles` | Customer-facing option label. |
| `option_price` | Yes | `18000` | Use `0` for included/base options. |
| `option_value` | No | `screw-piles` | Stable option code. Auto-generated if blank. |
| `option_detail` | No | `Fast install foundation package` | Short explanation for customer and proposal. |
| `is_active` | No | `true` | Accepts `true`, `yes`, `1`, or `active`. Blank defaults to active. |
| `sort_order` | No | `1` | Display order inside the option group. |

Sample:

```csv
option_category,option_name,option_value,option_detail,option_price,is_active,sort_order
finish,Standard Finish,standard,Durable baseline finish package,0,true,1
foundation,Screw Piles,screw-piles,Fast install foundation package,18000,true,1
utilities,Full Utility Hookup,full-hookup,Water sewer and electrical tie-ins,32000,true,1
site,Tight Urban Access,tight-urban-access,Small crew and compact equipment allowance,9500,true,1
```

## Import Rules

- Preview does not save anything.
- Confirm import replaces existing rows with the same builder and same model code.
- Confirm import replaces existing options with the same builder, category, and option value.
- The importer supports quoted CSV cells.
- `.xlsx` Excel files are supported.
- For `.xlsx` files, ADUflow reads the first worksheet only.
- Legacy `.xls` files should be saved as `.xlsx` or CSV before upload.
- PDF plan sets are not imported yet. They should be converted into a model/options CSV first.

## Demo Talking Point

"You do not need to manually rebuild your catalog in ADUflow. For the pilot, give us your model price sheet and option allowances as Excel or CSV. ADUflow validates the rows, previews the import, and then pushes that catalog into the configurator, proposals, and lender package."
