import { model, v3 as hue } from "node-hue-api";
import { motionSensorBaseRules } from "./motion_base_rules";
import { transitionTimes } from "./static_resources";
import { ActivityStatus, MotionRuleStatus, SceneSetStatus } from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Room = model.Room;
declare type Rule = model.Rule;
declare type Sensor = model.Sensor;

function activityRule(
  prefix: string,
  status_variable: CLIPGenericStatus,
  scene_set_in_this_period: CLIPGenericStatus,
  activity_status: CLIPGenericStatus,
  room: Room,
  activity: ActivityStatus,
  activity_scenes: Record<ActivityStatus, string>
): Rule[] {
  const rules: Rule[] = [];
  const activity_changed_rule = hue.model.createRule();
  activity_changed_rule.name = `${prefix} - A${activity} on`;
  activity_changed_rule.recycle = false;

  activity_changed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.PLAN_GROUP_ON)
  );
  activity_changed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
  );
  activity_changed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_in_this_period)
      .when("status")
      .lessThan(SceneSetStatus.NOT_SET + 1)
  );
  activity_changed_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changed()
  );

  activity_changed_rule.addAction(
    hue.model.actions.group(room).withState({
      scene: activity_scenes[activity],
      transitiontime: transitionTimes.set_scene,
    })
  );
  activity_changed_rule.addAction(
    hue.model.actions
      .sensor(scene_set_in_this_period)
      .withState({ status: SceneSetStatus.SET })
  );
  activity_changed_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  rules.push(activity_changed_rule);

  return rules;
}

declare type LightScene = model.LightScene;
declare type GroupScene = model.GroupScene;
declare type SceneType = LightScene | GroupScene;

export function activitiesRules(
  prefix: string,
  dim_delay: string,
  room: Room,
  motion_rule_status_variable: CLIPGenericStatus,
  scene_set_status_variable: CLIPGenericStatus,
  activity_status: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor,
  tmp_scene: SceneType,
  activity_scenes: Record<ActivityStatus, string>
) {
  // (1) + (3) + (4) + (5) + (6) + (7)
  const rules = motionSensorBaseRules(
    prefix,
    motion_rule_status_variable,
    scene_set_status_variable,
    presence,
    light_level,
    room,
    dim_delay,
    tmp_scene
  );

  const activities = [
    ActivityStatus.FOCUS,
    ActivityStatus.NORMAL,
    ActivityStatus.DINNER,
    ActivityStatus.RELAX,
    ActivityStatus.TV,
  ];

  for (const activity of activities) {
    // (2)
    rules.push(
      ...activityRule(
        prefix,
        motion_rule_status_variable,
        scene_set_status_variable,
        activity_status,
        room,
        activity,
        activity_scenes
      )
    );
  }

  return rules;
}

function groupOnRules(
  prefix: string,
  status_variable: CLIPGenericStatus,
  scene_set_in_this_period: CLIPGenericStatus,
  group: string | number | model.Group,
  scene: string
): Rule[] {
  const rules: Rule[] = [];
  const group_on_rule = hue.model.createRule();
  group_on_rule.name = `${prefix} - group on`;
  group_on_rule.recycle = false;

  group_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.PLAN_GROUP_ON)
  );

  group_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_in_this_period)
      .when("status")
      .lessThan(SceneSetStatus.NOT_SET + 1)
  );

  group_on_rule.addAction(
    hue.model.actions.group(group).withState({
      scene: scene,
      transitiontime: transitionTimes.set_scene,
    })
  );
  group_on_rule.addAction(
    hue.model.actions
      .sensor(scene_set_in_this_period)
      .withState({ status: SceneSetStatus.SET })
  );
  group_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  rules.push(group_on_rule);

  return rules;
}

export function onlyAutoRules(
  prefix: string,
  motion_rule_status_variable: CLIPGenericStatus,
  scene_set_status_variable: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor,
  group: string | number | model.Group,
  dim_delay: string,
  tmp_scene: SceneType,
  on_scene: string
) {
  // (1) + (3) + (4) + (5) + (6) + (7)
  const rules = motionSensorBaseRules(
    prefix,
    motion_rule_status_variable,
    scene_set_status_variable,
    presence,
    light_level,
    group,
    dim_delay,
    tmp_scene
  );

  const group_on_rules = groupOnRules(
    prefix,
    motion_rule_status_variable,
    scene_set_status_variable,
    group,
    on_scene
  );

  rules.push(...group_on_rules);

  return rules;
}
