import dotenv from "dotenv";
import { model, v3 as hue } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";

const LightState = require("node-hue-api").v3.lightStates.LightState;

declare type GroupState = model.GroupState;
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

interface MyGroups
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

interface MySensors
  extends Record<
    | "builtin_daylight"
    | "hallway_presence"
    | "hallway_light_level"
    | "kitchen_presence"
    | "kitchen_light_level"
    | "livingroom_presence"
    | "livingroom_light_level",
    model.Sensor
  > {}

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

const known_scenes = {
  kitchen_very_bright: "Dy4JnbnTdD9GOu7",
  kitchen_dimmed: "1Fhe-qar2rOf-6D",
  hallway_very_dimmed: "bmTK0pTtYUAJlGw",
  hallway_semi_bright: "JtPUJRpFv2LVJvq",
  livingroom_bright: "DqXCpluUaZh7Rnd",
  livingroom_osaka: "PhDFbG2LYtXnB2J",
};

async function getApi() {
  const username: string = process.env.HUE_USERNAME;
  const host: string = process.env.HUE_HOST;

  try {
    return await hue.api.createLocal(host).connect(username);
  } catch (error) {
    console.error(`Failed to connect. Exiting. Error: ${error}`);
    throw error;
  }
}

async function getRules(api: Api) {
  try {
    return await api.rules.getAll();
  } catch (error) {
    console.error(`Failed to fetch rules. Exiting. Error: ${error}`);
    throw error;
  }
}

async function clearRules(api: Api) {
  const rules = await getRules(api);
  const username: string = process.env.HUE_USERNAME;

  for (const rule of rules) {
    if (rule.owner === username) {
      console.log(`Deleting a Rule\n ${rule.toStringDetailed()}`);
      const success = await api.rules.deleteRule(rule);
      if (!success) {
        console.error(`Failed to delete rule: ${rule.toStringDetailed()}`);
        throw new Error("Rule deletion failure");
      }
    } else {
      console.log(rule.toStringDetailed());
    }
  }
}

async function clearClipSensors(api: Api) {
  const sensors = await api.sensors.getAll();
  const prefix: string = process.env.PREFIX;

  for (const sensor of sensors) {
    const uniqueid: string | null = sensor.getAttributeValue("uniqueid");
    if (
      sensor.getAttributeValue("manufacturername") === "hue-rules-manager" &&
      uniqueid &&
      uniqueid.startsWith(prefix)
    ) {
      console.log(`Deleting a CLIP Sensor\n${sensor.toStringDetailed()}`);
      const success = await api.sensors.deleteSensor(sensor);
      if (!success) {
        console.error(`Failed to delete sensor: ${sensor.toStringDetailed()}`);
        throw new Error("CLIP Sensor deletion failure");
      }
    }
  }
}

async function getSensors(api: Api): Promise<MySensors> {
  return {
    builtin_daylight: await api.sensors.getSensor("1"),
    kitchen_presence: await api.sensors.getSensor("28"),
    kitchen_light_level: await api.sensors.getSensor("29"),
    hallway_presence: await api.sensors.getSensor("16"),
    hallway_light_level: await api.sensors.getSensor("17"),
    livingroom_presence: await api.sensors.getSensor("34"),
    livingroom_light_level: await api.sensors.getSensor("35"),
  };
}

async function getGroups(api: Api): Promise<MyGroups> {
  return {
    "Group 0": (await api.groups.getGroup(0)) as LightGroup,
    "Living room": (await api.groups.getGroup(1)) as Room,
    Espresso: (await api.groups.getGroup(4)) as Room,
    Kök: (await api.groups.getGroup(6)) as Room,
    Hallway: (await api.groups.getGroup(7)) as Room,
    Bedroom: (await api.groups.getGroup(8)) as Room,
  };
}

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

function setupCLIPGenericStatusSensor(api: Api, name: string) {
  return setupSensor(api, hue.model.createCLIPGenericStatusSensor, (x) => {
    x.status = RuleStatus.ARMED;
    x.name = name;
  });
}

enum RuleStatus {
  ARMED = 0,
  SHOULD_TRIGGER_SCENE = 1,
  SCENE_TRIGGERED = 2,
  DIMMED = 3,
}

