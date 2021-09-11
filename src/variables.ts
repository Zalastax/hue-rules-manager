import { model, v3 as hue } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";

export enum MotionRuleStatus {
  ARMED = 0,
  SHOULD_TRIGGER_SCENE = 1,
  SCENE_TRIGGERED = 2,
  DIMMED = 3,
}

export enum DimmingLevel {
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
      "kitchen sensor status",
      MotionRuleStatus.ARMED
    ),
    hallway_status: await setupCLIPGenericStatusSensor(
      api,
      "hallway sensor status",
      MotionRuleStatus.ARMED
    ),
    livingroom_status: await setupCLIPGenericStatusSensor(
      api,
      "livingroom sensor status",
      MotionRuleStatus.ARMED
    ),
    is_late_night_status: await setupCLIPGenericStatusSensor(
      api,
      "is_late_night sensor status",
      LateNightRuleStatus.NOT_LATE_NIGHT
    ),
    activity: await setupCLIPGenericStatusSensor(
      api,
      "activity sensor status",
      ActivityStatus.NORMAL
    ),
    dimming: await setupCLIPGenericStatusSensor(
      api,
      "dimming sensor status",
      DimmingLevel.NEUTRAL
    ),
  };
}