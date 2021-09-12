import { model, v3 as hue } from "node-hue-api";
import { transitionTimes } from "./static_resources";
import { MotionRuleStatus, BrightnessLevel } from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Group = model.Group;
declare type Rule = model.Rule;
declare type Sensor = model.Sensor;

function presenceOnRule(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor
) {
  const presence_on_rule = hue.model.createRule();
  presence_on_rule.name = `${prefix} - presence on`;
  presence_on_rule.recycle = false;

  presence_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.ARMED)
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
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
  );

  return presence_on_rule;
}

function darkOnRule(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor
) {
  const dark_on_rule = hue.model.createRule();
  dark_on_rule.name = `${prefix} - dark on`;
  dark_on_rule.recycle = false;

  dark_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.ARMED)
  );
  dark_on_rule.addCondition(
    hue.model.ruleConditions.sensor(light_level).when("dark").equals(true)
  );
  dark_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );
  dark_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").changed()
  );

  dark_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
  );

  return dark_on_rule;
}

function onRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor
) {
  return [
    presenceOnRule(prefix, status_variable, presence, light_level),

    darkOnRule(prefix, status_variable, presence, light_level),
  ];
}

function brightnessRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  group: string | number | Group,
  brightness_status: CLIPGenericStatus
) {
  const levels = {
    [BrightnessLevel.BRIGHT]: "35",
    [BrightnessLevel.VERY_BRIGHT]: "128",
    [BrightnessLevel.DIMMED]: "-35",
    [BrightnessLevel.VERY_DIMMED]: "-128",
  };

  const bright = hue.model.createRule();
  bright.name = `${prefix} - dim lvl bright`;
  bright.recycle = true;

  bright.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  bright.addCondition(
    hue.model.ruleConditions
      .sensor(brightness_status)
      .when("status")
      .equals(BrightnessLevel.BRIGHT)
  );
  // use when status changed instead of when lastupdated changed so that
  // we don't trigger again when recover rule sets SCENE_TRIGGERED again.
  bright.addCondition(
    hue.model.ruleConditions.sensor(status_variable).when("status").changed()
  );
  bright.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: levels[BrightnessLevel.BRIGHT],
      transitiontime: transitionTimes.dimming,
    })
  );

  const very_bright = hue.model.createRule();
  very_bright.name = `${prefix} - dimming vb`;
  very_bright.recycle = true;

  very_bright.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  very_bright.addCondition(
    hue.model.ruleConditions
      .sensor(brightness_status)
      .when("status")
      .equals(BrightnessLevel.VERY_BRIGHT)
  );
  very_bright.addCondition(
    hue.model.ruleConditions.sensor(status_variable).when("status").changed()
  );
  very_bright.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: levels[BrightnessLevel.VERY_BRIGHT],
      transitiontime: transitionTimes.dimming,
    })
  );

  const dimmed = hue.model.createRule();
  dimmed.name = `${prefix} - dim lvl dimmed`;
  dimmed.recycle = true;

  dimmed.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  dimmed.addCondition(
    hue.model.ruleConditions.sensor(status_variable).when("status").changed()
  );
  dimmed.addCondition(
    hue.model.ruleConditions
      .sensor(brightness_status)
      .when("status")
      .equals(BrightnessLevel.DIMMED)
  );

  dimmed.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: levels[BrightnessLevel.DIMMED],
      transitiontime: transitionTimes.dimming,
    })
  );

  const very_dimmed = hue.model.createRule();
  very_dimmed.name = `${prefix} - dim lvl vd`;
  very_dimmed.recycle = true;

  very_dimmed.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  very_dimmed.addCondition(
    hue.model.ruleConditions.sensor(status_variable).when("status").changed()
  );
  very_dimmed.addCondition(
    hue.model.ruleConditions
      .sensor(brightness_status)
      .when("status")
      .equals(BrightnessLevel.VERY_DIMMED)
  );

  very_dimmed.addAction(
    hue.model.actions.group(group).withState({
      bri_inc: levels[BrightnessLevel.VERY_DIMMED],
      transitiontime: transitionTimes.dimming,
    })
  );

  return [very_bright, bright, dimmed, very_dimmed];
}

function dimRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  group: string | number | Group,
  dim_delay: string
) {
  const dim_status_rule = hue.model.createRule();
  dim_status_rule.name = `${prefix} - dim status`;
  dim_status_rule.recycle = false;

  dim_status_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  dim_status_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changedDelayed(dim_delay as any) // changedDelayed seems ill-types
  );
  dim_status_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );

  dim_status_rule.addAction(
    hue.model.actions.group(group).withState({ bri_inc: "-128" })
  );
  dim_status_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.DIMMED })
  );

  const dim_presence_rule = hue.model.createRule();
  dim_presence_rule.name = `${prefix} - dim presence`;
  dim_presence_rule.recycle = false;

  dim_presence_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  dim_presence_rule.addCondition(
    hue.model.ruleConditions
      .sensor(presence)
      .when("presence")
      .changedDelayed(dim_delay as any) // changedDelayed seems ill-types
  );
  dim_presence_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );

  dim_presence_rule.addAction(
    hue.model.actions.group(group).withState({ bri_inc: "-128" })
  );
  dim_presence_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.DIMMED })
  );

  return [dim_status_rule, dim_presence_rule];
}

export function motionSensorBaseRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor,
  group: string | number | Group,
  dim_delay: string,
  brightness_status: CLIPGenericStatus
): Rule[] {
  // From ARMED to SHOULD_TRIGGER_SCENE
  const on_rules = onRules(prefix, status_variable, presence, light_level);

  // Then the specific rules go from SHOULD_TRIGGER_SCENE to SCENE_TRIGGERED

  // When SCENE_TRIGGERED
  const brightness_rules = brightnessRules(
    prefix,
    status_variable,
    group,
    brightness_status
  );

  const dim_rules = dimRules(
    prefix,
    status_variable,
    presence,
    group,
    dim_delay
  );

  // From SCENE_TRIGGERED
  // To SCENE_TRIGGERED
  // So that dim status rule is reset
  const recover_scense_triggered_rule = hue.model.createRule();
  recover_scense_triggered_rule.name = `${prefix} - recover 1`;
  recover_scense_triggered_rule.recycle = false;

  recover_scense_triggered_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SCENE_TRIGGERED)
  );
  recover_scense_triggered_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").changed()
  );
  recover_scense_triggered_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );

  recover_scense_triggered_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  // From DIMMED
  // To SHOULD_TRIGGER_SCENE
  // So that scene and brightness is set again
  const recover_dimmed_rule = hue.model.createRule();
  recover_dimmed_rule.name = `${prefix} - recover 2`;
  recover_dimmed_rule.recycle = false;

  recover_dimmed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.DIMMED)
  );
  recover_dimmed_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").changed()
  );
  recover_dimmed_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );

  recover_dimmed_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SHOULD_TRIGGER_SCENE })
  );

  const off_rule = hue.model.createRule();
  off_rule.name = `${prefix} - off`;
  off_rule.recycle = false;

  off_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );
  off_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.DIMMED)
  );
  off_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .changedDelayed("PT00:01:00" as any)
  );
  off_rule.addAction(hue.model.actions.group(group).withState({ on: false }));
  off_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.ARMED })
  );

  const arm_rule = hue.model.createRule();
  arm_rule.name = `${prefix} - arm`;
  arm_rule.recycle = false;

  arm_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );
  arm_rule.addCondition(
    hue.model.ruleConditions.group(group).when().anyOn().equals(false)
  );

  arm_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.ARMED })
  );

  return [
    ...on_rules,
    ...dim_rules,
    recover_scense_triggered_rule,
    recover_dimmed_rule,
    off_rule,
    arm_rule,
    ...brightness_rules,
  ];
}
