import { model, v3 as hue } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";
import { KnownGroups } from "./static_resources";

export enum MotionRuleStatus {
  ARMED = 0,
  PLAN_GROUP_ON = 1,
  GROUP_ON = 2,
  DIMMED = 3,
}

export enum BrightnessLevel {
  VERY_DIMMED = 4,
  DIMMED = 3,
  NEUTRAL = 0,
  BRIGHT = 1,
  VERY_BRIGHT = 2,
}

export enum LateNightRuleStatus {
  NOT_LATE_NIGHT = 0,
  IS_LATE_NIGHT = 1,
}

export enum SceneSetStatus {
  NOT_SET = 0,
  SET = 1,
}

export enum ActivityStatus {
  FOCUS = 0,
  NORMAL = 1,
  DINNER = 2,
  RELAX = 3,
  TV = 4,
}

declare type CLIPSensor =
  | model.CLIPGenericFlag
  | model.CLIPGenericStatus
  | model.CLIPHumidity
  | model.CLIPLightlevel
  | model.CLIPOpenClose
  | model.CLIPPresence
  | model.CLIPTemperature
  | model.CLIPSwitch;

let sensor_id_index = 0;

function setupSensor<T extends CLIPSensor>(
  api: Api,
  createSensor: () => T,
  beforeRegister: (x: T) => void
): Promise<T> {
  const sensor = createSensor();

  const prefix: string = process.env.PREFIX;
  sensor.modelid = "software";
  sensor.swversion = "1.0";
  sensor.uniqueid = `${prefix}-${sensor_id_index}`;
  sensor_id_index = sensor_id_index + 1;
  sensor.manufacturername = "hue-rules-manager";
  beforeRegister(sensor);

  return api.sensors.createSensor(sensor) as Promise<T>;
}

export function setupCLIPGenericStatusSensor(
  api: Api,
  name: string,
  status: any
) {
  return setupSensor(api, hue.model.createCLIPGenericStatusSensor, (x) => {
    x.name = name;
    x.status = status;
  });
}

export function setupScene(api: Api, name: string, group: string) {
  console.log(`setupScene(..., ${name}, ${group})`);
  const scene = hue.model.createGroupScene();

  scene.name = name;
  scene.group = group;

  return api.scenes.createScene(scene);
}

export async function createVariables(api: Api, known_groups: KnownGroups) {
  return {
    kitchen_status: await setupCLIPGenericStatusSensor(
      api,
      "kitchen status",
      MotionRuleStatus.ARMED
    ),
    kitchen_scene_set_in_this_period: await setupCLIPGenericStatusSensor(
      api,
      "kitchen scene_set",
      SceneSetStatus.NOT_SET
    ),
    kitchen_tmp_scene: await setupScene(
      api,
      "Scene recoveryScene",
      `${known_groups.Kök.id}`
    ),
    hallway_status: await setupCLIPGenericStatusSensor(
      api,
      "hallway status",
      MotionRuleStatus.ARMED
    ),
    hallway_scene_set_in_this_period: await setupCLIPGenericStatusSensor(
      api,
      "hallway scene_set",
      SceneSetStatus.NOT_SET
    ),
    hallway_tmp_scene: await setupScene(
      api,
      "Scene recoveryScene",
      `${known_groups.Hallway.id}`
    ),
    livingroom_status: await setupCLIPGenericStatusSensor(
      api,
      "livingroom status",
      MotionRuleStatus.ARMED
    ),
    livingroom_scene_set_in_this_period: await setupCLIPGenericStatusSensor(
      api,
      "livingroom scene_set",
      SceneSetStatus.NOT_SET
    ),
    livingroom_tmp_scene: await setupScene(
      api,
      "Scene recoveryScene",
      `${known_groups["Living room"].id}`
    ),
    is_late_night_status: await setupCLIPGenericStatusSensor(
      api,
      "is_late_night status",
      LateNightRuleStatus.NOT_LATE_NIGHT
    ),
    activity: await setupCLIPGenericStatusSensor(
      api,
      "activity status",
      ActivityStatus.NORMAL
    ),
  };
}

// Time to turn off the lights expressed in unit 100 ms
// 2 minutes
export const DIMMING_TIME = 2 * 60 * 10;
export const DIMMING_TIME_TIMESTAMP = "PT00:02:00";
