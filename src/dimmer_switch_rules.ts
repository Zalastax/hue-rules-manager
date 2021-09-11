import { model, v3 as hue } from "node-hue-api";
import { MyGroups, MySensors } from "./static_resources";
import {
  ActivityStatus,
  DimmingLevel,
  LateNightRuleStatus,
  MotionRuleStatus,
} from "./variables";

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

export function setupDimming(
  sensors: MySensors,
  dimming_sensor: model.CLIPGenericStatus,
  status_sensors: model.CLIPGenericStatus[]
) {
  const rules: model.Rule[] = [];
  const prefix = "dimming status";

  const neutral_down_rule = hue.model.createRule();
  neutral_down_rule.name = `${prefix} - neutral down`;
  neutral_down_rule.recycle = false;

  neutral_down_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED)
  );
  neutral_down_rule.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.NEUTRAL)
  );
  neutral_down_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  neutral_down_rule.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.DIMMED })
  );

  rules.push(neutral_down_rule);

  const dimmed_down = hue.model.createRule();
  dimmed_down.name = `${prefix} - dimmed down`;
  dimmed_down.recycle = false;

  dimmed_down.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED)
  );
  dimmed_down.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.DIMMED)
  );
  dimmed_down.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  dimmed_down.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.VERY_DIMMED })
  );

  rules.push(dimmed_down);

  const very_dimmed_up = hue.model.createRule();
  very_dimmed_up.name = `${prefix} - very dimmed up`;
  very_dimmed_up.recycle = false;

  very_dimmed_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED)
  );
  very_dimmed_up.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.VERY_DIMMED)
  );
  very_dimmed_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  very_dimmed_up.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.DIMMED })
  );

  rules.push(very_dimmed_up);

  const dimmed_up = hue.model.createRule();
  dimmed_up.name = `${prefix} - dimmed up`;
  dimmed_up.recycle = false;

  dimmed_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED)
  );
  dimmed_up.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.DIMMED)
  );
  dimmed_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  dimmed_up.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.NEUTRAL })
  );

  rules.push(dimmed_up);

  const neutral_up = hue.model.createRule();
  neutral_up.name = `${prefix} - neutral up`;
  neutral_up.recycle = false;

  neutral_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED)
  );
  neutral_up.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.NEUTRAL)
  );
  neutral_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  neutral_up.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.BRIGHT })
  );

  rules.push(neutral_up);

  const bright_up = hue.model.createRule();
  bright_up.name = `${prefix} - bright up`;
  bright_up.recycle = false;

  bright_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_SHORT_RELEASED)
  );
  bright_up.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.BRIGHT)
  );
  bright_up.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  bright_up.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.VERY_BRIGHT })
  );

  rules.push(bright_up);

  const very_bright_down = hue.model.createRule();
  very_bright_down.name = `${prefix} - vb down`;
  very_bright_down.recycle = false;

  very_bright_down.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED)
  );
  very_bright_down.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.VERY_BRIGHT)
  );
  very_bright_down.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  very_bright_down.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.BRIGHT })
  );

  rules.push(very_bright_down);

  const bright_down = hue.model.createRule();
  bright_down.name = `${prefix} - bright down`;
  bright_down.recycle = false;

  bright_down.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_SHORT_RELEASED)
  );
  bright_down.addCondition(
    hue.model.ruleConditions
      .sensor(dimming_sensor)
      .when("status")
      .equals(DimmingLevel.BRIGHT)
  );
  bright_down.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  bright_down.addAction(
    hue.model.actions
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.NEUTRAL })
  );

  rules.push(bright_down);

  let retrigger_count = 0;

  for (const status_sensor of status_sensors) {
    const retrigger_scene = hue.model.createRule();
    retrigger_scene.name = `${prefix} - retrigger ${retrigger_count}`;
    retrigger_scene.recycle = false;
    retrigger_count = retrigger_count + 1;

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(dimming_sensor)
        .when("lastupdated")
        .changed()
    );

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(status_sensor)
        .when("status")
        .equals(MotionRuleStatus.SCENE_TRIGGERED)
    );

    retrigger_scene.addAction(
      hue.model.actions
        .sensor(status_sensor)
        .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
    );

    rules.push(retrigger_scene);
  }

  return rules;
}

