# Sources & Provenance (WUSN Precision Agriculture)
Last updated: 2025-12-15

This document explains:
1) Which agronomic standards/references we align to (FAO/ICAR + public meteorology),
2) Where each formula/value is used in the code,
3) What is “measured”, what is “assumed/default”, and what is planned for calibration.

---

## 0) Ground truth vs defaults

### 0.1 Source-of-truth hierarchy (important)
**Primary source of truth for crop parameters = Database**
- Table: `CropParameters` (Prisma)
- Seed file: `backend/prisma/seed.ts`
- Used by:
  - Crop recommendation engine (`crop.service.ts`) through Prisma queries
  - Irrigation engine (DB-first; fallback only if DB crop row missing)

**Legacy/fallback (not source-of-truth)**
- `CROP_DATABASE` in `backend/src/utils/constants.ts`
- Used only as a fallback in irrigation service if DB crop row is missing.
- NOTE: Values may differ from DB seed because `CROP_DATABASE` contains older/experimental parameter sets.
Action plan: keep DB as canonical; either align `CROP_DATABASE` to DB or remove it after migration.

---

## 1) Project data flow (traceability)

### 1.1 MQTT → Backend → DB → REST → Mobile
- Sensors publish to MQTT topic: `wusn/sensor/1/data`
- Backend stores readings as `SensorReading`
- Mobile calls APIs:
  - `GET /api/crops/recommend/:nodeId` (crop recommendation)
  - `GET /api/gdd/:nodeId/status` (GDD tracking)
  - Irrigation decision endpoints (confirmed crop)

Code map:
- Crop API controller: `backend/src/controllers/crop.controller.ts`
- Crop MCDA scoring: `backend/src/services/crop/crop.service.ts`
- Sensor calibration conversion: `backend/src/services/sensor/calibration.service.ts`
- GDD service/controller: `backend/src/services/gdd/gdd.service.ts`, `backend/src/controllers/gdd.controller.ts`
- Irrigation decision service: `backend/src/services/irrigation/irrigation.service.ts`
- Weather forecast + ET0 estimation: `backend/src/services/weather/weather.sevice.ts`

---

## 2) Units used (mentor quick-check)

### 2.1 Temperature
- Soil temperature: °C
- Air temperature: °C
Storage:
- SensorReading fields (`soilTemperature`, `airTemperature`)

### 2.2 Humidity and pressure
- Air humidity: Relative Humidity (RH %)
- Air pressure: hPa (hectopascal)

### 2.3 Soil moisture
- Moisture is treated as Volumetric Water Content (VWC %) at the API/UI level.
Protocol assumption (prototype):
- MQTT moisture value: 0–1000 maps to 0.0–100.0% VWC
- VWC% = moisture / 10

Code:
- `backend/src/services/sensor/calibration.service.ts::convertToVWC()`

Future calibration path (hardware ADC 0–1023):
- Texture-specific calibration curves exist but are not active by default:
  - `convertRawADCToVWC()` and `CALIBRATION_CURVES`

---

## 3) Crop universe (UP scope)

Project restricts recommendations and validations to a fixed crop set for Lucknow/UP.

Typed crop universe:
- `backend/src/utils/constants.ts::VALID_CROPS`
Current count: 19 crops (documentation should consistently say 19 if kept unchanged).

DB universe:
- `CropParameters.validForUP = true` (this filter is applied in recommendation service).

---

## 4) Crop recommendation method (MCDA)

### 4.1 Method
We use MCDA (Multi-Criteria Decision Analysis) with a transparent weighted-sum scoring model.
Rationale:
- Multiple agronomic criteria matter simultaneously (moisture, temperature, season, soil texture, feasibility).

Implementation:
- `backend/src/services/crop/crop.service.ts`

Weights (sum = 100):
- MOISTURE: 30
- TEMPERATURE: 25
- SEASON: 20
- SOIL: 15
- GDD_FEASIBILITY: 10

How scores are created:
- Each criterion computes a bounded score.
- Total score = sum of criterion scores.
- Ranked descending.

Why some values look same:
- Season and soil texture can be identical across many crops for a given field/date, which is expected in MCDA.
The differentiators are dynamic sensor-driven criteria (moisture/temperature) and feasibility checks.

---

## 5) Soil water constants (FAO-aligned concepts)

Texture constants define reference points used in both scoring and irrigation:
- Field Capacity (FC): VWC% after drainage
- Wilting Point (PWP): VWC% below which plants cannot extract water
- Saturation: VWC% where pore space is fully water-filled

Code:
- `backend/src/utils/constants.ts::SOIL_WATER_CONSTANTS`

Mentor note:
- These are reference values (documented as FAO-aligned and adapted).
- Local calibration is future work (field calibration / lab soil test).

Evidence requirement:
- Attach the reference page(s) you used (FAO-56 / soil physics reference) into:
  - `docs/evidence/FAO56_SoilWaterConstants_p__.png` (fill page)

---

## 6) Irrigation scheduling (FAO-56 style water balance)

This module runs only for confirmed crop fields.

### 6.1 Key concepts implemented
- TAW (Total Available Water), RAW (Readily Available Water), MAD (Management Allowed Depletion)
- Depletion % and stress-level estimation
- Decision and urgency levels: NONE/LOW/MODERATE/HIGH/CRITICAL
- Rain-forecast adjustment (OpenWeatherMap)

