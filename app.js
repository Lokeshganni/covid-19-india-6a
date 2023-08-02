const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db;

const initialiseDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at PORT 3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initialiseDbAndServer();

const snakeToPascalCase = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

// API 1 list of all states from state table

app.get("/states/", async (req, res) => {
  const API1Query = `
    SELECT * FROM state;`;
  const API1Res = await db.all(API1Query);
  res.send(API1Res.map((obj) => snakeToPascalCase(obj)));
});

//API 2 state based on stateId

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const API2Query = `
  SELECT * FROM state WHERE state_id=${stateId};`;
  const API2Res = await db.get(API2Query);
  res.send(snakeToPascalCase(API2Res));
});

//API 3 posting to district table

app.post("/districts/", async (req, res) => {
  const postObjDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = postObjDetails;
  API3Query = `
  INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const API3Res = await db.run(API3Query);
  const postApiDistrictId = API3Res.lastID;
  res.send("District Successfully Added");
});

const snakeCaseToPascalCaseForDistrict = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//API 4 get district from district table

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const API4Query = `
    SELECT * FROM district WHERE district_id=${districtId};`;
  const API4Res = await db.get(API4Query);
  res.send(snakeCaseToPascalCaseForDistrict(API4Res));
});

//API 5 delete district from district table

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const API5query = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(API5query);
  res.send("District Removed");
});

//API 6 update district table

app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const putObjDetails = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = putObjDetails;
  const API6Query = `
  UPDATE district
  SET 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE district_id=${districtId};`;
  await db.run(API6Query);
  res.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const api7Query = `
    SELECT sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive, sum(deaths) as totalDeaths
    FROM district WHERE state_id=${stateId};`;
  const api7Res = await db.get(api7Query);
  res.send(api7Res);
});

//api 8

app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const api8Query = `
    select state.state_name as stateName from district natural join state where district.district_id=${districtId};`;
  const api8Res = await db.get(api8Query);
  res.send(api8Res);
});

module.exports = app;
