import { model, v3 as hue } from "node-hue-api";
import { transitionTimes } from "./static_resources";
import {
  MotionRuleStatus,
  BrightnessLevel,
  DIMMING_TIME,
  SceneSetStatus,
  DIMMING_TIME_TIMESTAMP,
} from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Group = model.Group;
declare type Rule = model.Rule;
declare type Sensor = model.Sensor;

// TODO: Rewrite these comments to reflect restructure
// Motion Rule Status (MRStatus) Transitions:
// 1. ARMED -> PLAN_GROUP_ON if presence is detected while it is dark.
// 2. PLAN_GROUP_ON -> GROUP_ON implemented by rules per activity and period of day.
//    Does not trigger if Scene was set in this period of day.
// 3. PLAN_GROUP_ON -> GROUP_ON if scene has already been set
//    once for this activity and period of day.
// 4. GROUP_ON -> DIMMED when Presence is not detected, with a delay of dim_delay.
// 5. DIMMED -> PLAN_GROUP_ON when Presence is detected.
// 6. Anything -> ARMED when Presence is not detected and no lights in the group are on.
// 7. GROUP_ON -> PLAN_GROUP_ON when Scene should change immediately.

// Transition to state where lights will turn on.
// This is implemented using one rule:
// 1. Set MRStatus to PLAN_GROUP_ON if MRStatus is ARMED
//    AND Light level is Dark AND Presence is detected.
// MRStatus transitions from ARMED to PLAN_GROUP_ON (1).
function planGroupOnRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor
) {
  const presence_on_rule = hue.model.createRule();
  presence_on_rule.name = `${prefix} - on`;
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

  presence_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.PLAN_GROUP_ON })
  );

  return [presence_on_rule];
}

// Dims if Presence is not detected, with a delay of dim_delay.
// This is implemented using three rules:
// 1. Stores lightstates and transitions MRStatus to DIMMED if
//    MRStatus has been GROUP_ON for dim_delay time AND Presence is not detected.
// 2. Stores lightstates and transitions MRStatus to DIMMED if
//    Presence has not been detected for dim_delay time AND MRStatus is GROUP_ON.
// 3. Dims if MRStatus is DIMMED.
// Dimming is implemented by setting group "on" state to false.
// MRStatus transitions from GROUP_ON to DIMMED (4).
function dimRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  group: string | number | Group,
  dim_delay: string,
  tmp_scene: SceneType
) {
  const dim_status_rule = hue.model.createRule();
  dim_status_rule.name = `${prefix} - dim status`;
  dim_status_rule.recycle = false;

  dim_status_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.GROUP_ON)
  );
  dim_status_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changedDelayed(dim_delay as any) // changedDelayed seems ill-typed
  );
  dim_status_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );

  dim_status_rule.addAction(
    hue.model.actions.scene(tmp_scene).withState({ storelightstate: true })
  );

  dim_status_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.DIMMED })
  );

  // Set status to GROUP_ON when it's already GROUP_ON if presence
  // is detected.
  // By refreshing status, the previous rule does not trigger too early.
  const refresh_group_on_rule = hue.model.createRule();
  refresh_group_on_rule.name = `${prefix} - refresh on`;
  refresh_group_on_rule.recycle = false;

  refresh_group_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.GROUP_ON)
  );
  refresh_group_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("lastupdated").changed()
  );
  refresh_group_on_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );
  refresh_group_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  const dimmed_perform_rule = hue.model.createRule();
  dimmed_perform_rule.name = `${prefix} - dim perform`;
  dimmed_perform_rule.recycle = false;

  dimmed_perform_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.DIMMED)
  );

  dimmed_perform_rule.addAction(
    hue.model.actions
      .group(group)
      .withState({ transitiontime: DIMMING_TIME, bri_inc: -100 })
  );

  return [dim_status_rule, refresh_group_on_rule, dimmed_perform_rule];
}

function dimmedToOffRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  group: string | number | Group
) {
  const off_rule = hue.model.createRule();
  off_rule.name = `${prefix} - off`;
  off_rule.recycle = false;

  off_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.DIMMED)
  );

  off_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(false)
  );

  off_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changedDelayed(DIMMING_TIME_TIMESTAMP as any) // changedDelayed seems ill-typed
  );

  off_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.ARMED })
  );

  off_rule.addAction(hue.model.actions.group(group).withState({ on: false }));

  return [off_rule];
}

// Recovers lights when Dimming and Presence is detected.
// This is implemented using one rule:
// 1. Set MRStatus to PLAN_GROUP_ON if MRStatus is DIMMED AND Presence is detected.
// MRStatus transitions from DIMMED to PLAN_GROUP_ON (5).
function recoverFromDimmedRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor
) {
  const recover_dimmed_rule = hue.model.createRule();
  recover_dimmed_rule.name = `${prefix} - recover`;
  recover_dimmed_rule.recycle = false;

  recover_dimmed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.DIMMED)
  );

  recover_dimmed_rule.addCondition(
    hue.model.ruleConditions.sensor(presence).when("presence").equals(true)
  );

  recover_dimmed_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.PLAN_GROUP_ON })
  );

  return [recover_dimmed_rule];
}

