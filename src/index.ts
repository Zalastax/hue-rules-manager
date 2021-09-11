import dotenv from "dotenv";
import { model } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";
import {
  setupLateNightStatus,
  setupAllOff,
  setupActivity,
  setupDimming,
} from "./dimmer_switch_rules";
import { setupHallwaySensorRules as hallwayRules } from "./rooms/hallway";
import { kitchenRules } from "./rooms/kitchen";
import { setupLivingroomSensorRules as livingroomRules } from "./rooms/livingroom";
import { getGroups, getSensors } from "./static_resources";
import { clearClipSensors, clearRules, getApi } from "./utility";
import { createVariables } from "./variables";

async function createRules(api: Api, rules: model.Rule[]) {
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

  await createRules(
    api,
    kitchenRules(
      variables.kitchen_status,
      variables.is_late_night_status,
      known_groups,
      known_sensors,
      variables.dimming
    )
  );
  await createRules(
    api,
    hallwayRules(
      variables.hallway_status,
      variables.is_late_night_status,
      known_groups,
      known_sensors,
      variables.dimming
    )
  );
  await createRules(
    api,
    livingroomRules(
      variables.livingroom_status,
      known_groups,
      known_sensors,
      variables.dimming,
      variables.activity
    )
  );

  const status_sensors: model.CLIPGenericStatus[] = [
    variables.kitchen_status,
    variables.hallway_status,
    variables.livingroom_status,
  ];

  await createRules(
    api,
    setupLateNightStatus(
      variables.is_late_night_status,
      known_sensors,
      status_sensors
    )
  );

  await createRules(
    api,
    setupAllOff(
      known_groups,
      known_sensors,
      variables.dimming,
      variables.activity
    )
  );

  await createRules(
    api,
    setupActivity(known_sensors, variables.activity, status_sensors)
  );

  await createRules(
    api,
    setupDimming(known_sensors, variables.dimming, status_sensors)
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
