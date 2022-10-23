import dotenv from "dotenv";
import { getApi } from "./utility";
import { Api } from "node-hue-api/dist/esm/api/Api";
import {
  auto_scene_hallway,
  auto_scene_kitchen,
  auto_scene_living_room,
} from "./static_resources";

// 9  - Hall 2
// 10 - Hall 1
// 11 - Hall 3
// 12 - Hall 4
// 13 - Hall 5

async function setHallwayAuto(api: Api) {
  const currentHour = getCurrentHour();
  let brightness: number;
  let num_on: number;
  if (currentHour <= 7) {
    brightness = 0;
    num_on = 1;
  } else if (currentHour <= 8) {
    brightness = 0;
    num_on = 2;
  } else if (currentHour <= 9) {
    brightness = 90;
    num_on = 2;
  } else if (currentHour <= 19) {
    brightness = 180;
    num_on = 5;
  } else if (currentHour <= 21) {
    brightness = 50;
    num_on = 3;
  } else {
    brightness = 50;
    num_on = 1;
  }

  return api.scenes.getScene(auto_scene_hallway).then((scene) => {
    for (const ls_id in scene.lightstates) {
      const ls = (scene.lightstates as any)[ls_id];
      ls["bri"] = brightness;
      ls["on"] = false;
    }

    const lights = Object.keys(scene.lightstates);
    shuffleArray(lights);
    while (num_on > 0 && lights.length > 0) {
      const ls_id = lights.pop()!;
      const ls = (scene.lightstates as any)[ls_id];
      ls["on"] = true;
      num_on--;
    }

    return api.scenes.updateScene(scene);
  });
}

async function setKitchenAuto(api: Api) {
  const currentHour = getCurrentHour();
  let brightness: number;
  if (currentHour <= 7) {
    brightness = 10;
  } else if (currentHour <= 8) {
    brightness = 30;
  } else if (currentHour <= 9) {
    brightness = 70;
  } else if (currentHour <= 19) {
    brightness = 254;
  } else if (currentHour <= 21) {
    brightness = 120;
  } else {
    brightness = 50;
  }

  return api.scenes.getScene(auto_scene_kitchen).then((scene) => {
    for (const ls_id in scene.lightstates) {
      const ls = (scene.lightstates as any)[ls_id];
      ls["bri"] = brightness;
    }
    return api.scenes.updateScene(scene);
  });
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function setLivingRoomAuto(api: Api) {
  const currentHour = getCurrentHour();
  let brightness: number;
  if (currentHour <= 7) {
    brightness = 10;
  } else if (currentHour <= 8) {
    brightness = 50;
  } else if (currentHour <= 9) {
    brightness = 90;
  } else if (currentHour <= 20) {
    brightness = 200;
  } else if (currentHour <= 21) {
    brightness = 120;
  } else {
    brightness = 50;
  }

  return api.scenes.getScene(auto_scene_living_room).then((scene) => {
    for (const ls_id in scene.lightstates) {
      const ls = (scene.lightstates as any)[ls_id];
      ls["bri"] = brightness;
    }

    return api.scenes.updateScene(scene);
  });
}

function getCurrentHour() {
  return new Date().getHours();
}

async function run() {
  const api = await getApi();

  try {
    await setHallwayAuto(api);
    console.log(`Hallway auto set`);
  } catch (error) {
    console.error(`Failed to set Hallway auto. Exiting. Error: ${error}`);
    throw error;
  }

  try {
    await setKitchenAuto(api);
    console.log(`Kitchen auto set`);
  } catch (error) {
    console.error(`Failed to set Kitchen auto. Exiting. Error: ${error}`);
    throw error;
  }

  try {
    await setLivingRoomAuto(api);
    console.log(`Living Room auto set`);
  } catch (error) {
    console.error(`Failed to set Living Room auto. Exiting. Error: ${error}`);
    throw error;
  }
}

dotenv.config();
run().catch((error) => {
  console.error(`Failure when running: ${error}`);
  console.error(error.stack);
});
