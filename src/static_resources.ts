import { model } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";
import { ActivityStatus } from "./variables";

declare type Sensor = model.Sensor;
declare type Luminaire = model.Luminaire;
declare type Entertainment = model.Entertainment;
declare type Zone = model.Zone;
declare type Room = model.Room;
declare type LightGroup = model.LightGroup;
declare type Group = model.Group;
declare type Lightsource = model.Lightsource;
declare type AnyGroup =
  | Group
  | Entertainment
  | LightGroup
  | Lightsource
  | Luminaire
  | Room
  | Zone;

export interface KnownGroups
  extends Record<
    "Group 0" | "Living room" | "Espresso" | "Kök" | "Hallway" | "Bedroom",
    AnyGroup
  > {
  "Group 0": LightGroup;
  "Living room": Room;
  Espresso: Room;
  Kök: Room;
  Hallway: Room;
  Bedroom: Room;
}

export interface KnownSensors
  extends Record<
    | "builtin_daylight"
    | "dimmer_switch"
    | "hallway_presence"
    | "hallway_light_level"
    | "kitchen_presence"
    | "kitchen_light_level"
    | "livingroom_presence"
    | "livingroom_light_level",
    Sensor
  > {}

export async function getSensors(api: Api) {
  return {
    builtin_daylight: await api.sensors.getSensor("1"),
    dimmer_switch: await api.sensors.getSensor("105"),
    kitchen_presence: await api.sensors.getSensor("28"),
    kitchen_light_level: await api.sensors.getSensor("29"),
    hallway_presence: await api.sensors.getSensor("16"),
    hallway_light_level: await api.sensors.getSensor("17"),
    livingroom_presence: await api.sensors.getSensor("34"),
    livingroom_light_level: await api.sensors.getSensor("35"),
  };
}

export async function getGroups(api: Api): Promise<KnownGroups> {
  return {
    "Group 0": (await api.groups.getGroup(0)) as LightGroup,
    "Living room": (await api.groups.getGroup(1)) as Room,
    Espresso: (await api.groups.getGroup(4)) as Room,
    Kök: (await api.groups.getGroup(6)) as Room,
    Hallway: (await api.groups.getGroup(7)) as Room,
    Bedroom: (await api.groups.getGroup(8)) as Room,
  };
}

export const transitionTimes = {
  set_scene: 20,
  brightness: 10,
  brightness_stop: 4,
  dimming: 3,
};

export enum DayCycle {
  DAY,
  EARLY_NIGHT,
  LATE_NIGHT,
}

export const auto_scene_kitchen = "Ni1Y2PmYaZee0Qj";
export const auto_scene_hallway = "9JRAzsuqVfaJ74G";
export const auto_scene_living_room = "JRvMRXkQHK5rlir";

export const activity_scenes_living_room: Record<ActivityStatus, string> = {
  [ActivityStatus.NORMAL]: auto_scene_living_room,
  [ActivityStatus.RELAX]: "MaGOnFXSzZjebjP",
  [ActivityStatus.FOCUS]: "hg5LUQrfYb2gaOA",
  [ActivityStatus.DINNER]: "yAEtN0GZ3Ja0M8E",
  [ActivityStatus.TV]: "Ry56OFq4x2Z--Sv",
};
