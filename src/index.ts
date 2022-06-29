import dotenv from "dotenv";
import { model } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";
import { activitiesRules, resetStatusesRules } from "./activities";
import {
  setupLateNightStatus,
  setupActivityCounting,
  setupBrightness,
} from "./dimmer_switch_rules";
import { getGroups, getSensors } from "./static_resources";
import { clearClipSensors, clearRules, clearScenes, getApi } from "./utility";
import { createVariables, SceneSetStatus } from "./variables";

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
  const variables = await createVariables(api, known_groups);

  await createRules(api, [
    ...activitiesRules(
      "kitchen",
      "PT00:15:00",
      known_groups.Kök,
      variables.kitchen_status,
      variables.kitchen_scene_set_in_this_period,
      variables.is_late_night_status,
      variables.activity,
      known_sensors.kitchen_presence,
      known_sensors.kitchen_light_level,
      known_sensors.builtin_daylight,
      variables.kitchen_tmp_scene
    ),
    ...activitiesRules(
      "hall",
      "PT00:01:00",
      known_groups.Hallway,
      variables.hallway_status,
      variables.hallway_scene_set_in_this_period,
      variables.is_late_night_status,
      variables.activity,
      known_sensors.hallway_presence,
      known_sensors.hallway_light_level,
      known_sensors.builtin_daylight,
      variables.hallway_tmp_scene
    ),
    ...activitiesRules(
      "LivRo",
      "PT01:00:00",
      known_groups["Living room"],
      variables.livingroom_status,
      variables.livingroom_scene_set_in_this_period,
      variables.is_late_night_status,
      variables.activity,
      known_sensors.livingroom_presence,
      known_sensors.livingroom_light_level,
      known_sensors.builtin_daylight,
      variables.livingroom_tmp_scene
    ),
  ]);

  await createRules(api, resetStatusesRules(known_groups, variables.activity));

  const schedule_all_rooms = [
    model.actions
      .sensor(variables.kitchen_scene_set_in_this_period)
      .withState({ status: SceneSetStatus.SCHEDULE_IMMEDIATELY }),
    model.actions
      .sensor(variables.hallway_scene_set_in_this_period)
      .withState({ status: SceneSetStatus.SCHEDULE_IMMEDIATELY }),
    model.actions
      .sensor(variables.livingroom_scene_set_in_this_period)
      .withState({ status: SceneSetStatus.SCHEDULE_IMMEDIATELY }),
  ];

  await createRules(
    api,
    setupLateNightStatus(
      variables.is_late_night_status,
      known_sensors,
      schedule_all_rooms
    )
  );

  await createRules(
    api,
    setupActivityCounting(known_sensors, variables.activity, schedule_all_rooms)
  );

  await createRules(
    api,
    setupBrightness(
      "LivRo bri",
      known_groups["Living room"],
      known_sensors.dimmer_switch
    )
  );
}

async function run() {
  const api = await getApi();

  console.log("clearRule");
  await clearRules(api);
  console.log("clearClipSensors");
  await clearClipSensors(api);
  console.log("clearScenes");
  await clearScenes(api);
  console.log("createRulesAndSensors");
  await createRulesAndSensors(api);
}

dotenv.config();
run().catch((error) => {
  console.error(`Failure when running: ${error}`);
  console.error(error.stack);
});
