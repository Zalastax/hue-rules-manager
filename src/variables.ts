import { model, v3 as hue } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";

export enum MotionRuleStatus {
  ARMED = 0,
  SHOULD_TRIGGER_SCENE = 1,
  SCENE_TRIGGERED = 2,
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

export enum ActivityStatus {
  NORMAL = 0,
  RELAX = 1,
  FOCUS = 2,
  DINNER = 3,
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

export async function createVariables(api: Api) {
  return {
    kitchen_status: await setupCLIPGenericStatusSensor(
      api,
      "kitchen status",
      MotionRuleStatus.ARMED
    ),
    hallway_status: await setupCLIPGenericStatusSensor(
      api,
      "hallway status",
      MotionRuleStatus.ARMED
    ),
    livingroom_status: await setupCLIPGenericStatusSensor(
      api,
      "livingroom status",
      MotionRuleStatus.ARMED
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
    brightness: await setupCLIPGenericStatusSensor(
      api,
      "brightness status",
      BrightnessLevel.NEUTRAL
    ),
  };
}
