import { model, v3 as hue } from "node-hue-api";
import { motionSensorBaseRules } from "./motion_base_rules";
import {
  transitionTimes,
  activity_scenes,
  DayCycle,
  KnownGroups,
  KnownSensors,
} from "./static_resources";
import {
  ActivityStatus,
  LateNightRuleStatus,
  MotionRuleStatus,
  SceneSetStatus,
} from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Room = model.Room;
declare type Rule = model.Rule;
declare type Sensor = model.Sensor;

// Turn on lights in group while changing scene.
// This is implemented using several rules:
// Set Status to GROUP_ON if Status is PLAN_GROUP_ON and
// scene has not already been set once for this activity and period of day.
// What scene to set is based on the matrix activity × daylight × late_night_status.
// Status transitions from PLAN_GROUP_ON to GROUP_ON (2).
function activityRule(
  prefix: string,
  status_variable: CLIPGenericStatus,
  scene_set_in_this_period: CLIPGenericStatus,
  late_night_status: CLIPGenericStatus,
  activity_status: CLIPGenericStatus,
  room: Room,
  daylight: Sensor,
  activity: ActivityStatus
): Rule[] {
  const rules: Rule[] = [];
  const day_and_on_rule = hue.model.createRule();
  day_and_on_rule.name = `${prefix} A${activity} day and on`;
  day_and_on_rule.recycle = false;

  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.PLAN_GROUP_ON)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_in_this_period)
      .when("status")
      .lessThan(SceneSetStatus.WAS_SET)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changed()
  );

  day_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(daylight).when("daylight").equals(true)
  );

  day_and_on_rule.addAction(
    hue.model.actions.group(room).withState({
      scene: activity_scenes[activity][DayCycle.DAY],
      transitiontime: transitionTimes.set_scene,
    })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(scene_set_in_this_period)
      .withState({ status: SceneSetStatus.WAS_SET })
  );
  day_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  rules.push(day_and_on_rule);

  const night_and_on_rule = hue.model.createRule();
  night_and_on_rule.name = `${prefix} A${activity} night and on`;
  night_and_on_rule.recycle = false;

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.PLAN_GROUP_ON)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_in_this_period)
      .when("status")
      .lessThan(SceneSetStatus.WAS_SET)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changed()
  );

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status)
      .when("status")
      .equals(LateNightRuleStatus.NOT_LATE_NIGHT)
  );

  night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(daylight).when("daylight").equals(false)
  );

  night_and_on_rule.addAction(
    hue.model.actions.group(room).withState({
      scene: activity_scenes[activity][DayCycle.EARLY_NIGHT],
      transitiontime: transitionTimes.set_scene,
    })
  );
  night_and_on_rule.addAction(
    hue.model.actions
      .sensor(scene_set_in_this_period)
      .withState({ status: SceneSetStatus.WAS_SET })
  );
  night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  rules.push(night_and_on_rule);

  const late_night_and_on_rule = hue.model.createRule();
  late_night_and_on_rule.name = `${prefix} A${activity} l8 night and on`;
  late_night_and_on_rule.recycle = false;

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.PLAN_GROUP_ON)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(scene_set_in_this_period)
      .when("status")
      .lessThan(SceneSetStatus.WAS_SET)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("lastupdated")
      .changed()
  );

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(late_night_status)
      .when("status")
      .equals(LateNightRuleStatus.IS_LATE_NIGHT)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions.sensor(daylight).when("daylight").equals(false)
  );

  late_night_and_on_rule.addAction(
    hue.model.actions.group(room).withState({
      scene: activity_scenes[activity][DayCycle.LATE_NIGHT],
      transitiontime: transitionTimes.set_scene,
    })
  );
  late_night_and_on_rule.addAction(
    hue.model.actions
      .sensor(scene_set_in_this_period)
      .withState({ status: SceneSetStatus.WAS_SET })
  );
  late_night_and_on_rule.addAction(
    hue.model.actions
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.GROUP_ON })
  );

  rules.push(late_night_and_on_rule);

  return rules;
}

export function resetStatusesRules(
  groups: KnownGroups,
  activity: CLIPGenericStatus
) {
  const rules: Rule[] = [];
  const prefix = "all off";

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
      .sensor(activity)
      .withState({ status: ActivityStatus.NORMAL })
  );

  rules.push(off_long_time_rule);

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
  late_night: CLIPGenericStatus,
  activity_status: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor,
  daylight: Sensor,
  tmp_scene: SceneType
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
        late_night,
        activity_status,
        room,
        daylight,
        activity
      )
    );
  }

  return rules;
}
