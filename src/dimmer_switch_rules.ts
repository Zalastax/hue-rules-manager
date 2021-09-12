import { model, v3 as hue } from "node-hue-api";
import { EnumType } from "typescript";
import { KnownGroups, KnownSensors } from "./static_resources";
import {
  ActivityStatus,
  BrightnessLevel,
  LateNightRuleStatus,
  MotionRuleStatus,
} from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Rule = model.Rule;
declare type Sensor = model.Sensor;

enum DimmerAction {
  ON_BUTTON_INITIAL_PRESS = 1000,
  ON_BUTTON_HOLD = 1001,
  ON_BUTTON_SHORT_RELEASED = 1002,
  ON_BUTTON_LONG_RELEASED = 1003,
  DIM_UP_BUTTON_INITIAL_PRESS = 2000,
  DIM_UP_BUTTON_HOLD = 2001,
  DIM_UP_BUTTON_SHORT_RELEASED = 2002,
  DIM_UP_BUTTON_LONG_RELEASED = 2003,
  DIM_DOWN_BUTTON_INITIAL_PRESS = 3000,
  DIM_DOWN_BUTTON_HOLD = 3001,
  DIM_DOWN_BUTTON_SHORT_RELEASED = 3002,
  DIM_DOWN_BUTTON_LONG_RELEASED = 3003,
  OFF_BUTTON_INITIAL_PRESS = 4000,
  OFF_BUTTON_HOLD = 4001,
  OFF_BUTTON_SHORT_RELEASED = 4002,
  OFF_BUTTON_LONG_RELEASED = 4003,
}

function transitionOnClick(
  name: string,
  sensor: Sensor,
  variable: CLIPGenericStatus,
  dimmer_action: DimmerAction,
  from: number,
  to: number
) {
  const neutral_down_rule = hue.model.createRule();
  neutral_down_rule.name = name;
  neutral_down_rule.recycle = false;

  neutral_down_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensor)
      .when("buttonevent")
      .equals(dimmer_action)
  );
  neutral_down_rule.addCondition(
    hue.model.ruleConditions.sensor(variable).when("status").equals(from)
  );
  neutral_down_rule.addCondition(
    hue.model.ruleConditions.sensor(sensor).when("buttonevent").changed()
  );

  neutral_down_rule.addAction(
    hue.model.actions.sensor(variable).withState({ status: to })
  );

  return neutral_down_rule;
}

export function setupBrightness(
  sensors: KnownSensors,
  brightness_status: CLIPGenericStatus,
  status_variables: CLIPGenericStatus[]
) {
  const prefix = "brightness status";
  const rules: Rule[] = [
    transitionOnClick(
      `${prefix} - neutral down`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED,
      BrightnessLevel.NEUTRAL,
      BrightnessLevel.DIMMED
    ),
    transitionOnClick(
      `${prefix} - dimmed down`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED,
      BrightnessLevel.DIMMED,
      BrightnessLevel.VERY_DIMMED
    ),
    transitionOnClick(
      `${prefix} - v_dim down`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED,
      BrightnessLevel.VERY_DIMMED,
      BrightnessLevel.DIMMED
    ),
    transitionOnClick(
      `${prefix} - dimmed up`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED,
      BrightnessLevel.DIMMED,
      BrightnessLevel.NEUTRAL
    ),
    transitionOnClick(
      `${prefix} - neutral up`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED,
      BrightnessLevel.NEUTRAL,
      BrightnessLevel.BRIGHT
    ),
    transitionOnClick(
      `${prefix} - bright up`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED,
      BrightnessLevel.BRIGHT,
      BrightnessLevel.VERY_BRIGHT
    ),
    transitionOnClick(
      `${prefix} - vb down`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED,
      BrightnessLevel.VERY_BRIGHT,
      BrightnessLevel.BRIGHT
    ),
    transitionOnClick(
      `${prefix} - bright down`,
      sensors.dimmer_switch,
      brightness_status,
      DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED,
      BrightnessLevel.BRIGHT,
      BrightnessLevel.NEUTRAL
    ),
    ...retriggerScenes(prefix, brightness_status, status_variables),
  ];

  return rules;
}

