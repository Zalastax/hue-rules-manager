import dotenv from "dotenv";
import { model } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";
import { activitiesRules, onlyAutoRules } from "./activities";
import { motionSensorBaseRules } from "./motion_base_rules";
import {
  resetSceneSetRules,
  setupActivityCounting,
  setupBrightness,
} from "./other_rules";
import {
  activity_scenes_living_room,
  auto_scene_hallway,
  auto_scene_kitchen,
  auto_scene_living_room,
  getGroups,
  getSensors,
} from "./static_resources";
import { clearClipSensors, clearRules, clearScenes, getApi } from "./utility";
import { ActivityStatus, createVariables, SceneSetStatus } from "./variables";

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
    ...onlyAutoRules(
      "kitchen",
      variables.kitchen_status,
      variables.kitchen_scene_set_in_this_period,
      known_sensors.kitchen_presence,
      known_sensors.kitchen_light_level,
      known_groups.Kök,
      "PT00:15:00",
      variables.kitchen_tmp_scene,
      auto_scene_kitchen
    ),
    ...resetSceneSetRules(
      "kitchen",
      known_groups.Kök,
      "PT00:15:00",
      variables.kitchen_scene_set_in_this_period,
      []
    ),
    ...onlyAutoRules(
      "hall",
      variables.hallway_status,
      variables.hallway_scene_set_in_this_period,
      known_sensors.hallway_presence,
      known_sensors.hallway_light_level,
      known_groups.Hallway,
      "PT00:03:00",
      variables.hallway_tmp_scene,
      auto_scene_hallway
    ),
    ...resetSceneSetRules(
      "hall",
      known_groups.Hallway,
      "PT00:07:00",
      variables.hallway_scene_set_in_this_period,
      []
    ),
    ...activitiesRules(
      "LivRo",
      "PT01:00:00",
      known_groups["Living room"],
      variables.livingroom_status,
      variables.livingroom_scene_set_in_this_period,
      variables.activity,
      known_sensors.livingroom_presence,
      known_sensors.livingroom_light_level,
      variables.livingroom_tmp_scene,
      activity_scenes_living_room
    ),
    ...resetSceneSetRules(
      "LivRo",
      known_groups["Living room"],
      "PT00:30:00",
      variables.livingroom_scene_set_in_this_period,
      [
        model.actions
          .sensor(variables.activity)
          .withState({ status: ActivityStatus.NORMAL }),
      ]
    ),
  ]);

  const schedule_living_room = [
    model.actions
      .sensor(variables.livingroom_scene_set_in_this_period)
      .withState({ status: SceneSetStatus.NOT_SET }),
  ];

  await createRules(
    api,
    setupActivityCounting(
      known_sensors,
      variables.activity,
      schedule_living_room
    )
  );

  await createRules(
    api,
    setupBrightness(
      "LivRo bri",
      known_groups["Living room"],
      known_sensors.dimmer_switch
    )
  );

  console.log(`Livingroom status ID: ${variables.livingroom_status.id}`);
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
