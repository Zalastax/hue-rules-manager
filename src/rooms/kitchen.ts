import { model, v3 as hue } from "node-hue-api";
import { motionSensorBaseRules } from "../motion_base_rules";
import {
  MyGroups,
  MySensors,
  transitionTimes,
  known_scenes,
} from "../static_resources";
import { LateNightRuleStatus, MotionRuleStatus } from "../variables";

export function kitchenRules(
  status_sensor: model.CLIPGenericStatus,
  late_night_status_sensor: model.CLIPGenericStatus,
  groups: MyGroups,
  sensors: MySensors,
  dimming_sensor: model.CLIPGenericStatus
) {
  const prefix = "Kitchen sensor";
  const rules = motionSensorBaseRules(
    prefix,
    status_sensor,
    sensors.kitchen_presence,
    sensors.kitchen_light_level,
    groups.Kök,
    "PT00:20:00",
    dimming_sensor
  );

  const day_and_on_rule = hue.model.createRule();
  day_and_on_rule.name = `${prefix} - day and on`;
  day_and_on_rule.recycle = false;

  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("lastupdated").changed()
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(true)
  );

  day_and_on_rule.addAction(
    hue.model.actions.group(groups.Kök).withState({
      scene: known_scenes.kitchen_very_bright,
      transitiontime: transitionTimes.set_scene,
    })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(day_and_on_rule);

  const night_and_on_rule = hue.model.createRule();
  night_and_on_rule.name = `${prefix} - night and on`;
  night_and_on_rule.recycle = false;

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("lastupdated").changed()
  );

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status_sensor)
      .when("status")
      .equals(LateNightRuleStatus.NOT_LATE_NIGHT)
  );

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  night_and_on_rule.addAction(
    hue.model.actions.group(groups.Kök).withState({
      scene: known_scenes.kitchen_dimmed,
      transitiontime: transitionTimes.set_scene,
    })
  );
  night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_rule);

  const late_night_and_on_rule = hue.model.createRule();
  late_night_and_on_rule.name = `${prefix} - l8 night and on`;
  late_night_and_on_rule.recycle = false;

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("lastupdated").changed()
  );

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status_sensor)
      .when("status")
      .equals(LateNightRuleStatus.IS_LATE_NIGHT)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  late_night_and_on_rule.addAction(
    hue.model.actions.group(groups.Kök).withState({
      scene: known_scenes.kitchen_nightlight,
      transitiontime: transitionTimes.set_scene,
    })
  );
  late_night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(late_night_and_on_rule);

  return rules;
}
