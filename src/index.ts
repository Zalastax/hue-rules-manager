import dotenv from "dotenv";
import { model } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";
import { activitiesRules } from "./activities";
import {
  setupLateNightStatus,
  setupAllOff,
  setupActivity,
  setupBrightness,
} from "./dimmer_switch_rules";
import { getGroups, getSensors } from "./static_resources";
import { clearClipSensors, clearRules, getApi } from "./utility";
import { createVariables } from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Rule = model.Rule;

async function createRules(api: Api, rules: Rule[]) {
  for (const rule of rules) {
    try {
      const createdRule = await api.rules.createRule(rule);
      console.log(`Created rule\n ${createdRule.toStringDetailed()}`);
    } catch (error) {
      console.error(
        `Failed to create rule\n ${rule.toStringDetailed()}. Exiting. Error: ${error}`
      );
      throw error;
    }
  }
}

async function createRulesAndSensors(api: Api) {
  const known_groups = await getGroups(api);
  const known_sensors = await getSensors(api);
  const variables = await createVariables(api);

  await createRules(api, [
    ...activitiesRules(
      "kitchen",
      "PT00:20:00",
      known_groups.Kök,
      variables.kitchen_status,
      variables.is_late_night_status,
      variables.brightness,
      variables.activity,
      known_sensors.kitchen_presence,
      known_sensors.kitchen_light_level,
      known_sensors.builtin_daylight
    ),
    ...activitiesRules(
      "hall",
      "PT00:01:30",
      known_groups.Hallway,
      variables.hallway_status,
      variables.is_late_night_status,
      variables.brightness,
      variables.activity,
      known_sensors.hallway_presence,
      known_sensors.hallway_light_level,
      known_sensors.builtin_daylight
    ),
    ...activitiesRules(
      "LivRo",
      "PT01:00:00",
      known_groups["Living room"],
      variables.livingroom_status,
      variables.is_late_night_status,
      variables.brightness,
      variables.activity,
      known_sensors.livingroom_presence,
      known_sensors.livingroom_light_level,
      known_sensors.builtin_daylight
    ),
  ]);

  const status_variables: CLIPGenericStatus[] = [
    variables.kitchen_status,
    variables.hallway_status,
    variables.livingroom_status,
  ];

  await createRules(
    api,
    setupLateNightStatus(
      variables.is_late_night_status,
      known_sensors,
      status_variables
    )
  );

  await createRules(
    api,
    setupAllOff(
      known_groups,
      known_sensors,
      variables.brightness,
      variables.activity
    )
  );

  await createRules(
    api,
    setupActivity(known_sensors, variables.activity, status_variables)
  );

  await createRules(
    api,
    setupBrightness(known_sensors, variables.brightness, status_variables)
  );
}

async function run() {
  const api = await getApi();

  await clearRules(api);
  await clearClipSensors(api);
  await createRulesAndSensors(api);
}

dotenv.config();
run().catch((error) => {
  console.error(`Failure when running: ${error}`);
});