export function setupLateNightStatus(
  late_night_status_sensor: model.CLIPGenericStatus,
  sensors: MySensors,
  status_sensors: model.CLIPGenericStatus[]
) {
  const rules: model.Rule[] = [];
  const prefix = "late night status";
  const late_night_range = "T22:20:00/T08:00:00";

  const not_late_night_rule = hue.model.createRule();
  not_late_night_rule.name = `${prefix} - not l8 night`;
  not_late_night_rule.recycle = false;

  const notLateNightCondition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.notIn,
    value: late_night_range,
  });

  not_late_night_rule.addCondition(notLateNightCondition);

  not_late_night_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_sensor)
      .withState({ status: LateNightRuleStatus.NOT_LATE_NIGHT })
  );

  rules.push(not_late_night_rule);

  const late_night_rule = hue.model.createRule();
  late_night_rule.name = `${prefix} - l8 night`;
  late_night_rule.recycle = false;

  const lateNightCondition = new model.RuleCondition({
    address: "/config/localtime",
    operator: model.ruleConditionOperators.in,
    value: late_night_range,
  });

  late_night_rule.addCondition(lateNightCondition);

  late_night_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_sensor)
      .withState({ status: LateNightRuleStatus.IS_LATE_NIGHT })
  );

  rules.push(late_night_rule);

  const dimmer_switch_armed_rule = hue.model.createRule();
  dimmer_switch_armed_rule.name = `${prefix} - dimmer armed`;
  dimmer_switch_armed_rule.recycle = false;

  dimmer_switch_armed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status_sensor)
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
      .sensor(late_night_status_sensor)
      .withState({ status: LateNightRuleStatus.IS_LATE_NIGHT })
  );

  rules.push(dimmer_switch_armed_rule);

  const dimmer_switch_late_night_rule = hue.model.createRule();
  dimmer_switch_late_night_rule.name = `${prefix} - dimmer l8`;
  dimmer_switch_late_night_rule.recycle = false;

  dimmer_switch_late_night_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status_sensor)
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
      .sensor(late_night_status_sensor)
      .withState({ status: LateNightRuleStatus.NOT_LATE_NIGHT })
  );

  rules.push(dimmer_switch_late_night_rule);

  let retrigger_count = 0;

  for (const status_sensor of status_sensors) {
    const retrigger_scene = hue.model.createRule();
    retrigger_scene.name = `${prefix} - retrigger ${retrigger_count}`;
    retrigger_scene.recycle = false;
    retrigger_count = retrigger_count + 1;

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(late_night_status_sensor)
        .when("lastupdated")
        .changed()
    );

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(status_sensor)
        .when("status")
        .equals(MotionRuleStatus.SCENE_TRIGGERED)
    );

    retrigger_scene.addAction(
      hue.model.actions
        .sensor(status_sensor)
        .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
    );

    rules.push(retrigger_scene);
  }

  return rules;
}

export function setupActivity(
  sensors: MySensors,
  activity_sensor: model.CLIPGenericStatus,
  status_sensors: model.CLIPGenericStatus[]
) {
  const rules: model.Rule[] = [];
  const prefix = "activity";

  const from_normal_rule = hue.model.createRule();
  from_normal_rule.name = `${prefix} - from normal`;
  from_normal_rule.recycle = false;

  from_normal_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_sensor)
      .when("status")
      .equals(ActivityStatus.NORMAL)
  );
  from_normal_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.ON_BUTTON_SHORT_RELEASED)
  );
  from_normal_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  from_normal_rule.addAction(
    hue.model.actions
      .sensor(activity_sensor)
      .withState({ status: ActivityStatus.RELAX })
  );

  rules.push(from_normal_rule);

  const from_relax_rule = hue.model.createRule();
  from_relax_rule.name = `${prefix} - from relax`;
  from_relax_rule.recycle = false;

  from_relax_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_sensor)
      .when("status")
      .equals(ActivityStatus.RELAX)
  );
  from_relax_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .equals(DimmerAction.ON_BUTTON_SHORT_RELEASED)
  );
  from_relax_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.dimmer_switch)
      .when("buttonevent")
      .changed()
  );

  from_relax_rule.addAction(
    hue.model.actions
      .sensor(activity_sensor)
      .withState({ status: ActivityStatus.NORMAL })
  );

  rules.push(from_relax_rule);

  let retrigger_count = 0;

  for (const status_sensor of status_sensors) {
    const retrigger_scene = hue.model.createRule();
    retrigger_scene.name = `${prefix} - retrigger ${retrigger_count}`;
    retrigger_scene.recycle = false;
    retrigger_count = retrigger_count + 1;

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(activity_sensor)
        .when("lastupdated")
        .changed()
    );

    retrigger_scene.addCondition(
      hue.model.ruleConditions
        .sensor(status_sensor)
        .when("status")
        .equals(MotionRuleStatus.SCENE_TRIGGERED)
    );

    retrigger_scene.addAction(
      hue.model.actions
        .sensor(status_sensor)
        .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
    );

    rules.push(retrigger_scene);
  }

  return rules;
}

export function setupAllOff(
  groups: MyGroups,
  sensors: MySensors,
  dimming_sensor: model.CLIPGenericStatus,
  activity_sensor: model.CLIPGenericStatus
) {
  const rules: model.Rule[] = [];
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
      .sensor(dimming_sensor)
      .withState({ status: DimmingLevel.NEUTRAL })
  );
  off_long_time_rule.addAction(
    hue.model.actions
      .sensor(activity_sensor)
      .withState({ status: ActivityStatus.NORMAL })
  );

  rules.push(off_long_time_rule);

  return rules;
}