export function setupLateNightStatus(
  late_night_status_variable: CLIPGenericStatus,
  sensors: KnownSensors,
  status_variables: CLIPGenericStatus[]
): Rule[] {
  const prefix = "late night status";
  const late_night_range = "T22:20:00/T08:00:00";

  const not_late_night_rule = hue.model.createRule();
  not_late_night_rule.name = `${prefix} - not l8 night`;
  not_late_night_rule.recycle = false;

  const not_late_night_condition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.notIn,
    value: late_night_range,
  });

  not_late_night_rule.addCondition(not_late_night_condition);

  not_late_night_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_variable)
      .withState({ status: LateNightRuleStatus.NOT_LATE_NIGHT })
  );

  const late_night_rule = hue.model.createRule();
  late_night_rule.name = `${prefix} - l8 night`;
  late_night_rule.recycle = false;

  const late_night_condition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.in,
    value: late_night_range,
  });

  late_night_rule.addCondition(late_night_condition);

  late_night_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_variable)
      .withState({ status: LateNightRuleStatus.IS_LATE_NIGHT })
  );

  const dimmer_switch_armed_rule = hue.model.createRule();
  dimmer_switch_armed_rule.name = `${prefix} - dimmer armed`;
  dimmer_switch_armed_rule.recycle = false;

  dimmer_switch_armed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status_variable)
      .when("status")
      .equals(LateNightRuleStatus.NOT_LATE_NIGHT)
  );
  dimmer_switch_armed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  dimmer_switch_armed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.OFF_BUTTON_SHORT_RELEASED)
  );

  dimmer_switch_armed_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_variable)
      .withState({ status: LateNightRuleStatus.IS_LATE_NIGHT })
  );

  const dimmer_switch_late_night_rule = hue.model.createRule();
  dimmer_switch_late_night_rule.name = `${prefix} - dimmer l8`;
  dimmer_switch_late_night_rule.recycle = false;

  dimmer_switch_late_night_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status_variable)
      .when("status")
      .equals(LateNightRuleStatus.IS_LATE_NIGHT)
  );

  dimmer_switch_late_night_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.OFF_BUTTON_SHORT_RELEASED)
  );
  dimmer_switch_late_night_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  dimmer_switch_late_night_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_variable)
      .withState({ status: LateNightRuleStatus.NOT_LATE_NIGHT })
  );

  return [
    late_night_rule,
    dimmer_switch_armed_rule,
    not_late_night_rule,
    dimmer_switch_late_night_rule,
    ...retriggerScenes(prefix, late_night_status_variable, status_variables),
  ];
}

function roundRobin<T extends EnumType>(
  prefix: string,
  sensor: Sensor,
  variable: CLIPGenericStatus,
  dimmer_action: DimmerAction,
  values: number[]
) {
  const rules: Rule[] = [];

  for (let i = 0; i < values.length; i++) {
    const next = (i + 1) % values.length;
    const value_i = values[i];
    const value_next = values[next];

    rules.push(
      transitionOnClick(
        `${prefix} - ${value_i} -> ${value_next}`,
        sensor,
        variable,
        dimmer_action,
        value_i,
        value_next
      )
    );
  }

  return rules;
}

export function setupActivity(
  sensors: KnownSensors,
  activity_variable: CLIPGenericStatus,
  status_variables: CLIPGenericStatus[]
): Rule[] {
  const prefix = "activity";

  return [
    ...roundRobin(
      prefix,
      sensors.dimmer_switch,
      activity_variable,
      DimmerAction.ON_BUTTON_SHORT_RELEASED,
      [
        ActivityStatus.NORMAL,
        ActivityStatus.RELAX,
        ActivityStatus.FOCUS,
        ActivityStatus.DINNER,
        ActivityStatus.TV,
      ]
    ),
    ...retriggerScenes(prefix, activity_variable, status_variables),
  ];
}

function retriggerScenes(
  prefix: string,
  variable: CLIPGenericStatus,
  status_variables: CLIPGenericStatus[]
) {
  let retrigger_count = 0;
  const rules: Rule[] = [];

  for (const status_variable of status_variables) {
    const retrigger_scene = hue.model.createRule();
    retrigger_scene.name = `${prefix} - retrigger ${retrigger_count}`;
    retrigger_scene.recycle = false;
    retrigger_count = retrigger_count + 1;

    retrigger_scene.addCondition(
      hue.model.ruleConditions.sensor(variable).when("lastupdated").changed()
    );

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(status_variable)
        .when("status")
        .equals(MotionRuleStatus.SCENE_TRIGGERED)
    );

    retrigger_scene.addAction(
      hue.model.actions
        .sensor(status_variable)
        .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
    );

    rules.push(retrigger_scene);
  }

  return rules;
}

export function setupAllOff(
  groups: KnownGroups,
  sensors: KnownSensors,
  brightness: CLIPGenericStatus,
  activity: CLIPGenericStatus
) {
  const rules: Rule[] = [];
  const prefix = "all off";

  const dimmer_switch_off_long_rule = hue.model.createRule();
  dimmer_switch_off_long_rule.name = `${prefix} - off press`;
  dimmer_switch_off_long_rule.recycle = false;

  dimmer_switch_off_long_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.OFF_BUTTON_LONG_RELEASED)
  );
  dimmer_switch_off_long_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  dimmer_switch_off_long_rule.addAction(
    hue.model.actions.group(groups["Group 0"]).withState({ on: false })
  );

  rules.push(dimmer_switch_off_long_rule);

  const off_long_time_rule = hue.model.createRule();
  off_long_time_rule.name = `${prefix} - off time`;
  off_long_time_rule.recycle = false;

  off_long_time_rule.addCondition(
    hue.model.ruleConditions
      .group(groups["Group 0"])
      .when()
      .anyOn()
      .equals(false)
  );
  off_long_time_rule.addCondition(
    hue.model.ruleConditions
      .group(groups["Group 0"])
      .when()
      .anyOn()
      .changedDelayed("PT00:05:30" as any)
  );

  off_long_time_rule.addAction(
    hue.model.actions
      .sensor(brightness)
      .withState({ status: BrightnessLevel.NEUTRAL })
  );
  off_long_time_rule.addAction(
    hue.model.actions
      .sensor(activity)
      .withState({ status: ActivityStatus.NORMAL })
  );

  rules.push(off_long_time_rule);

  return rules;
}
