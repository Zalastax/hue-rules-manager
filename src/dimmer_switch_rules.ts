import { model, v3 as hue } from "node-hue-api";
import { EnumType } from "typescript";
import { KnownGroups, KnownSensors, transitionTimes } from "./static_resources";
import {
  ActivityStatus,
  BrightnessLevel,
  LateNightRuleStatus,
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
  prefix: string,
  group: string | number | model.Group,
  dimmer: model.Sensor
) {
  const dim_up_press = hue.model.createRule();
  dim_up_press.name = `${prefix} - dim up press`;
  dim_up_press.recycle = false;

  dim_up_press.addCondition(
    hue.model.ruleConditions.sensor(dimmer).when("lastupdated").changed()
  );

  dim_up_press.addCondition(
    hue.model.ruleConditions
      .sensor(dimmer)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_INITIAL_PRESS)
  );

  dim_up_press.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: 51,
      transitiontime: transitionTimes.brightness,
    })
  );

  const dim_up_hold = hue.model.createRule();
  dim_up_hold.name = `${prefix} - dim up hold`;
  dim_up_hold.recycle = false;

  dim_up_hold.addCondition(
    hue.model.ruleConditions.sensor(dimmer).when("lastupdated").changed()
  );

  dim_up_hold.addCondition(
    hue.model.ruleConditions
      .sensor(dimmer)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_HOLD)
  );

  dim_up_hold.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: 51,
      transitiontime: transitionTimes.brightness,
    })
  );

  const dim_up_released = hue.model.createRule();
  dim_up_released.name = `${prefix} - dim up rel`;
  dim_up_released.recycle = false;

  dim_up_released.addCondition(
    hue.model.ruleConditions.sensor(dimmer).when("lastupdated").changed()
  );

  dim_up_released.addCondition(
    hue.model.ruleConditions
      .sensor(dimmer)
      .when("buttonevent")
      .equals(DimmerAction.DIM_UP_BUTTON_LONG_RELEASED)
  );

  dim_up_released.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: 0,
      transitiontime: transitionTimes.brightness_stop,
    })
  );

  const dim_down_press = hue.model.createRule();
  dim_down_press.name = `${prefix} - dim down press`;
  dim_down_press.recycle = false;

  dim_down_press.addCondition(
    hue.model.ruleConditions.sensor(dimmer).when("lastupdated").changed()
  );

  dim_down_press.addCondition(
    hue.model.ruleConditions
      .sensor(dimmer)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_INITIAL_PRESS)
  );

  dim_down_press.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: -51,
      transitiontime: transitionTimes.brightness,
    })
  );

  const dim_down_hold = hue.model.createRule();
  dim_down_hold.name = `${prefix} - dim down hold`;
  dim_down_hold.recycle = false;

  dim_down_hold.addCondition(
    hue.model.ruleConditions.sensor(dimmer).when("lastupdated").changed()
  );

  dim_down_hold.addCondition(
    hue.model.ruleConditions
      .sensor(dimmer)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_HOLD)
  );

  dim_down_hold.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: -51,
      transitiontime: transitionTimes.brightness,
    })
  );

  const dim_down_released = hue.model.createRule();
  dim_down_released.name = `${prefix} - dim down released`;
  dim_down_released.recycle = false;

  dim_down_released.addCondition(
    hue.model.ruleConditions.sensor(dimmer).when("lastupdated").changed()
  );

  dim_down_released.addCondition(
    hue.model.ruleConditions
      .sensor(dimmer)
      .when("buttonevent")
      .equals(DimmerAction.DIM_DOWN_BUTTON_LONG_RELEASED)
  );

  dim_down_released.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: 0,
      transitiontime: transitionTimes.brightness_stop,
    })
  );

  return [
    dim_up_press,
    dim_up_hold,
    dim_up_released,
    dim_down_press,
    dim_down_hold,
    dim_down_released,
  ];
}

// Changes late night status automatically or via dimmer
export function setupLateNightStatus(
  late_night_status_variable: CLIPGenericStatus,
  sensors: KnownSensors,
  trigger_extra_actions: BridgeActionPayload[]
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
      .equals(DimmerAction.ON_BUTTON_LONG_RELEASED)
  );

  dimmer_switch_armed_rule.addAction(
    hue.model.actions
      .sensor(late_night_status_variable)
      .withState({ status: LateNightRuleStatus.IS_LATE_NIGHT })
  );

  for (const extra_action of trigger_extra_actions) {
    dimmer_switch_armed_rule.addAction(extra_action);
  }

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
      .equals(DimmerAction.ON_BUTTON_LONG_RELEASED)
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

  for (const extra_action of trigger_extra_actions) {
    dimmer_switch_late_night_rule.addAction(extra_action);
  }

  return [
    late_night_rule,
    dimmer_switch_armed_rule,
    not_late_night_rule,
    dimmer_switch_late_night_rule,
  ];
}

type BridgeActionPayload = Parameters<model.Rule["addAction"]>[0];

function dimmerCounting<T extends EnumType>(
  prefix: string,
  sensor: Sensor,
  variable: CLIPGenericStatus,
  dimmer_action_count_up: DimmerAction,
  dimmer_action_count_down: DimmerAction,
  values: number[],
  trigger_extra_actions: BridgeActionPayload[]
) {
  const rules: Rule[] = [];

  for (let i = 0; i < values.length - 1; i++) {
    const next = i + 1;
    const value_i = values[i];
    const value_next = values[next];

    const up_rule = transitionOnClick(
      `${prefix} - up - ${value_i} -> ${value_next}`,
      sensor,
      variable,
      dimmer_action_count_up,
      value_i,
      value_next
    );

    for (const extra_action of trigger_extra_actions) {
      up_rule.addAction(extra_action);
    }

    const down_rule = transitionOnClick(
      `${prefix} - down - ${value_next} -> ${value_i}`,
      sensor,
      variable,
      dimmer_action_count_down,
      value_next,
      value_i
    );

    for (const extra_action of trigger_extra_actions) {
      down_rule.addAction(extra_action);
    }

    rules.push(up_rule, down_rule);
  }

  return rules;
}

export function setupActivityCounting(
  sensors: KnownSensors,
  activity_variable: CLIPGenericStatus,
  trigger_extra_actions: BridgeActionPayload[]
): Rule[] {
  const prefix = "activity";

  return [
    ...dimmerCounting(
      prefix,
      sensors.dimmer_switch,
      activity_variable,
      DimmerAction.ON_BUTTON_SHORT_RELEASED,
      DimmerAction.OFF_BUTTON_SHORT_RELEASED,
      [
        ActivityStatus.TV,
        ActivityStatus.RELAX,
        ActivityStatus.DINNER,
        ActivityStatus.NORMAL,
        ActivityStatus.FOCUS,
      ],
      trigger_extra_actions
    ),
  ];
}