// In case something goes wrong with the status,
// this resets the status to 0, when all lights are off.
// This is implemented using one rule:
// 1. Set MRStatus to ARMED if Presence is not detected and no lights in the group are on.
// MRStatus transitions to ARMED (6).
function armRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  presence: Sensor,
  group: string | number | Group
) {
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

  return [arm_rule];
}

// Turn on lights in group without changing scene.
// This is implemented using one rule:
// 1. Set Status to GROUP_ON and turn on group to stored lightstate
// if Status is PLAN_GROUP_ON and scene has already
// been set once for this activity and period of day.
// Status transitions from PLAN_GROUP_ON to GROUP_ON (3).
function groupOnRecoverRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  scene_set_in_this_period: CLIPGenericStatus,
  group: string | number | Group,
  tmp_scene: SceneType
): Rule[] {
  const group_on_recover_rule = hue.model.createRule();
  group_on_recover_rule.name = `${prefix} group on recover`;
  group_on_recover_rule.recycle = false;

  group_on_recover_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.PLAN_GROUP_ON)
  );
  group_on_recover_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_in_this_period)
      .when("status")
      .equals(SceneSetStatus.SET)
  );
  group_on_recover_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changed()
  );

  group_on_recover_rule.addAction(
    hue.model.actions.group(group).withState({
      scene: tmp_scene.id,
      transitiontime: transitionTimes.set_scene,
    })
  );
  group_on_recover_rule.addAction(
    hue.model.actions
      .sensor(scene_set_in_this_period)
      .withState({ status: SceneSetStatus.SET })
  );
  group_on_recover_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  return [group_on_recover_rule];
}

// Trigger Scene change immediately, e.g. when changing activity.
// This is implemented using one rule:
// 1. Set MRStatus to PLAN_GROUP_ON if MRStatus is GROUP_ON and
//    Scene Set Status is SCHEDULE_IMMEDIATELY.
// MRStatus transitions from GROUP_ON to PLAN_GROUP_ON (7).
function immediateSceneChangeRules(
  prefix: string,
  motion_rule_status_variable: CLIPGenericStatus,
  scene_set_status_variable: CLIPGenericStatus
) {
  const immediate_rule = hue.model.createRule();
  immediate_rule.name = `${prefix} - immediate`;
  immediate_rule.recycle = false;

  immediate_rule.addCondition(
    hue.model.ruleConditions
      .sensor(motion_rule_status_variable)
      .when("status")
      .equals(MotionRuleStatus.GROUP_ON)
  );
  immediate_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_status_variable)
      .when("status")
      .equals(SceneSetStatus.NOT_SET)
  );

  immediate_rule.addAction(
    hue.model.actions
      .sensor(motion_rule_status_variable)
      .withState({ status: MotionRuleStatus.PLAN_GROUP_ON })
  );

  return [immediate_rule];
}

declare type LightScene = model.LightScene;
declare type GroupScene = model.GroupScene;
declare type SceneType = LightScene | GroupScene;

export function motionSensorBaseRules(
  prefix: string,
  motion_rule_status_variable: CLIPGenericStatus,
  scene_set_status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor,
  group: string | number | Group,
  dim_delay: string,
  tmp_scene: SceneType
): Rule[] {
  // (1)
  const plan_on_rules = planGroupOnRules(
    prefix,
    motion_rule_status_variable,
    presence,
    light_level
  );

  // (3)
  const group_on_recover_rules = groupOnRecoverRules(
    prefix,
    motion_rule_status_variable,
    scene_set_status_variable,
    group,
    tmp_scene
  );

  // (4)
  const dim_rules = dimRules(
    prefix,
    motion_rule_status_variable,
    presence,
    group,
    dim_delay,
    tmp_scene
  );

  const off_rules = dimmedToOffRules(
    prefix,
    motion_rule_status_variable,
    presence,
    group
  );

  // (5)
  const recover_rules = recoverFromDimmedRules(
    prefix,
    motion_rule_status_variable,
    presence
  );

  // (6)
  const arm_rules = armRules(
    prefix,
    motion_rule_status_variable,
    presence,
    group
  );

  // (7)
  const immediate_rules = immediateSceneChangeRules(
    prefix,
    motion_rule_status_variable,
    scene_set_status_variable
  );

  return [
    ...plan_on_rules,
    ...group_on_recover_rules,
    ...dim_rules,
    ...off_rules,
    ...recover_rules,
    ...arm_rules,
    ...immediate_rules,
  ];
}