Code:
- `backend/src/services/irrigation/irrigation.service.ts`

Water balance formulas implemented:
- TAW (mm) = ((FC − PWP) / 100) × rootDepthCm × 10
- RAW (mm) = MAD × TAW
- Depletion derived by comparing current VWC depth vs FC depth

Mentor note:
- FC/PWP from soil constants + rootDepth + MAD from crop parameters allow a standard irrigation “stress-aware” trigger.

### 6.2 Crop coefficient Kc usage
Kc is used in irrigation module only (not in crop recommendation).
Stage-based Kc:
- INITIAL: kc.ini
- DEVELOPMENT: linear interpolation ini → mid (based on cumulative GDD progress)
- MID_SEASON: kc.mid
- LATE_SEASON/HARVEST_READY: interpolation mid → end

Code:
- `irrigation.service.ts::getCurrentKc()`

Evidence requirement:
- Attach FAO Kc curve reference pages into:
  - `docs/evidence/FAO56_KcStages_p__.png`

### 6.3 Application rate assumption
Irrigation duration uses an assumed application rate:
- default: 5 mm/hour (prototype assumption)

Code:
- `irrigation.service.ts` sets `applicationRateMmPerHour = 5` when irrigation is recommended.
Mentor note:
- This will be made configurable per field/method (drip/sprinkler/flood) in future.

---

## 7) Weather forecast and rainfall adjustment (OpenWeatherMap)

We use OpenWeatherMap 5-day / 3-hour forecast with caching.

Code:
- `backend/src/services/weather/weather.sevice.ts`
- `OWM_BASE_URL = https://api.openweathermap.org/data/2.5/forecast`
- Cache TTL and forecast days:
  - `backend/src/utils/constants.ts::WEATHER_CONSTANTS`

Rain forecast logic:
- `isRainExpected(latitude, longitude, hoursAhead, thresholdMm)`
- sums precipitation for relevant days and compares to threshold (default 5 mm)

Where used:
- Irrigation urgency can be downgraded if rain is expected (except CRITICAL is preserved).

---

## 8) ET0 estimation (Hargreaves-based, simplified)

We estimate a simplified ET0 (mm/day) from forecast temperature.
Reason:
- Full FAO Penman–Monteith needs solar radiation, wind speed, etc., not always available in our sensor setup.
- Hargreaves is used as an approximation when limited data exists.

Code:
- `backend/src/services/weather/weather.sevice.ts::estimateDailyET()`

Implementation note:
- Uses a simplified temperature-based form without explicit extraterrestrial radiation (Ra).
- Provides a fallback default ET0 = 4.0 mm/day if forecast/ET computation fails.

Mentor note:
- This ET0 is used as a decision-support indicator.
- Future improvement: compute Ra from latitude + day-of-year to use the full Hargreaves-Samani form or adopt FAO Penman–Monteith when sensors/inputs are available.

Evidence requirement:
- Attach the Hargreaves reference used (paper/book/FAO mention) into:
  - `docs/evidence/Hargreaves_ET0_Reference_p__.png`

---

## 9) GDD (Growing Degree Days) calculation (USDA Method 2)

Purpose:
- Tracks thermal time accumulation for crop development
- Drives growth stage estimation
- Supports stage-based Kc for irrigation
- Provides feasibility signal in recommendation (separate criterion)

Code:
- `backend/src/services/gdd/gdd.service.ts`
- `backend/src/controllers/gdd.controller.ts`

Daily GDD method:
- USDA Method 2 with base temperature adjustment and ceiling.
Steps:
1) Adjust Tmin: Tmin_adj = max(Tmin, Tbase)
2) Adjust Tmax: Tmax_adj = min(max(Tmax, Tbase), Tupper)
3) GDD = max(0, ((Tmax_adj + Tmin_adj)/2) − Tbase)

Ceiling:
- Tupper = 30°C (constant `UPPER_TEMP_THRESHOLD`)

Temperature source:
- AIR temperature daily min/max aggregated from stored sensor readings:
  - `weather.repository.getDailyAverageAirTemp()`

Evidence requirement:
- Attach method description source into:
  - `docs/evidence/GDD_USDA_Method2_p__.png`

---

## 10) Seed data provenance (what to show mentors)

Canonical crop parameter values are stored in DB via:
- `backend/prisma/seed.ts`

For mentor review, prepare:
1) `docs/SOURCES.md` (this file)
2) `docs/evidence/` folder containing screenshots/pages from:
   - FAO-56 (Kc, soil water concepts)
   - ICAR / Indian crop season context (Rabi/Kharif/Zaid)
   - GDD Method 2 reference
   - Hargreaves/ET0 reference

Statement of authorship:
- Crop parameter values were manually curated from cited agronomic references and documented evidence.
- No generative AI was used to create agronomic numeric values.

---

## 11) Known limitations & roadmap (transparent disclosure)
- DB vs legacy `CROP_DATABASE` mismatch may exist; DB is canonical, legacy is deprecated.
- Soil moisture conversion assumes pre-scaled VWC; raw ADC calibration is future work.
- ET0 uses simplified Hargreaves without Ra; full Ra-based Hargreaves or Penman–Monteith is future work.
- Application rate is a prototype default; will be field-configurable.

