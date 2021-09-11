import { model, v3 as hue } from "node-hue-api";
import { motionSensorBaseRules } from "../motion_base_rules";
import {
  MyGroups,
  MySensors,
  transitionTimes,
  known_scenes,
} from "../static_resources";
import { ActivityStatus, MotionRuleStatus } from "../variables";

export function setupLivingroomSensorRules(
  status_sensor: model.CLIPGenericStatus,
  groups: MyGroups,
  sensors: MySensors,
  dimming_sensor: model.CLIPGenericStatus,
  activity_sensor: model.CLIPGenericStatus
) {
  const prefix = "LivRo sensor";
  const rules = motionSensorBaseRules(
    prefix,
    status_sensor,
    sensors.livingroom_presence,
    sensors.livingroom_light_level,
    groups["Living room"],
    "PT01:00:00",
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
    hue.model.actions.group(groups["Living room"]).withState({
      scene: known_scenes.livingroom_bright,
      transitiontime: transitionTimes.set_scene,
    })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(day_and_on_rule);

  const night_and_on_normal_rule = hue.model.createRule();
  night_and_on_normal_rule.name = `${prefix} - night and on N`;
  night_and_on_normal_rule.recycle = false;

  night_and_on_normal_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_normal_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_sensor)
      .when("status")
      .equals(ActivityStatus.NORMAL)
  );
  night_and_on_normal_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("lastupdated").changed()
  );

  night_and_on_normal_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  night_and_on_normal_rule.addAction(
    hue.model.actions.group(groups["Living room"]).withState({
      scene: known_scenes.livingroom_osaka,
      transitiontime: transitionTimes.set_scene,
    })
  );
  night_and_on_normal_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_normal_rule);

  const night_and_on_relax_rule = hue.model.createRule();
  night_and_on_relax_rule.name = `${prefix} - night and on R`;
  night_and_on_relax_rule.recycle = false;

  night_and_on_relax_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_sensor)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_relax_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_sensor)
      .when("status")
      .equals(ActivityStatus.RELAX)
  );
  night_and_on_relax_rule.addCondition(
    hue.model.ruleConditions.sensor(status_sensor).when("lastupdated").changed()
  );

  night_and_on_relax_rule.addCondition(
    hue.model.ruleConditions
      .sensor(sensors.builtin_daylight)
      .when("daylight")
      .equals(false)
  );

  night_and_on_relax_rule.addAction(
    hue.model.actions.group(groups["Living room"]).withState({
      scene: known_scenes.livingroom_relax,
      transitiontime: transitionTimes.set_scene,
    })
  );
  night_and_on_relax_rule.addAction(
    hue.model.actions
      .sensor(status_sensor)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_relax_rule);

  return rules;
}