function motionSensorBaseRules(
  prefix: string,
  status_sensor: model.CLIPGenericStatus,
  presence: model.Sensor,
  light_level: model.Sensor,
  group: string | number | model.Group
) {
  const presence_on_rule = hue.model.createRule();
  presence_on_rule.name = `${prefix} - presence on`;
  presence_on_rule.recycle = true;

  presence_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.ARMED)
  );
  presence_on_rule.addCondition(
    hue.model.ruleConditions.sensor(light_level).when("dark").equals(true)
  );
  presence_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );
  presence_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").changed()
  );

  presence_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SHOULD_TRIGGER_SCENE })
  );

  const dark_on_rule = hue.model.createRule();
  dark_on_rule.name = `${prefix} - dark on`;
  dark_on_rule.recycle = true;

  dark_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.ARMED)
  );
  dark_on_rule.addCondition(
    hue.model.ruleConditions.sensor(light_level).when("dark").equals(true)
  );
  dark_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );
  dark_on_rule.addCondition(
    hue.model.ruleConditions.sensor(light_level).when("dark").changed()
  );

  dark_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SHOULD_TRIGGER_SCENE })
  );

  const dim_status_rule = hue.model.createRule();
  dim_status_rule.name = `${prefix} - dim status`;
  dim_status_rule.recycle = true;

  dim_status_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SCENE_TRIGGERED)
  );
  dim_status_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .changedDelayed("PT00:04:00" as any)
  );
  dim_status_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );

  dim_status_rule.addAction(
    hue.model.actions.group(group).withState({ bri_inc: "-128" })
  );
  dim_status_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.DIMMED })
  );

  const dim_presence_rule = hue.model.createRule();
  dim_presence_rule.name = `${prefix} - dim presence`;
  dim_presence_rule.recycle = true;

  dim_presence_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SCENE_TRIGGERED)
  );
  dim_presence_rule.addCondition(
    hue.model.ruleConditions
      .sensor(presence)
      .when("presence")
      .changedDelayed("PT00:04:00" as any)
  );
  dim_presence_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );

  dim_presence_rule.addAction(
    hue.model.actions.group(group).withState({ bri_inc: "-128" })
  );
  dim_presence_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.DIMMED })
  );

  const recover_rule = hue.model.createRule();
  recover_rule.name = `${prefix} - recover`;
  recover_rule.recycle = true;

  recover_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .greaterThan(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  recover_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").changed()
  );
  recover_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );

  recover_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SHOULD_TRIGGER_SCENE })
  );

  const off_rule = hue.model.createRule();
  off_rule.name = `${prefix} - off`;
  off_rule.recycle = true;

  off_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );
  off_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.DIMMED)
  );
  off_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .changedDelayed("PT00:00:30" as any)
  );
  off_rule.addAction(hue.model.actions.group(group).withState({ on: false }));
  off_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.ARMED })
  );

  const arm_rule = hue.model.createRule();
  arm_rule.name = `${prefix} - arm`;
  arm_rule.recycle = true;

  arm_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );
  arm_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.DIMMED)
  );
  arm_rule.addCondition(
    hue.model.ruleConditions.group(group).when().anyOn().equals(false)
  );

  arm_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.ARMED })
  );

  return [
    presence_on_rule,
    dark_on_rule,
    dim_status_rule,
    dim_presence_rule,
    recover_rule,
    off_rule,
    arm_rule,
  ];
}

async function setupKitchenSensorRules(
  api: Api,
  status_sensor: model.CLIPGenericStatus,
  groups: MyGroups,
  sensors: MySensors
) {
  const prefix = "Kitchen sensor";
  const rules = motionSensorBaseRules(
    prefix,
    status_sensor,
    sensors.kitchen_presence,
    sensors.kitchen_light_level,
    groups.Kök
  );

  const day_and_on_rule = hue.model.createRule();
  day_and_on_rule.name = `${prefix} - day and on`;
  day_and_on_rule.recycle = true;

  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(true)
  );

  day_and_on_rule.addAction(
    hue.model.actions
      .group(groups.Kök)
      .withState({ scene: known_scenes.kitchen_very_bright })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(day_and_on_rule);

  const night_and_on_rule = hue.model.createRule();
  night_and_on_rule.name = `${prefix} - night and on`;
  night_and_on_rule.recycle = true;

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );

  const timeCondition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.notIn,
    value: "T23:00:00/T08:00:00",
  });

  night_and_on_rule.addCondition(timeCondition);
  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  night_and_on_rule.addAction(
    hue.model.actions
      .group(groups.Kök)
      .withState({ scene: known_scenes.kitchen_dimmed })
  );
  night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_rule);

  const late_night_and_on_rule = hue.model.createRule();
  late_night_and_on_rule.name = `${prefix} - l8 night and on`;
  late_night_and_on_rule.recycle = true;

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );
  const oppositeTimeCondition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.in,
    value: "T23:00:00/T08:00:00",
  });

  late_night_and_on_rule.addCondition(oppositeTimeCondition);
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  late_night_and_on_rule.addAction(
    hue.model.actions.group(groups.Kök).withState({ scene: "PzTl0lm1Xn4nzHM" })
  );
  late_night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(late_night_and_on_rule);

  for (const rule of rules) {
    try {
      const createdRule = await api.rules.createRule(rule);
      console.log(`Created rule\n ${createdRule.toStringDetailed()}`);
    } catch (error) {
      console.error(`Failed to create rule. Exiting. Error: ${error}`);
      throw error;
    }
  }
}

