import { model } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";

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

export interface MyGroups
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

export interface MySensors
  extends Record<
    | "builtin_daylight"
    | "dimmer_switch"
    | "hallway_presence"
    | "hallway_light_level"
    | "kitchen_presence"
    | "kitchen_light_level"
    | "livingroom_presence"
    | "livingroom_light_level",
    model.Sensor
  > {}

export async function getSensors(api: Api): Promise<MySensors> {
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

export async function getGroups(api: Api): Promise<MyGroups> {
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
  // Needs to be 0 so that dimmin transition starts from the scene's level
  set_scene: 0,
  dimming: 3,
};

export const known_scenes = {
  kitchen_very_bright: "Dy4JnbnTdD9GOu7",
  kitchen_dimmed: "1Fhe-qar2rOf-6D",
  kitchen_nightlight: "PzTl0lm1Xn4nzHM",
  hallway_very_dimmed: "bmTK0pTtYUAJlGw",
  hallway_semi_bright: "JtPUJRpFv2LVJvq",
  livingroom_bright: "DqXCpluUaZh7Rnd",
  livingroom_osaka: "PhDFbG2LYtXnB2J",
  livingroom_relax: "MaGOnFXSzZjebjP",
};
