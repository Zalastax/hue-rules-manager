import { model, v3 as hue } from "node-hue-api";
import { motionSensorBaseRules } from "./motion_base_rules";
import { transitionTimes, activity_scenes, DayCycle } from "./static_resources";
import {
  ActivityStatus,
  LateNightRuleStatus,
  MotionRuleStatus,
} from "./variables";

declare type CLIPGenericStatus = model.CLIPGenericStatus;
declare type Room = model.Room;
declare type Rule = model.Rule;
declare type Sensor = model.Sensor;

function activityRule(
  prefix: string,
  status_variable: CLIPGenericStatus,
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
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  day_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
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
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(day_and_on_rule);

  const night_and_on_rule = hue.model.createRule();
  night_and_on_rule.name = `${prefix} A${activity} night and on`;
  night_and_on_rule.recycle = false;

  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
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
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(night_and_on_rule);

  const late_night_and_on_rule = hue.model.createRule();
  late_night_and_on_rule.name = `${prefix} A${activity} l8 night and on`;
  late_night_and_on_rule.recycle = false;

  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(status_variable)
      .when("status")
      .equals(MotionRuleStatus.SHOULD_TRIGGER_SCENE)
  );
  late_night_and_on_rule.addCondition(
    hue.model.ruleConditions
      .sensor(activity_status)
      .when("status")
      .equals(activity)
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
      .sensor(status_variable)
      .withState({ status: MotionRuleStatus.SCENE_TRIGGERED })
  );

  rules.push(late_night_and_on_rule);

  return rules;
}

export function activitiesRules(
  prefix: string,
  dim_delay: string,
  room: Room,
  status_variable: CLIPGenericStatus,
  late_night: CLIPGenericStatus,
  brightness: CLIPGenericStatus,
  activity_status: CLIPGenericStatus,
  presence: Sensor,
  light_level: Sensor,
  daylight: Sensor
) {
  const rules = motionSensorBaseRules(
    prefix,
    status_variable,
    presence,
    light_level,
    room,
    dim_delay,
    brightness
  );

  const activities = [
    ActivityStatus.NORMAL,
    ActivityStatus.RELAX,
    ActivityStatus.FOCUS,
    ActivityStatus.DINNER,
    ActivityStatus.TV,
  ];

  for (const activity of activities) {
    rules.push(
      ...activityRule(
        prefix,
        status_variable,
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