async function setupHallwaySensorRules(
  api: Api,
  status_sensor: model.CLIPGenericStatus,
  groups: MyGroups,
  sensors: MySensors
) {
  const prefix = "Hall sensor";
  const rules = motionSensorBaseRules(
    prefix,
    status_sensor,
    sensors.hallway_presence,
    sensors.hallway_light_level,
    groups.Hallway
  );

  const day_and_on_rule = hue.model.createRule();
  day_and_on_rule.name = `${prefix} - day and on`;
  day_and_on_rule.recycle = true;

  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(true)
  );

  day_and_on_rule.addAction(
    hue.model.actions
      .group(groups.Hallway)
      .withState({ scene: known_scenes.hallway_semi_bright })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(day_and_on_rule);

  const night_and_on_rule = hue.model.createRule();
  night_and_on_rule.name = `${prefix} - night and on`;
  night_and_on_rule.recycle = true;

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );

  const timeCondition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.notIn,
    value: "T23:00:00/T08:00:00",
  });

  night_and_on_rule.addCondition(timeCondition);
  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  night_and_on_rule.addAction(
    hue.model.actions
      .group(groups.Hallway)
      .withState({ scene: known_scenes.hallway_semi_bright, bri_inc: "-20" })
  );
  night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_rule);

  const late_night_and_on_rule = hue.model.createRule();
  late_night_and_on_rule.name = `${prefix} - l8 night and on`;
  late_night_and_on_rule.recycle = true;

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );
  const oppositeTimeCondition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.in,
    value: "T23:00:00/T08:00:00",
  });

  late_night_and_on_rule.addCondition(oppositeTimeCondition);
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  late_night_and_on_rule.addAction(
    hue.model.actions
      .group(groups.Hallway)
      .withState({ scene: known_scenes.hallway_very_dimmed })
  );

  late_night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(late_night_and_on_rule);

  for (const rule of rules) {
    try {
      const createdRule = await api.rules.createRule(rule);
      console.log(`Created rule\n ${createdRule.toStringDetailed()}`);
    } catch (error) {
      console.error(`Failed to create rule. Exiting. Error: ${error}`);
      throw error;
    }
  }
}

async function setupLivingroomSensorRules(
  api: Api,
  status_sensor: model.CLIPGenericStatus,
  groups: MyGroups,
  sensors: MySensors
) {
  const prefix = "LivRo sensor";
  const rules = motionSensorBaseRules(
    prefix,
    status_sensor,
    sensors.livingroom_presence,
    sensors.livingroom_light_level,
    groups["Living room"]
  );

  const day_and_on_rule = hue.model.createRule();
  day_and_on_rule.name = `${prefix} - day and on`;
  day_and_on_rule.recycle = true;

  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(true)
  );

  day_and_on_rule.addAction(
    hue.model.actions
      .group(groups.Hallway)
      .withState({ scene: known_scenes.livingroom_bright })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(day_and_on_rule);

  const night_and_on_rule = hue.model.createRule();
  night_and_on_rule.name = `${prefix} - night and on`;
  night_and_on_rule.recycle = true;

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(RuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("status").changed()
  );

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  night_and_on_rule.addAction(
    hue.model.actions
      .group(groups["Living room"])
      .withState({ scene: known_scenes.livingroom_osaka })
  );
  night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: RuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_rule);

  for (const rule of rules) {
    try {
      const createdRule = await api.rules.createRule(rule);
      console.log(`Created rule\n ${createdRule.toStringDetailed()}`);
    } catch (error) {
      console.error(`Failed to create rule. Exiting. Error: ${error}`);
      throw error;
    }
  }
}

async function run() {
  const api = await getApi();

  await clearRules(api);
  await clearClipSensors(api);

  const known_groups = await getGroups(api);
  const known_sensors = await getSensors(api);

  const kitchen_status_sensor = await setupCLIPGenericStatusSensor(
    api,
    "kitchen sensor status"
  );
  const hallway_status_sensor = await setupCLIPGenericStatusSensor(
    api,
    "hallway sensor status"
  );

  const livingroom_status_sensor = await setupCLIPGenericStatusSensor(
    api,
    "livingroom sensor status"
  );

  await setupKitchenSensorRules(
    api,
    kitchen_status_sensor,
    known_groups,
    known_sensors
  );
  await setupHallwaySensorRules(
    api,
    hallway_status_sensor,
    known_groups,
    known_sensors
  );
  await setupLivingroomSensorRules(
    api,
    livingroom_status_sensor,
    known_groups,
    known_sensors
  );
}

dotenv.config();
run().catch((error) => {
  console.error(`Failure when running: ${error}`);
});