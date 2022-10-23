import dotenv from "dotenv";
import { getApi } from "./utility";
import { Api } from "node-hue-api/dist/esm/api/Api";
import {
  auto_scene_hallway,
  auto_scene_kitchen,
  auto_scene_living_room,
  getGroups,
  getSensors,
} from "./static_resources";

function ruleStatusString(rs: number) {
  if (rs == 0) {
    return "ARMED";
  } else if (rs == 1) {
    return "PLAN_GROUP_ON";
  } else if (rs == 2) {
    return "GROUP_ON";
  } else if (rs == 3) {
    return "DIMMED";
  }
  return "UNKNWON: " + rs;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function startRun() {
  const api = await getApi();
  await run(api, {
    any_on: undefined,
    presence: { lastupdated: undefined, presence: undefined },
    status: { lastupdated: undefined, status: "" },
    date: new Date(),
  });
}

async function run(
  api: Api,
  last_interesting_data: {
    any_on: any;
    date: Date;
    presence: {
      lastupdated: any;
      presence: any;
    };
    status: {
      lastupdated: any;
      status: string;
    };
  }
) {
  const known_groups = await getGroups(api);
  const known_sensors = await getSensors(api);

  const presence_sensor = await api.sensors.getSensor(
    known_sensors.livingroom_presence
  );
  const status_sensor = await api.sensors.getSensor("136");

  const interesting_data = {
    any_on: (known_groups["Living room"].state as any)["any_on"],
    date: new Date(),
    presence: {
      lastupdated: presence_sensor.getStateAttributeValue("lastupdated"),
      presence: presence_sensor.getStateAttributeValue("presence"),
    },
    status: {
      lastupdated: status_sensor.getStateAttributeValue("lastupdated"),
      status: ruleStatusString(status_sensor.getStateAttributeValue("status")),
    },
  };

  if (
    last_interesting_data.any_on !== interesting_data.any_on ||
    last_interesting_data.presence.lastupdated !==
      interesting_data.presence.lastupdated ||
    last_interesting_data.presence.presence !==
      interesting_data.presence.presence ||
    last_interesting_data.status.lastupdated !==
      interesting_data.status.lastupdated ||
    last_interesting_data.status.status !== interesting_data.status.status
  ) {
    console.log(
      `${interesting_data.date.toISOString()},${interesting_data.any_on},${
        interesting_data.status.status
      },${interesting_data.status.lastupdated},${
        interesting_data.presence.presence
      },${interesting_data.presence.lastupdated}`
    );
  }
  await sleep(2000);
  run(api, interesting_data);
}

dotenv.config();
startRun().catch((error) => {
  console.error(`Failure when running: ${error}`);
  console.error(error.stack);
});
