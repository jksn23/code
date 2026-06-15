# IMPLEMENTATION GUIDE - REVISION UPDATE E-LELANG AHP-SAW

## Project Context

Project Name:

**Sistem Pendukung Keputusan Penentuan Nilai Limit Aset pada E-Lelang Menggunakan Hybrid MCDM AHP-SAW**

Current Architecture:

* Backend: Laravel
* Frontend: React / NextJS
* Database: MySQL/PostgreSQL
* SPK Method:

  * AHP (Predefined Weighting)
  * SAW (Online Scoring)

---

# OBJECTIVE OF THIS REVISION

Implement new business requirements from stakeholders:

1. Revision of Property Valuation Model
2. Additional Asset Attributes by Category
3. Removal of Vehicle Performance Criterion
4. Quick Bid Feature
5. Database Normalization per Asset Category
6. Update SPK Logic

---

# REVISION 1 - PROPERTY CATEGORY (LAND & BUILDING)

## Existing Problem

NJOP per m² currently treated as SPK criterion.

This is incorrect.

NJOP is objective valuation data and should not participate in SAW normalization.

---

## New Rule

### Formula

```text
Base Property Value =
NJOP_per_m2 × Area
```

Where:

Area =

* land_area
  OR
* building_area
  OR
* land_area + building_area (based on business rule)

````

---

## Remove From SPK Criteria

Delete:

```text
NJOP/m²
````

from:

```text
property_criteria
```

---

## Property SPK Criteria

Keep only:

```text
Location & Accessibility
Legal Status
Physical Condition
Nearby Facilities
Environment & Risk
Development Potential
```

---

# REVISION 2 - PROPERTY ASSET DETAIL

Create category-specific fields.

## Required Fields

### Documents

```text
property_photo
certificate_file_pdf
```

### Property Information

```text
certificate_number
land_area
building_area
village
district
city
province
owner_name
```

---

## Validation

### Land Asset

```text
land_area required
building_area optional
```

### Building Asset

```text
building_area required
```

---

# REVISION 3 - VEHICLE CATEGORY

## New Documents

```text
vehicle_photo
vehicle_bpkb
vehicle_stnk
```

---

## New Fields

```text
brand
type
year
color
chassis_number
engine_number
plate_number
```

---

## Vehicle Limit Value

Field:

```text
limit_value
```

must be stored after SAW calculation.

---

# REVISION 4 - REMOVE VEHICLE PERFORMANCE CRITERION

## Existing Criteria

```text
Engine Condition
Performance
Mileage
Year
History
Brand
Physical Condition
```

---

## New Criteria

```text
Engine Condition
Mileage
Year
History
Brand
Physical Condition
```

---

## Update AHP Weights

Recommended Weight:

```text
Engine Condition     = 0.30
Mileage              = 0.20
Year                 = 0.15
History              = 0.12
Brand                = 0.12
Physical Condition   = 0.11
```

Total:

```text
1.00
```

---

# REVISION 5 - ELECTRONIC CATEGORY

## Documents

```text
item_photo
```

---

## Fields

```text
brand
series
type
```

---

## Optional Future Fields

```text
serial_number
purchase_year
```

DO NOT make mandatory.

---

# DATABASE REFACTORING

## Current Issue

Asset table contains mixed fields.

---

## Solution

Create category-specific tables.

### assets

```sql
id
seller_id
category_id
asset_name
asset_description
limit_value
status
created_at
updated_at
```

---

### asset_properties

```sql
id
asset_id

certificate_number
owner_name

land_area
building_area

village
district
city
province

njop_per_m2
base_property_value

certificate_file
property_photo
```

---

### asset_vehicles

```sql
id
asset_id

brand
type
year
color

plate_number
engine_number
chassis_number

vehicle_photo
bpkb_file
stnk_file
```

---

### asset_electronics

```sql
id
asset_id

brand
series
type

item_photo
```

---

# QUICK BID FEATURE

## Purpose

Allow buyers to preconfigure bid amounts before auction starts.

---

## User Flow

Buyer opens:

```text
Quick Bid Menu
```

Input:

```text
Quick Bid 1
Quick Bid 2
Quick Bid 3
```

Example:

```text
105000000
110000000
115000000
```

Store in database.

---

## Database Table

### quick_bids

```sql
id
buyer_id
auction_id

quick_bid_1
quick_bid_2
quick_bid_3

created_at
updated_at
```

---

## During Auction

Show buttons:

```text
[Quick Bid 1]
[Quick Bid 2]
[Quick Bid 3]
```

When clicked:

```text
Automatically submit bid.
```

---

# SELLER FLOW UPDATE

## Vehicle

Seller uploads:

```text
Photo
BPKB
STNK
```

Fill:

```text
Brand
Type
Year
Color
Plate Number
Engine Number
Chassis Number
```

---

## Electronic

Seller uploads:

```text
Photo
```

Fill:

```text
Brand
Series
Type
```

---

## Property

Seller uploads:

```text
Property Photo
Certificate PDF
```

Fill:

```text
Certificate Number
Owner Name
Land Area
Building Area
Village
District
City
Province
NJOP per m²
```

---

# ADMIN FLOW UPDATE

Admin must verify:

## Vehicle

```text
BPKB
STNK
Vehicle Identity
```

---

## Property

```text
Certificate
Owner Name
Location Data
```

---

## Electronic

```text
Photo
Category Data
```

---

# SPK UPDATE

## Property

Base Value:

```text
NJOP × Area
```

SPK calculates:

```text
Adjustment Factor
```

Final Limit:

```text
Limit Value =
Base Property Value × SAW Score
```

---

## Vehicle

Use:

```text
Engine Condition
Mileage
Year
History
Brand
Physical Condition
```

No Performance Criterion.

---

## Electronic

Keep existing SAW process.

---

# API REQUIREMENTS

Implement endpoints:

```text
POST /assets/property
POST /assets/vehicle
POST /assets/electronic

POST /quick-bids
GET /quick-bids

POST /verify-property
POST /verify-vehicle
POST /verify-electronic
```

---

# MIGRATION REQUIREMENTS

Create migrations:

```text
asset_properties
asset_vehicles
asset_electronics
quick_bids
```

Create foreign key:

```text
asset_id
```

linked to:

```text
assets.id
```

---

# TESTING CHECKLIST

## Property

* Upload certificate
* Calculate NJOP × Area
* Generate limit value

## Vehicle

* Upload BPKB
* Upload STNK
* Remove performance criterion
* Calculate SAW score

## Electronic

* Upload photo
* Save brand/series/type

## Quick Bid

* Save presets
* Execute quick bidding
* Update highest bid correctly

---

# SUCCESS CRITERIA

Implementation considered complete when:

* Category-specific asset forms work
* Database normalized
* NJOP removed from SAW criteria
* Quick Bid feature functional
* Vehicle criterion updated
* Existing auction flow remains operational
* Existing AHP-SAW calculations remain compatible
* No breaking changes on current production data

```
```
